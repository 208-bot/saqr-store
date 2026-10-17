import { useState, useMemo, useEffect } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { ShoppingBag, Search, Truck, Shield, Zap, Menu, X, LogIn } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_LABELS_AR, CATEGORY_LABELS_EN, CATEGORY_LABELS_FR, type Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/pages/ProductDetail';

export default function Storefront() {
  const { products, settings, loading } = useStore();
  const { t, lang, dir } = useI18n();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mobileMenu, setMobileMenu] = useState(false);

  const categoryLabels = lang === 'ar' ? CATEGORY_LABELS_AR : lang === 'fr' ? CATEGORY_LABELS_FR : CATEGORY_LABELS_EN;

  const visibleProducts = useMemo(
    () => products.filter((p) => p.is_active),
    [products]
  );

  const filtered = useMemo(
    () => (activeCategory === 'all' ? visibleProducts : visibleProducts.filter((p) => p.category === activeCategory)),
    [visibleProducts, activeCategory]
  );

  useEffect(() => {
    if (settings?.accent_color) {
      document.documentElement.style.setProperty('--accent', settings.accent_color);
    }
  }, [settings?.accent_color]);

  const categories = ['all', 'hoodies', 'joggers', 'beanies'];

  return (
    <Routes>
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="*" element={
        <div className="min-h-screen bg-white text-neutral-900 relative" dir={dir}>
          {/* Announcement bar */}
          <div className="bg-neutral-900 text-white text-center py-2 text-xs sm:text-sm font-medium tracking-wide">
            <Truck className="inline-block w-4 h-4 mr-1 -mt-0.5" />
            {t('store.announcement')}
          </div>

          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-lg tracking-tight">{settings?.store_name || 'SAQR STORE'}</span>
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-sm font-medium transition-colors hover:text-neutral-500 ${
                      activeCategory === cat ? 'text-neutral-900 border-b-2 border-neutral-900 pb-1' : 'text-neutral-400'
                    }`}
                  >
                    {cat === 'all' ? t('store.allProducts') : categoryLabels[cat]}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    to="/track"
                    className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    {t('store.trackOrder')}
                  </Link>
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm font-bold text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('store.login')}
                  </Link>
                </div>
                <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
                  {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {mobileMenu && (
              <div className="md:hidden border-t border-neutral-200 bg-white">
                <div className="px-4 py-3 space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setMobileMenu(false);
                      }}
                      className={`block w-full text-${dir === 'rtl' ? 'right' : 'left'} py-2 text-sm font-medium ${
                        activeCategory === cat ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {cat === 'all' ? t('store.allProducts') : categoryLabels[cat]}
                    </button>
                  ))}
                  <Link to="/track" className="flex items-center gap-2 py-2 text-sm font-medium text-neutral-600">
                    <Search className="w-4 h-4" /> {t('store.trackOrder')}
                  </Link>
                  <Link to="/admin" className="flex items-center gap-2 py-2 text-sm font-bold text-neutral-700">
                    <LogIn className="w-4 h-4" /> {t('store.login')}
                  </Link>
                </div>
              </div>
            )}
          </header>

          {/* Hero */}
          <section className="relative overflow-hidden bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium mb-6">
                  <Zap className="w-3.5 h-3.5" />
                  {t('store.codBadge')}
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
                  {settings?.hero_title || t('store.allProducts')}
                </h1>
                <p className="mt-4 text-lg text-neutral-500 leading-relaxed max-w-lg">
                  {settings?.hero_subtitle || ''}
                </p>
                <div className="mt-8 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    {t('store.qualityGuaranteed')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Truck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    {t('store.fastDelivery')}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full opacity-5" style={{ background: 'var(--accent)' }} />
          </section>

          {/* Product Grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">
                {activeCategory === 'all' ? t('store.allProducts') : categoryLabels[activeCategory]}
              </h2>
              <span className="text-sm text-neutral-400">{filtered.length} {t('store.items')}</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-neutral-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('store.noProducts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-neutral-900 text-white py-12 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="font-bold text-lg">{settings?.store_name || 'SAQR STORE'}</span>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {t('store.footerDesc')}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">{t('store.customerService')}</h4>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li><Link to="/track" className="hover:text-white transition-colors">{t('store.trackOrder')}</Link></li>
                    <li><Link to="/admin" className="hover:text-white transition-colors">{t('store.login')}</Link></li>
                    <li><span>{t('store.homeDelivery')}</span></li>
                    <li><span>58 {lang === 'ar' ? 'ولاية' : 'Wilayas'}</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">{t('store.deliveryOptions')}</h4>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li>{t('store.homeDelivery')}</li>
                    <li>{t('store.stopDesk')}</li>
                    <li>{t('store.days')}</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-neutral-800 mt-8 pt-6 text-center text-sm text-neutral-500">
                © {new Date().getFullYear()} {settings?.store_name || 'SAQR STORE'}. {t('store.allRights')}.
              </div>
            </div>
          </footer>
        </div>
      } />
    </Routes>
  );
}
