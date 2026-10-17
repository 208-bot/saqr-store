import { useState } from 'react';
import { Lock, LogOut, LayoutDashboard, Package, ClipboardList, Truck, Settings, Bot, Menu, ExternalLink, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useI18n, type Lang } from '@/lib/i18n';
import GoldCanvasBackground from '@/components/GoldCanvasBackground';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminShipping from '@/components/admin/AdminShipping';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAIAssistant from '@/components/admin/AdminAIAssistant';

type Tab = 'dashboard' | 'products' | 'orders' | 'shipping' | 'ai' | 'settings';

export default function Admin() {
  const { settings } = useStore();
  const { t, lang, setLang, dir } = useI18n();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (pin === (settings?.admin_pin || '2824')) {
      setAuthed(true);
      setPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    setActiveTab('dashboard');
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-4 relative overflow-hidden" dir={dir}>
        <GoldCanvasBackground />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#c7973e]/30 bg-black/75 backdrop-blur-xl p-8 shadow-2xl shadow-[#b88632]/10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 w-20 h-20 rounded-2xl border border-[#d7ad5e]/50 bg-[#d7ad5e]/10 flex items-center justify-center">
              <span className="text-3xl font-black text-[#d7ad5e]">ص</span>
            </div>
            <p className="text-[#d7ad5e] text-xs tracking-[0.35em] uppercase mb-2">SAQR STORE</p>
            <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
            <p className="text-neutral-400 text-sm mt-2">{t('admin.enterPin')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(event) => { setPin(event.target.value.replace(/\D/g, '')); setPinError(false); }}
              placeholder="••••"
              autoFocus
              className={`w-full text-center text-2xl tracking-[0.5em] py-4 rounded-2xl bg-white/5 border text-white outline-none focus:border-[#d7ad5e] ${pinError ? 'border-red-500' : 'border-white/10'}`}
            />
            {pinError && <p className="text-red-400 text-sm text-center">{t('admin.wrongPin')}</p>}
            <button className="w-full py-3.5 rounded-2xl bg-[#d7ad5e] text-black font-bold hover:bg-[#edcb82] transition-colors">{t('admin.unlock')}</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Lock }[] = [
    { id: 'dashboard', label: t('admin.dashboard'), icon: LayoutDashboard },
    { id: 'products', label: t('admin.products'), icon: Package },
    { id: 'orders', label: t('admin.orders'), icon: ClipboardList },
    { id: 'shipping', label: t('admin.shipping'), icon: Truck },
    { id: 'ai', label: t('admin.ai'), icon: Bot },
    { id: 'settings', label: t('admin.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex relative" dir={dir}>
      <aside className={`${mobileNav ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky ${dir === 'rtl' ? 'right-0' : 'left-0'} top-0 h-screen w-64 bg-white border-gray-200 shadow-xl border-${dir === 'rtl' ? 'l' : 'r'} z-50 transition-transform duration-300 flex flex-col`}>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d7ad5e]/10 border border-[#d7ad5e]/40 flex items-center justify-center text-[#d7ad5e] font-black">ص</div>
            <div><p className="font-bold text-sm">SAQR STORE</p><p className="text-xs text-[#d7ad5e]">{t('admin.ai')}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileNav(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#d7ad5e] text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}><Icon className="w-4 h-4" />{tab.label}</button>; })}
        </nav>
        <div className="p-3 border-t border-gray-200"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-black"><LogOut className="w-4 h-4" />{t('admin.logout')}</button></div>
      </aside>

      {mobileNav && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileNav(false)} />}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
          <button onClick={() => setMobileNav(true)} className="lg:hidden p-2"><Menu className="w-5 h-5" /></button>
          <div className="hidden lg:block"><p className="text-xs text-[#9a6d20] tracking-[0.25em] font-bold">JARVIS CONTROL CENTER</p><p className="text-sm text-gray-500">{settings?.store_name || 'SAQR STORE'}</p></div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 rounded-xl bg-gray-50 border border-gray-200 p-1"><Languages className="w-4 h-4 text-[#9a6d20] mx-1" />{(['ar', 'en', 'fr'] as Lang[]).map((value) => <button key={value} onClick={() => setLang(value)} className={`px-2 py-1 rounded-lg text-xs font-bold ${lang === value ? 'bg-[#d7ad5e] text-black' : 'text-neutral-400'}`}>{value.toUpperCase()}</button>)}</div>
            <Link to="/" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#d7ad5e] text-black text-[11px] sm:text-xs font-extrabold shadow-lg shadow-[#d7ad5e]/20 hover:bg-[#edcb82] transition-colors"><ExternalLink className="w-4 h-4" />{lang === 'ar' ? 'معاينة المتجر (View Store)' : 'View Store'}</Link>
            <button onClick={handleLogout} className="lg:hidden p-2 text-neutral-400"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'shipping' && <AdminShipping />}
          {activeTab === 'ai' && <AdminAIAssistant />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
