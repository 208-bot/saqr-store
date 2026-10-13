import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/lib/store';
import { I18nProvider } from '@/lib/i18n';
import Storefront from '@/pages/Storefront';
import OrderTracking from '@/pages/OrderTracking';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/*" element={<Storefront />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </I18nProvider>
  );
}
