import { useEffect } from 'react';
import { X, Printer, Package } from 'lucide-react';
import type { Order, StoreSettings } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

interface Props {
  order: Order;
  settings: StoreSettings | null;
  onClose: () => void;
}

export default function ShippingBordereau({ order, settings, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById('bordereau-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Bordereau - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
          body { padding: 20px; background: #fff; color: #000; }
          .bordereau { width: 210mm; min-height: 148mm; margin: 0 auto; border: 2px solid #000; padding: 20px; position: relative; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .store-name { font-size: 22px; font-weight: bold; }
          .store-info { font-size: 11px; color: #444; margin-top: 4px; }
          .order-number { font-size: 14px; font-weight: bold; text-align: right; }
          .order-date { font-size: 11px; color: #444; text-align: right; }
          .barcode { text-align: center; margin: 16px 0; }
          .barcode-placeholder { font-family: 'Courier New', monospace; font-size: 28px; letter-spacing: 3px; background: #f0f0f0; padding: 10px 20px; display: inline-block; border: 1px dashed #999; }
          .section { margin-bottom: 14px; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 6px; letter-spacing: 1px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .info-box { border: 1px solid #ccc; padding: 10px 12px; border-radius: 4px; }
          .info-label { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 3px; }
          .info-value { font-size: 14px; font-weight: 600; }
          .product-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          .product-table th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #ddd; }
          .product-table td { padding: 8px; font-size: 12px; border: 1px solid #ddd; }
          .total-box { background: #000; color: #fff; padding: 14px 20px; text-align: center; border-radius: 4px; margin-top: 10px; }
          .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
          .total-amount { font-size: 28px; font-weight: bold; margin-top: 4px; }
          .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
          .shipping-type-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .home-badge { background: #e8f0fe; color: #1a73e8; }
          .desk-badge { background: #fef7e0; color: #f9ab00; }
          @media print { body { padding: 0; } .bordereau { border: none; } }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action bar (not printed) */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold">Shipping Bordereau</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable bordereau */}
        <div id="bordereau-print" className="p-6">
          <div className="bordereau">
            {/* Header */}
            <div className="header">
              <div>
                <div className="store-name">{settings?.store_name || 'STREET DZ'}</div>
                <div className="store-info">
                  {settings?.sender_address || 'Alger Centre, Alger'}<br />
                  Tel: {settings?.sender_phone || '0550000000'}
                </div>
              </div>
              <div>
                <div className="order-number">BON DE LIVRAISON</div>
                <div className="order-date">
                  {order.order_number}<br />
                  {formatDate(order.created_at)}
                </div>
              </div>
            </div>

            {/* Barcode */}
            <div className="barcode">
              <div className="barcode-placeholder">|||│||│||│|││|||│||│|│|│|│</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{order.order_number}</div>
            </div>

            {/* Sender & Customer info */}
            <div className="info-grid">
              <div className="info-box">
                <div className="section-title">Sender / Expéditeur</div>
                <div className="info-label">Name</div>
                <div className="info-value">{settings?.sender_name || 'STREET DZ STORE'}</div>
                <div className="info-label" style={{ marginTop: 6 }}>Phone</div>
                <div className="info-value">{settings?.sender_phone || '0550000000'}</div>
                <div className="info-label" style={{ marginTop: 6 }}>Address</div>
                <div className="info-value">{settings?.sender_address || 'Alger Centre, Alger'}</div>
              </div>
              <div className="info-box">
                <div className="section-title">Customer / Destinataire</div>
                <div className="info-label">Name</div>
                <div className="info-value">{order.customer_name}</div>
                <div className="info-label" style={{ marginTop: 6 }}>Phone</div>
                <div className="info-value">{order.phone_1} {order.phone_2 && `/ ${order.phone_2}`}</div>
                <div className="info-label" style={{ marginTop: 6 }}>Address</div>
                <div className="info-value">{order.commune}, {order.wilaya_code} - {order.wilaya_name}</div>
              </div>
            </div>

            {/* Shipping type */}
            <div className="section" style={{ marginTop: 14 }}>
              <span className={`shipping-type-badge ${order.shipping_type === 'home' ? 'home-badge' : 'desk-badge'}`}>
                {order.shipping_type === 'home' ? 'توصيل للمنزل · HOME DELIVERY' : 'توصيل للمكتب · STOP DESK'}
              </span>
            </div>

            {/* Product table */}
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Shipping</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{order.product_name}</td>
                  <td>{order.product_size}</td>
                  <td>{order.quantity}</td>
                  <td>{formatPrice(order.unit_price)}</td>
                  <td>{formatPrice(order.shipping_cost)}</td>
                </tr>
              </tbody>
            </table>

            {/* Total COD */}
            <div className="total-box">
              <div className="total-label">COD Amount to Collect · المبلغ المطلوب</div>
              <div className="total-amount">{formatPrice(order.total)}</div>
            </div>

            {/* Footer */}
            <div className="footer">
              {settings?.store_name || 'STREET DZ'} · Bordereau generated {formatDate(order.created_at)} · Order #{order.order_number}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
