import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Order, ShippingRate, StoreSettings, AbandonedCart, ProductView } from '@/lib/types';

interface StoreContextValue {
  products: Product[];
  orders: Order[];
  shippingRates: ShippingRate[];
  settings: StoreSettings | null;
  abandonedCarts: AbandonedCart[];
  productViews: ProductView[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshShippingRates: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshAbandonedCarts: () => Promise<void>;
  refreshProductViews: () => Promise<void>;
  saveProduct: (p: Partial<Product> & { id?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveOrder: (o: Partial<Order> & { id?: string }) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  saveShippingRate: (r: Partial<ShippingRate> & { id?: string }) => Promise<void>;
  saveSettings: (s: Partial<StoreSettings>) => Promise<void>;
  trackAbandonedCart: (cart: Partial<AbandonedCart>) => Promise<void>;
  trackProductView: (view: Partial<ProductView>) => Promise<void>;
  deleteAbandonedCart: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [productViews, setProductViews] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
  }, []);

  const refreshOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
  }, []);

  const refreshShippingRates = useCallback(async () => {
    const { data } = await supabase.from('shipping_rates').select('*').order('wilaya_code', { ascending: true });
    if (data) setShippingRates(data as ShippingRate[]);
  }, []);

  const refreshSettings = useCallback(async () => {
    const { data } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSettings(data as StoreSettings);
  }, []);

  const refreshAbandonedCarts = useCallback(async () => {
    const { data } = await supabase.from('abandoned_carts').select('*').order('created_at', { ascending: false });
    if (data) setAbandonedCarts(data as AbandonedCart[]);
  }, []);

  const refreshProductViews = useCallback(async () => {
    const { data } = await supabase.from('product_views').select('*').order('created_at', { ascending: false });
    if (data) setProductViews(data as ProductView[]);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([refreshProducts(), refreshOrders(), refreshShippingRates(), refreshSettings(), refreshAbandonedCarts(), refreshProductViews()]);
      setLoading(false);
    })();

    const productChannel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshProducts())
      .subscribe();

    const orderChannel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => refreshOrders())
      .subscribe();

    const settingsChannel = supabase
      .channel('settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => refreshSettings())
      .subscribe();

    const shippingChannel = supabase
      .channel('shipping-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_rates' }, () => refreshShippingRates())
      .subscribe();

    const cartChannel = supabase
      .channel('carts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abandoned_carts' }, () => refreshAbandonedCarts())
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(shippingChannel);
      supabase.removeChannel(cartChannel);
    };
  }, [refreshProducts, refreshOrders, refreshShippingRates, refreshSettings, refreshAbandonedCarts, refreshProductViews]);

  const saveProduct = useCallback(async (p: Partial<Product> & { id?: string }) => {
    if (p.id) {
      const { id, ...updates } = p;
      await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    } else {
      await supabase.from('products').insert(p);
    }
    await refreshProducts();
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await refreshProducts();
  }, [refreshProducts]);

  const saveOrder = useCallback(async (o: Partial<Order> & { id?: string }) => {
    if (o.id) {
      const { id, ...updates } = o;
      await supabase.from('orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    } else {
      await supabase.from('orders').insert(o);
    }
    await refreshOrders();
  }, [refreshOrders]);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await refreshOrders();
  }, [refreshOrders]);

  const deleteOrder = useCallback(async (id: string) => {
    await supabase.from('orders').delete().eq('id', id);
    await refreshOrders();
  }, [refreshOrders]);

  const saveShippingRate = useCallback(async (r: Partial<ShippingRate> & { id?: string }) => {
    if (r.id) {
      const { id, ...updates } = r;
      await supabase.from('shipping_rates').update(updates).eq('id', id);
    } else {
      await supabase.from('shipping_rates').insert(r);
    }
    await refreshShippingRates();
  }, [refreshShippingRates]);

  const saveSettings = useCallback(async (s: Partial<StoreSettings>) => {
    await supabase.from('store_settings').update(s).eq('id', 1);
    await refreshSettings();
  }, [refreshSettings]);

  const trackAbandonedCart = useCallback(async (cart: Partial<AbandonedCart>) => {
    await supabase.from('abandoned_carts').insert(cart);
    await refreshAbandonedCarts();
  }, [refreshAbandonedCarts]);

  const trackProductView = useCallback(async (view: Partial<ProductView>) => {
    await supabase.from('product_views').insert(view);
  }, []);

  const deleteAbandonedCart = useCallback(async (id: string) => {
    await supabase.from('abandoned_carts').delete().eq('id', id);
    await refreshAbandonedCarts();
  }, [refreshAbandonedCarts]);

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        shippingRates,
        settings,
        abandonedCarts,
        productViews,
        loading,
        refreshProducts,
        refreshOrders,
        refreshShippingRates,
        refreshSettings,
        refreshAbandonedCarts,
        refreshProductViews,
        saveProduct,
        deleteProduct,
        saveOrder,
        updateOrderStatus,
        deleteOrder,
        saveShippingRate,
        saveSettings,
        trackAbandonedCart,
        trackProductView,
        deleteAbandonedCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
