import { useEffect, useMemo, useState } from 'react';
import { X, Check, Truck, Building2, Loader2, ShoppingBag, UserRound, Phone, MapPin, Home, Palette, Ruler } from 'lucide-react';
import type { Order, Product } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { formatPrice, generateOrderNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getCommunesForWilaya } from '@/data/algeriaData';

interface Props { product: Product; onClose: () => void; }
type Step = 'form' | 'submitting' | 'success';

export default function CheckoutModal({ product, onClose }: Props) {
  const { shippingRates, settings, refreshProducts, trackAbandonedCart } = useStore();
  const { t, dir } = useI18n();
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
  const [quantity, setQuantity] = useState(1);
  const [wilayaCode, setWilayaCode] = useState('');
  const [commune, setCommune] = useState('');
  const [shippingType, setShippingType] = useState<'home' | 'desk'>('home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const currentPrice = product.sale_price ?? product.price;
  const selectedRate = shippingRates.find((rate) => rate.wilaya_code === wilayaCode);
  const shippingCost = settings?.free_shipping ? 0 : selectedRate ? shippingType === 'home' ? selectedRate.home_delivery_cost : selectedRate.stop_desk_cost : 0;
  const total = currentPrice * quantity + shippingCost;

  const communes = useMemo(() => getCommunesForWilaya(wilayaCode), [wilayaCode]);

  const selectedColorObj = product.colors?.find((c) => c.name === selectedColor);
  const summaryImage = selectedColorObj && selectedColorObj.image_index < product.images.length
    ? product.images[selectedColorObj.image_index]
    : product.images[0] || '';

  useEffect(() => {
    setCommune('');
  }, [wilayaCode]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const saveAbandonedCart = () => {
    if (!fullName && !phone && !wilayaCode) return;
    void trackAbandonedCart({ product_id: product.id, product_name: product.name, customer_name: fullName, phone, wilaya_code: wilayaCode, wilaya_name: selectedRate?.wilaya_name || '', selected_size: selectedSize, quantity, step_reached: wilayaCode ? 'delivery' : phone ? 'contact' : 'size', shipping_cost: shippingCost, total });
  };

  const close = () => { if (step === 'form') saveAbandonedCart(); onClose(); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!fullName.trim() || !phone.trim() || !wilayaCode || !commune.trim()) { setError(t('checkout.fillAll')); return; }
    if (!/^[0-9+\s-]{8,}$/.test(phone.trim())) { setError(t('checkout.invalidPhone')); return; }
    if (product.colors && product.colors.length > 0 && !selectedColor) { setError(t('checkout.fillAll')); return; }
    setStep('submitting');
    const orderNumber = generateOrderNumber();
    const newOrder: Partial<Order> = { order_number: orderNumber, customer_name: fullName.trim(), phone_1: phone.trim(), phone_2: '', wilaya_code: wilayaCode, wilaya_name: selectedRate?.wilaya_name || '', commune: commune.trim(), shipping_type: shippingType, product_id: product.id, product_name: product.name, product_size: `${selectedSize}${selectedColor ? ' / ' + selectedColor : ''}`, quantity, unit_price: currentPrice, shipping_cost: shippingCost, total, status: 'جديد' };
    const { data, error: insertError } = await supabase.from('orders').insert(newOrder).select().maybeSingle();
    if (insertError || !data) { setError(t('checkout.failed')); setStep('form'); return; }
    await supabase.from('products').update({ stock: Math.max(0, product.stock - quantity) }).eq('id', product.id);
    await refreshProducts();
    if (settings?.webhook_url) { try { await fetch(settings.webhook_url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOrder, order_id: data.id }) }); } catch { /* external sync is optional */ } }
    setPlacedOrder(data as Order);
    setStep('success');
  };

  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir={dir}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
    <div className="relative bg-white text-neutral-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[94vh] overflow-y-auto shadow-2xl">
      {step === 'success' && placedOrder ? <div className="p-7 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4"><Check className="w-8 h-8 text-green-600" /></div>
        <h2 className="text-2xl font-bold mb-2">{t('checkout.orderConfirmed')}</h2><p className="text-neutral-500 mb-6">{t('checkout.orderSuccessDesc')}</p>
        <div className="bg-neutral-50 rounded-2xl p-4 text-right space-y-2 mb-6"><div className="flex justify-between"><span className="text-neutral-500 text-sm">{t('checkout.orderId')}</span><span className="font-mono font-semibold text-sm">{placedOrder.order_number}</span></div><div className="flex justify-between"><span className="text-neutral-500 text-sm">{t('checkout.deliveryTo')}</span><span className="font-medium text-sm">{placedOrder.wilaya_name}</span></div><div className="flex justify-between border-t border-neutral-200 pt-2"><span className="font-semibold">{t('checkout.total')}</span><span className="font-bold" style={{ color: 'var(--accent)' }}>{formatPrice(placedOrder.total)}</span></div></div>
        <p className="text-sm text-neutral-400 mb-6">{t('checkout.saveId')}</p><div className="flex gap-3"><a href={`/track?id=${placedOrder.order_number}`} className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-semibold text-sm text-center">{t('checkout.trackBtn')}</a><button onClick={onClose} className="flex-1 py-3 rounded-xl border border-neutral-200 font-semibold text-sm">{t('checkout.continueShopping')}</button></div>
      </div> : <>
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10"><div className="flex items-center gap-3"><img src={summaryImage} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-neutral-100" /><div><h3 className="font-semibold text-sm">{product.name}</h3><p className="text-xs text-neutral-400">{formatPrice(currentPrice)}</p></div></div><button onClick={close} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-3 gap-2 px-5 pt-5"><Step number="1" label={t('checkout.step1')} active={step === 'form'} /><Step number="2" label={t('checkout.step2')} active={Boolean(fullName || phone)} /><Step number="3" label={t('checkout.step3')} active={Boolean(wilayaCode && commune)} /></div>
        <form onSubmit={submit} className="p-5 space-y-5">
          {/* Size + Color selection with summary */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <FieldLabel icon={Ruler} label={t('product.size')} />
              <div className="flex flex-wrap gap-2">{product.sizes.map((size) => <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 rounded-xl text-sm font-medium ${selectedSize === size ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{size}</button>)}</div>
            </div>
            {product.colors && product.colors.length > 0 && <div className="flex-1">
              <FieldLabel icon={Palette} label={t('checkout.selectedColor')} />
              <div className="flex flex-wrap gap-2">{product.colors.map((color) => <button type="button" key={color.name} onClick={() => setSelectedColor(color.name)} title={color.name} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedColor === color.name ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}><span className="w-4 h-4 rounded-full border border-neutral-300" style={{ background: color.hex }} /><span>{color.name}</span></button>)}</div>
            </div>}
          </div>
          {/* Side-by-side summary of selected size and color */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2.5 bg-neutral-50 rounded-xl px-4 py-3"><Ruler className="w-5 h-5 text-[#b88632] shrink-0" /><div className="min-w-0"><p className="text-xs text-neutral-400">{t('checkout.selectedSize')}</p><p className="text-sm font-bold truncate">{selectedSize || '—'}</p></div></div>
            {product.colors && product.colors.length > 0 && <div className="flex-1 flex items-center gap-2.5 bg-neutral-50 rounded-xl px-4 py-3">{selectedColorObj ? <span className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" style={{ background: selectedColorObj.hex }} /> : <Palette className="w-5 h-5 text-[#b88632] shrink-0" />}<div className="min-w-0"><p className="text-xs text-neutral-400">{t('checkout.selectedColor')}</p><p className="text-sm font-bold truncate">{selectedColor || '—'}</p></div></div>}
          </div>
          <div><FieldLabel icon={UserRound} label={t('checkout.fullName')} /><input value={fullName} onChange={(event) => setFullName(event.target.value)} className="form-input" placeholder={t('checkout.fullName')} required /></div>
          <div><FieldLabel icon={Phone} label={t('checkout.phone')} /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="form-input" placeholder="06 00 00 00 00" required /></div>
          <div><FieldLabel icon={MapPin} label={t('checkout.wilaya')} /><select value={wilayaCode} onChange={(event) => setWilayaCode(event.target.value)} className="form-input" required><option value="">{t('checkout.selectWilaya')}</option>{shippingRates.map((rate) => <option key={rate.wilaya_code} value={rate.wilaya_code}>{rate.wilaya_code} - {rate.wilaya_name}</option>)}</select></div>
          <div><FieldLabel icon={Home} label={t('checkout.commune')} /><select value={commune} onChange={(event) => setCommune(event.target.value)} className="form-input" required disabled={!wilayaCode}><option value="">{wilayaCode ? t('checkout.selectCommune') : t('checkout.selectWilayaFirst')}</option>{communes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><FieldLabel icon={Truck} label={t('checkout.deliveryType')} /><div className="grid grid-cols-2 gap-3"><DeliveryButton active={shippingType === 'home'} onClick={() => setShippingType('home')} icon={Truck} label={t('checkout.homeDelivery')} cost={selectedRate?.home_delivery_cost ?? 0} free={Boolean(settings?.free_shipping)} /><DeliveryButton active={shippingType === 'desk'} onClick={() => setShippingType('desk')} icon={Building2} label={t('checkout.stopDesk')} cost={selectedRate?.stop_desk_cost ?? 0} free={Boolean(settings?.free_shipping)} /></div></div>
          <div className="bg-neutral-50 rounded-2xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-neutral-500">{t('checkout.productTotal')} ({quantity}× {selectedSize})</span><span>{formatPrice(currentPrice * quantity)}</span></div><div className="flex justify-between text-sm"><span className="text-neutral-500">{t('checkout.shipping')}</span><span>{shippingCost ? formatPrice(shippingCost) : 'مجاني'}</span></div><div className="flex justify-between border-t border-neutral-200 pt-2"><span className="font-semibold">{t('checkout.total')}</span><span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{formatPrice(total)}</span></div></div>
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={step === 'submitting' || !wilayaCode} className="w-full py-4 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">{step === 'submitting' ? <><Loader2 className="w-5 h-5 animate-spin" />{t('checkout.placing')}</> : <><Check className="w-5 h-5" />{t('checkout.confirm')}</>}</button>
          <p className="text-center text-xs text-neutral-500">{t('checkout.trustBadge')}</p>
        </form>
      </>}
    </div>
  </div>;
}

function Step({ number, label, active }: { number: string; label: string; active: boolean }) { return <div className={`text-center text-[11px] font-medium ${active ? 'text-neutral-900' : 'text-neutral-400'}`}><span className={`inline-flex w-7 h-7 items-center justify-center rounded-full mb-1 ${active ? 'bg-[#d7ad5e] text-black' : 'bg-neutral-100'}`}>{number}</span><span className="block">{label}</span></div>; }
function FieldLabel({ icon: Icon, label }: { icon: typeof UserRound; label: string }) { return <label className="flex items-center gap-2 text-sm font-semibold mb-1.5"><Icon className="w-4 h-4 text-[#b88632]" />{label}</label>; }
function DeliveryButton({ active, onClick, icon: Icon, label, cost, free }: { active: boolean; onClick: () => void; icon: typeof Truck; label: string; cost: number; free: boolean }) { return <button type="button" onClick={onClick} className={`p-3 rounded-xl border-2 text-right transition-all ${active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}><Icon className="w-5 h-5 mb-1 text-[#b88632]" /><p className="text-sm font-semibold">{label}</p><p className="text-xs text-neutral-400">{free ? 'مجاني' : formatPrice(cost)}</p></button>; }
