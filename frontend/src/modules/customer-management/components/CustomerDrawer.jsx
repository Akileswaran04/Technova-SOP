/**
 * CustomerDrawer — slide-in drawer with MD3 theme.
 * Review history, editable contact/notes, Material icons.
 */
import { useState } from 'react';
import { updateCustomer } from '../../../services/storage';

export default function CustomerDrawer({ customer, sellerId: _sellerId, onClose, onUpdate, onToast }) {
  const [contact, setContact] = useState(customer.contact || '');
  const [notes, setNotes] = useState(customer.notes || '');
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    if (customer.id && !customer.id.startsWith('derived_')) {
      try {
        await updateCustomer(customer.id, { contact, notes });
      } catch (err) {
        console.error('Failed to update customer:', err);
      }
    }
    setEditing(false);
    onUpdate();
    onToast('Customer info updated!');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onClose} />

      <div className="relative bg-surface-container-lowest w-full max-w-md h-full overflow-y-auto custom-scroll shadow-2xl animate-slide-in">
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-headline-md text-on-surface" style={{ fontWeight: 600 }}>Customer Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-headline-md" style={{ fontWeight: 700 }}>
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-headline-lg text-on-surface" style={{ fontWeight: 600 }}>{customer.name}</h3>
              {customer.contact && (
                <p className="text-body-md text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">call</span> {customer.contact}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-low rounded-xl p-3 text-center">
              <p className="text-headline-md text-primary" style={{ fontWeight: 700 }}>{customer.reviewCount || 0}</p>
              <p className="text-label-sm text-on-surface-variant">Reviews</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3 text-center">
              <p className="text-headline-md" style={{ fontWeight: 700, color: '#f59e0b' }}>{customer.avgRating || '—'}</p>
              <p className="text-label-sm text-on-surface-variant">Avg Rating</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3 text-center">
              <p className="text-body-md text-on-surface font-medium">
                {customer.lastInteraction ? new Date(customer.lastInteraction).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
              </p>
              <p className="text-label-sm text-on-surface-variant">Last Active</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Contact</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">call</span>
                <input type="text" value={contact} onChange={(e) => { setContact(e.target.value); setEditing(true); }}
                  placeholder="Phone or email"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Notes</label>
              <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setEditing(true); }}
                placeholder="Any notes about this customer..." rows={3}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none" />
            </div>
            {editing && (
              <button onClick={handleSave}
                className="w-full h-12 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">save</span> Save Changes
              </button>
            )}
          </div>

          <div>
            <h4 className="text-headline-md text-on-surface mb-3" style={{ fontWeight: 600 }}>
              Review History ({customer.reviews?.length || 0})
            </h4>
            {!customer.reviews || customer.reviews.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] opacity-40">chat_bubble_outline</span>
                <p className="text-body-md mt-2">No reviews from this customer yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.reviews.map((review, i) => (
                  <div key={review.id || i} className="bg-surface-container-low rounded-lg p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-label-md text-primary font-medium">{review.productName || 'Product'}</span>
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className="material-symbols-outlined text-[14px]" style={{ color: s <= review.rating ? '#f59e0b' : '#bcc9c6' }}>star</span>
                        ))}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant">{review.comment}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
