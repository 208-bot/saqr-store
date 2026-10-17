import { useState, useMemo } from 'react';
import { Search, Save, Truck } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { ShippingRate } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminShipping() {
  const { shippingRates, settings, saveShippingRate, saveSettings } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Record<string, { home: string; desk: string }>>({});

  const filtered = useMemo(
    () => shippingRates.filter((r) => r.wilaya_name.toLowerCase().includes(search.toLowerCase()) || r.wilaya_code.includes(search)),
    [shippingRates, search]
  );

  const handleChange = (id: string, field: 'home' | 'desk', value: string) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (rate: ShippingRate) => {
    const edits = editing[rate.id];
    if (!edits) return;
    await saveShippingRate({
      id: rate.id,
      home_delivery_cost: edits.home === '' ? rate.home_delivery_cost : Number(edits.home),
      stop_desk_cost: edits.desk === '' ? rate.stop_desk_cost : Number(edits.desk),
    });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[rate.id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipping Rates</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage delivery costs for all 58 wilayas</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#c7973e]/30 bg-[#17130c] p-4 text-white">
        <div><p className="font-semibold">تفعيل التوصيل المجاني (Enable Free Shipping)</p><p className="text-xs text-neutral-400 mt-1">عند التفعيل، تصبح كل تكاليف التوصيل 0 دج في المتجر.</p></div>
        <button type="button" onClick={() => void saveSettings({ free_shipping: !settings?.free_shipping })} className={`relative h-7 w-12 rounded-full transition-colors ${settings?.free_shipping ? 'bg-[#d7ad5e]' : 'bg-neutral-700'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${settings?.free_shipping ? 'translate-x-6' : 'translate-x-1'}`} /></button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wilaya..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Code</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Wilaya</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">توصيل للمنزل (Home)</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">توصيل للمكتب (Stop Desk)</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((rate) => {
                const edits = editing[rate.id];
                const hasEdits = edits && (edits.home !== String(rate.home_delivery_cost) || edits.desk !== String(rate.stop_desk_cost));
                return (
                  <tr key={rate.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-mono font-medium">{rate.wilaya_code}</td>
                    <td className="px-4 py-2.5">{rate.wilaya_name}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={edits?.home ?? rate.home_delivery_cost}
                        onChange={(e) => handleChange(rate.id, 'home', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={edits?.desk ?? rate.stop_desk_cost}
                        onChange={(e) => handleChange(rate.id, 'desk', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleSave(rate)}
                        disabled={!hasEdits}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-30 mx-auto"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Truck className="w-4 h-4" />
        {shippingRates.length} wilayas configured · Rates update in real-time on storefront
      </div>
    </div>
  );
}
