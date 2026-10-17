import { useState, useMemo } from 'react';
import { Search, Download, Printer, Trash2, Eye, Filter, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Order, OrderStatus } from '@/lib/types';
import { ORDER_STATUSES } from '@/lib/types';
import { formatPrice, formatDate, exportToCSV } from '@/lib/utils';
import ShippingBordereau from '@/components/admin/ShippingBordereau';

const STATUS_COLORS: Record<string, string> = {
  'جديد': 'bg-blue-100 text-blue-700',
  'مؤكد': 'bg-amber-100 text-amber-700',
  'قيد التوصيل': 'bg-purple-100 text-purple-700',
  'مكتمل': 'bg-green-100 text-green-700',
};

export default function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder, settings } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchesSearch =
          o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          o.phone_1.includes(search) ||
          o.order_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, search, statusFilter]
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  };

  const handleExportCSV = () => {
    const selected = filtered.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;

    const rows = selected.map((o) => ({
      Order_ID: o.order_number,
      Customer_Name: o.customer_name,
      Phone_1: o.phone_1,
      Phone_2: o.phone_2 || '',
      Wilaya_Code: o.wilaya_code,
      Wilaya_Name: o.wilaya_name,
      Commune: o.commune,
      Stop_Desk: o.shipping_type === 'desk' ? 'STOP-DESK' : 'HOME',
      Product_Description: `${o.product_name} - Size: ${o.product_size} - Qty: ${o.quantity}`,
      COD_Amount_DZD: o.total,
    }));

    exportToCSV(`orders-export-${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-neutral-500 text-sm mt-1">{orders.length} total orders · {selectedIds.size} selected</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or order ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={handleExportCSV}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export CSV ({selectedIds.size})
        </button>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-neutral-400">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No orders match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-neutral-900"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Order ID</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Customer</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Phone</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Wilaya</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Product</th>
                  <th className="px-3 py-3 text-right font-medium text-neutral-500">Total</th>
                  <th className="px-3 py-3 text-left font-medium text-neutral-500">Status</th>
                  <th className="px-3 py-3 text-center font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((order) => (
                  <tr key={order.id} className={`hover:bg-neutral-50 transition-colors ${selectedIds.has(order.id) ? 'bg-neutral-50' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded accent-neutral-900"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-xs font-medium">{order.order_number}</p>
                      <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-neutral-400">{order.commune}</p>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{order.phone_1}</td>
                    <td className="px-3 py-3 text-neutral-600">{order.wilaya_name}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs">{order.product_name}</p>
                      <p className="text-xs text-neutral-400">{order.product_size} · ×{order.quantity}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setPrintOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                          title="Print Bordereau"
                        >
                          <Printer className="w-4 h-4 text-neutral-400" />
                        </button>
                        <button
                          onClick={() => confirm('Delete this order?') && deleteOrder(order.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View order drawer */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewOrder(null)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold">Order Details</h3>
              <button onClick={() => setViewOrder(null)} className="p-2 rounded-lg hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-neutral-400 text-xs">Order ID</p><p className="font-mono font-medium">{viewOrder.order_number}</p></div>
                <div><p className="text-neutral-400 text-xs">Date</p><p className="font-medium">{formatDate(viewOrder.created_at)}</p></div>
                <div><p className="text-neutral-400 text-xs">Customer</p><p className="font-medium">{viewOrder.customer_name}</p></div>
                <div><p className="text-neutral-400 text-xs">Phone 1</p><p className="font-medium">{viewOrder.phone_1}</p></div>
                <div><p className="text-neutral-400 text-xs">Phone 2</p><p className="font-medium">{viewOrder.phone_2 || '—'}</p></div>
                <div><p className="text-neutral-400 text-xs">Status</p><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span></div>
                <div><p className="text-neutral-400 text-xs">Wilaya</p><p className="font-medium">{viewOrder.wilaya_code} - {viewOrder.wilaya_name}</p></div>
                <div><p className="text-neutral-400 text-xs">Commune</p><p className="font-medium">{viewOrder.commune}</p></div>
                <div><p className="text-neutral-400 text-xs">Shipping Type</p><p className="font-medium">{viewOrder.shipping_type === 'home' ? 'Home Delivery' : 'Stop Desk'}</p></div>
                <div><p className="text-neutral-400 text-xs">Quantity</p><p className="font-medium">{viewOrder.quantity}</p></div>
              </div>
              <div className="border-t border-neutral-100 pt-3">
                <p className="text-neutral-400 text-xs mb-1">Product</p>
                <p className="font-medium">{viewOrder.product_name} (Size: {viewOrder.product_size})</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-neutral-500">Unit Price</span><span className="font-medium">{formatPrice(viewOrder.unit_price)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-medium">{formatPrice(viewOrder.shipping_cost)}</span></div>
                <div className="flex justify-between border-t border-neutral-200 pt-2"><span className="font-semibold">Total COD</span><span className="font-bold" style={{ color: 'var(--accent)' }}>{formatPrice(viewOrder.total)}</span></div>
              </div>
              {viewOrder.notes && (
                <div><p className="text-neutral-400 text-xs">Notes</p><p className="text-sm">{viewOrder.notes}</p></div>
              )}
              <button
                onClick={() => { setPrintOrder(viewOrder); setViewOrder(null); }}
                className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Bordereau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print bordereau */}
      {printOrder && (
        <ShippingBordereau order={printOrder} settings={settings} onClose={() => setPrintOrder(null)} />
      )}
    </div>
  );
}
