import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Package, Clock, Truck, CheckCircle, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

const STATUS_FLOW: { status: OrderStatus; label: string; icon: typeof Package; color: string }[] = [
  { status: 'جديد', label: 'New Order', icon: Clock, color: 'text-blue-600 bg-blue-100' },
  { status: 'مؤكد', label: 'Confirmed', icon: Package, color: 'text-amber-600 bg-amber-100' },
  { status: 'قيد التوصيل', label: 'In Delivery', icon: Truck, color: 'text-purple-600 bg-purple-100' },
  { status: 'مكتمل', label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
];

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('id') || '');
  const [results, setResults] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      setQuery(initialId);
      doSearch(initialId);
    }
  }, [searchParams]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    const cleanQuery = q.trim();
    let data: Order[] | null = null;

    // Try by order number first
    const { data: byOrder } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', cleanQuery);

    if (byOrder && byOrder.length > 0) {
      data = byOrder as Order[];
    } else {
      // Try by phone
      const { data: byPhone } = await supabase
        .from('orders')
        .select('*')
        .or(`phone_1.ilike.%${cleanQuery}%,phone_2.ilike.%${cleanQuery}%`);
      data = (byPhone as Order[]) || [];
    }

    setResults(data || []);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const getCurrentStep = (status: OrderStatus) =>
    STATUS_FLOW.findIndex((s) => s.status === status);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="font-bold">Track Your Order</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Search */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Track Your Order</h1>
          <p className="text-neutral-500">Enter your Order ID or Phone Number to check your order status</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID or Phone Number"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all text-sm bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">No orders found</p>
            <p className="text-sm text-neutral-400 mt-1">Check your Order ID or phone number and try again.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((order) => {
              const currentStep = getCurrentStep(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                  {/* Order header */}
                  <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                      <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_FLOW[currentStep]?.color}`}>
                      {STATUS_FLOW[currentStep]?.label} · {order.status}
                    </div>
                  </div>

                  {/* Order details */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={order.product_name}
                        alt=""
                        className="hidden"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{order.product_name}</p>
                        <p className="text-xs text-neutral-400">
                          Size: {order.product_size} · Qty: {order.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    {/* Status tracker */}
                    <div className="relative">
                      <div className="flex justify-between mb-2">
                        {STATUS_FLOW.map((step, i) => {
                          const Icon = step.icon;
                          const isActive = i <= currentStep;
                          return (
                            <div key={step.status} className="flex flex-col items-center flex-1 relative">
                              {i < STATUS_FLOW.length - 1 && (
                                <div
                                  className={`absolute top-5 left-1/2 w-full h-0.5 ${
                                    i < currentStep ? 'bg-neutral-900' : 'bg-neutral-200'
                                  }`}
                                />
                              )}
                              <div
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isActive ? step.color : 'bg-neutral-100 text-neutral-300'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <span
                                className={`mt-1.5 text-xs font-medium ${
                                  isActive ? 'text-neutral-700' : 'text-neutral-300'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipping info */}
                    <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-neutral-400 text-xs">Delivery to</p>
                        <p className="font-medium">{order.wilaya_name}</p>
                        <p className="text-neutral-500 text-xs">{order.commune}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-xs">Shipping Type</p>
                        <p className="font-medium">
                          {order.shipping_type === 'home' ? 'Home Delivery' : 'Stop Desk'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
