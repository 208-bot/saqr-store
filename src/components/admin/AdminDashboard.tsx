import { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Package, DollarSign, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/utils';

interface Props {
  onNavigate: (tab: 'dashboard' | 'products' | 'orders' | 'shipping' | 'ai' | 'settings') => void;
}

export default function AdminDashboard({ onNavigate }: Props) {
  const { orders, products } = useStore();

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === 'مكتمل')
      .reduce((sum, o) => sum + o.total, 0);
    const pendingRevenue = orders
      .filter((o) => o.status !== 'مكتمل')
      .reduce((sum, o) => sum + o.total, 0);
    const newOrders = orders.filter((o) => o.status === 'جديد').length;
    const inDelivery = orders.filter((o) => o.status === 'قيد التوصيل').length;
    const completed = orders.filter((o) => o.status === 'مكتمل').length;
    const confirmed = orders.filter((o) => o.status === 'مؤكد').length;
    const lowStock = products.filter((p) => p.stock <= 10).length;

    return {
      totalRevenue,
      pendingRevenue,
      newOrders,
      inDelivery,
      completed,
      confirmed,
      totalOrders: orders.length,
      lowStock,
    };
  }, [orders, products]);

  const recentOrders = orders.slice(0, 8);

  const statusColors: Record<string, string> = {
    'جديد': 'bg-blue-100 text-blue-700',
    'مؤكد': 'bg-amber-100 text-amber-700',
    'قيد التوصيل': 'bg-purple-100 text-purple-700',
    'مكتمل': 'bg-green-100 text-green-700',
  };

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'Pending Revenue', value: formatPrice(stats.pendingRevenue), icon: TrendingUp, icon2: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingBag, color: 'text-blue-600 bg-blue-100' },
    { label: 'Low Stock Items', value: String(stats.lowStock), icon: Package, color: 'text-red-600 bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">Overview of your store performance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm text-neutral-400 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Order status breakdown */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <h3 className="font-semibold mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{stats.newOrders}</p>
            <p className="text-xs text-neutral-500">New (جديد)</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50">
            <Package className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{stats.confirmed}</p>
            <p className="text-xs text-neutral-500">Confirmed (مؤكد)</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50">
            <Truck className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{stats.inDelivery}</p>
            <p className="text-xs text-neutral-500">In Delivery (قيد التوصيل)</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-50">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-neutral-500">Completed (مكتمل)</p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold">Recent Orders</h3>
          <button
            onClick={() => onNavigate('orders')}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            View all →
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center text-neutral-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{order.customer_name}</p>
                  <p className="text-xs text-neutral-400">
                    {order.order_number} · {order.wilaya_name} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm">{formatPrice(order.total)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-neutral-100 text-neutral-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
