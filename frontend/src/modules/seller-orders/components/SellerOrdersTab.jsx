/**
 * SellerOrdersTab — seller-side order fulfillment: confirm → process → pack
 * → ready for pickup, with a per-order tracking timeline. Logistics (Phase 4)
 * takes over from "ready_for_pickup" onward.
 */
import { useState, useEffect, useCallback } from 'react';
import { getOrders, updateOrderStatus, getOrderTracking } from '../../../services/storage';

const STATUS_COLORS = {
  paid: 'bg-blue-100 text-blue-800',
  seller_confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  packed: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  delivery_failed: 'bg-red-100 text-red-700',
  returned: 'bg-slate-100 text-slate-700',
  return_requested: 'bg-amber-100 text-amber-800',
  refunded: 'bg-slate-100 text-slate-700',
};

// Seller-actionable progression; picked_up onward belongs to logistics (Phase 4).
const NEXT_STATUS = {
  paid: { status: 'seller_confirmed', label: 'Confirm Order' },
  seller_confirmed: { status: 'processing', label: 'Start Processing' },
  processing: { status: 'packed', label: 'Mark Packed' },
  packed: { status: 'ready_for_pickup', label: 'Ready for Pickup' },
};

const CANCELLABLE = new Set(['paid', 'seller_confirmed', 'processing']);

function formatStatus(status) {
  return status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function OrderTimeline({ orderId }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOrderTracking(orderId).then((data) => { if (!cancelled) setEvents(data); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (events === null) return <p className="text-label-sm text-on-surface-variant py-2">Loading tracking...</p>;
  if (events.length === 0) return <p className="text-label-sm text-on-surface-variant py-2">No tracking updates yet.</p>;

  return (
    <ol className="mt-3 space-y-3">
      {events.map((event, i) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`w-2.5 h-2.5 rounded-full ${i === events.length - 1 ? 'bg-primary' : 'bg-outline-variant'}`} />
            {i < events.length - 1 && <span className="w-px flex-1 bg-outline-variant" />}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-label-md text-on-surface font-medium">{formatStatus(event.status)}</p>
            {event.location && <p className="text-label-sm text-on-surface-variant">{event.location}</p>}
            {event.notes && <p className="text-label-sm text-on-surface-variant">{event.notes}</p>}
            <p className="text-label-sm text-on-surface-variant/70">
              {event.created_at && new Date(event.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function SellerOrdersTab({ onToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingOpenId, setTrackingOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data.items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, next.status);
      onToast?.(`Order ${order.orderNumber} → ${formatStatus(next.status)}`);
      await load();
    } catch (err) {
      onToast?.(err.message || 'Could not update order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const cancel = async (order) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, 'cancelled', { notes: 'Cancelled by seller' });
      onToast?.(`Order ${order.orderNumber} cancelled`);
      await load();
    } catch (err) {
      onToast?.(err.message || 'Could not cancel order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-headline-lg text-on-surface font-bold">Orders</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined animate-pulse text-[40px] text-on-surface-variant">sync</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[56px] opacity-30">receipt_long</span>
          <p className="text-body-md mt-3">No orders yet.</p>
        </div>
      ) : (
        orders.map((order) => {
          const next = NEXT_STATUS[order.status];
          return (
            <div key={order.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-label-md text-on-surface font-semibold">{order.orderNumber}</p>
                  <p className="text-label-sm text-on-surface-variant">Buyer #{order.buyerId}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-label-sm font-medium ${STATUS_COLORS[order.status] || 'bg-surface-container text-on-surface-variant'}`}>
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Product #{item.productId} × {item.quantity}</span>
                    <span className="text-on-surface font-medium">${item.totalPrice?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant">
                <p className="text-label-md text-on-surface font-bold">Total: ${order.totalAmount?.toLocaleString()}</p>
                <p className="text-label-sm text-on-surface-variant">{order.shippingAddress}</p>
              </div>

              <div className="flex gap-2 mt-3">
                {next && (
                  <button
                    onClick={() => advance(order)}
                    disabled={updatingId === order.id}
                    className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-label-sm font-medium disabled:opacity-50"
                  >
                    {updatingId === order.id ? 'Updating...' : next.label}
                  </button>
                )}
                {CANCELLABLE.has(order.status) && (
                  <button
                    onClick={() => cancel(order)}
                    disabled={updatingId === order.id}
                    className="h-9 px-3 rounded-lg border border-outline-variant text-on-surface-variant text-label-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setTrackingOpenId(trackingOpenId === order.id ? null : order.id)}
                  className="h-9 px-3 rounded-lg border border-outline-variant text-on-surface-variant text-label-sm font-medium flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  {trackingOpenId === order.id ? 'Hide' : 'Track'}
                </button>
              </div>

              {trackingOpenId === order.id && <OrderTimeline orderId={order.id} />}
            </div>
          );
        })
      )}
    </div>
  );
}
