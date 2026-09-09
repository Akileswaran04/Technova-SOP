/**
 * OrdersPage — buyer's order history with status and review-after-order.
 */
import { useState, useEffect, useCallback } from 'react';
import { getOrders, reviewOrder } from '../../../services/storage';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-slate-100 text-slate-700',
};

export default function OrdersPage({ onToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data.items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitReview = async () => {
    if (!reviewing) return;
    try {
      await reviewOrder(reviewing, rating, comment);
      setReviewing(null);
      setComment('');
      onToast?.('Thanks! Your review helps the seller build trust');
      load();
    } catch (err) {
      onToast?.(err.message || 'Review failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-headline-md text-on-surface font-semibold">My Orders</h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined animate-pulse text-[40px] text-on-surface-variant">sync</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[56px] opacity-30">receipt_long</span>
          <p className="text-body-md mt-3">No orders yet. Browse Discover to place your first order.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-label-md text-on-surface font-semibold">{order.orderNumber}</p>
              <span className={`px-2.5 py-1 rounded-full text-label-sm font-medium ${statusColors[order.status] || 'bg-surface-container text-on-surface-variant'}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
              <p className="text-label-sm text-on-surface-variant">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            {order.status === 'delivered' && (
              <button
                onClick={() => { setReviewing(order.id); setRating(5); setComment(''); }}
                className="mt-3 w-full h-10 rounded-lg bg-primary/10 text-primary text-label-md font-semibold hover:bg-primary/20 transition-colors"
              >
                Leave a Review
              </button>
            )}
          </div>
        ))
      )}

      {/* Review dialog */}
      {reviewing && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-sm text-on-surface font-semibold mb-3">Rate your order</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="text-[28px]">
                  <span className={`material-symbols-outlined ${star <= rating ? 'text-amber-500 filled' : 'text-outline-variant'}`}>star</span>
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewing(null)} className="flex-1 h-11 rounded-lg border-2 border-outline-variant text-label-md text-on-surface">
                Cancel
              </button>
              <button onClick={submitReview} className="flex-1 h-11 rounded-lg bg-primary text-on-primary text-label-md font-semibold">
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}