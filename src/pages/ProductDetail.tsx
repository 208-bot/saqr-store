import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Truck, Shield, ChevronLeft, ChevronRight, Package, Palette } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_LABELS_AR, CATEGORY_LABELS_EN, CATEGORY_LABELS_FR, type Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import CheckoutModal from '@/components/CheckoutModal';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, settings, trackProductView } = useStore();
  const { t, lang, dir } = useI18n();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(-1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [viewStartTime] = useState(Date.now());

  const product = useMemo(
    () => products.find((p) => p.id === id),
    [products, id]
  );

  const categoryLabels = lang === 'ar' ? CATEGORY_LABELS_AR : lang === 'fr' ? CATEGORY_LABELS_FR : CATEGORY_LABELS_EN;

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedImage(0);
      setSelectedColorIndex(product.colors && product.colors.length > 0 ? 0 : -1);
    }
  }, [product]);

  // When color changes, switch to the linked image
  useEffect(() => {
    if (!product || selectedColorIndex < 0) return;
    if (!product.colors || product.colors.length === 0) return;
    const color = product.colors[selectedColorIndex];
    if (color && color.image_index < product.images.length) {
      setSelectedImage(color.image_index);
    }
  }, [selectedColorIndex, product]);

  // Track product view duration on unmount
  useEffect(() => {
    return () => {
      if (product) {
        const duration = Math.round((Date.now() - viewStartTime) / 1000);
        trackProductView({
          product_id: product.id,
          product_name: product.name,
          duration_seconds: duration,
        });
      }
    };
  }, [product, viewStartTime, trackProductView]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-400 mb-4">{t('store.noProducts')}</p>
          <Link to="/" className="text-neutral-900 font-medium underline">{t('product.backToShop')}</Link>
        </div>
      </div>
    );
  }

  const currentPrice = product.sale_price ?? product.price;
  const hasSale = product.sale_price !== null && product.sale_price < product.price;
  const outOfStock = product.stock <= 0;

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id && p.is_active)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-neutral-900" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-lg tracking-tight">{settings?.store_name || 'SAQR STORE'}</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            {t('product.backToShop')}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-neutral-400 mb-6">
          <Link to="/" className="hover:text-neutral-900 transition-colors">{t('store.allProducts')}</Link>
          <span className="mx-2">/</span>
          <span>{categoryLabels[product.category]}</span>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-neutral-300" />
                </div>
              )}

              {hasSale && (
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold">
                  {dir === 'rtl' ? 'تخفيض' : 'SALE'}
                </span>
              )}

              {/* Gallery arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute top-1/2 -translate-y-1/2 left-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute top-1/2 -translate-y-1/2 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-neutral-900' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium">
                {categoryLabels[product.category]}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                {formatPrice(currentPrice)}
              </span>
              {hasSale && (
                <span className="text-lg text-neutral-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mb-6">
              {outOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-500 font-medium">
                  <Package className="w-4 h-4" /> {t('product.outOfStock')}
                </span>
              ) : product.stock <= 10 ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                  <Check className="w-4 h-4" /> {t('product.onlyLeft').replace('{n}', String(product.stock))}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <Check className="w-4 h-4" /> {t('product.inStock')}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-2">{t('product.description')}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-2">{t('product.features')}</h3>
                <ul className="space-y-2">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                      <Check className="w-4 h-4 text-green-500 shrink-0" style={{ color: 'var(--accent)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
                  <Palette className="w-4 h-4 text-neutral-400" />
                  {t('product.colors')}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color, ci) => (
                    <button
                      key={ci}
                      onClick={() => setSelectedColorIndex(ci)}
                      title={color.name}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                        selectedColorIndex === ci
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-neutral-300"
                        style={{ background: color.hex }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector - stock-aware */}
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">{t('product.size')}</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const sizeOut = outOfStock; // Simplified: if product stock is 0, all sizes are out
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={sizeOut}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedSize === size
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buy button */}
            <button
              onClick={() => setShowCheckout(true)}
              disabled={outOfStock}
              className="w-full py-4 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
            >
              <ShoppingBag className="w-5 h-5" />
              {t('product.quickBuy')}
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" /> {t('store.qualityGuaranteed')}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" /> {t('store.fastDelivery')}
              </span>
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold tracking-tight mb-6">{t('product.relatedProducts')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <RelatedCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          product={{ ...product, sizes: selectedSize ? [selectedSize] : product.sizes }}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

function RelatedCard({ product }: { product: Product }) {
  const currentPrice = product.sale_price ?? product.price;
  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100">
        {product.images[0] && (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        )}
      </div>
      <h3 className="font-medium text-sm mt-3 leading-snug">{product.name}</h3>
      <span className="font-bold text-sm mt-1" style={{ color: 'var(--accent)' }}>{formatPrice(currentPrice)}</span>
    </Link>
  );
}
