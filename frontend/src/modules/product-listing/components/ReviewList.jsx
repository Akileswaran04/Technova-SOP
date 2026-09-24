
import { useState } from 'react';

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="material-symbols-outlined text-[16px]" style={{ color: i <= rating ? '#f59e0b' : '#bcc9c6' }}>
          {i <= rating ? 'star' : 'star'}
        </span>
      ))}
    </span>
  );
}

function ReviewItem({ review, onReply }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.sellerReply || '');

  const handleSaveReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText.trim());
    setReplying(false);
  };

  return (
    <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-label-sm font-bold">
            {review.customerName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-label-md text-on-surface font-medium">{review.customerName}</p>
            <StarRating rating={review.rating} />
          </div>
        </div>
        <span className="text-label-sm text-on-surface-variant">
          {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <p className="text-body-md text-on-surface-variant leading-relaxed">{review.comment}</p>

      {review.sellerReply && !replying ? (
        <div className="ml-6 mt-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
          <p className="text-label-sm font-medium text-primary mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">storefront</span> Seller's Reply
          </p>
          <p className="text-body-md text-on-surface-variant">{review.sellerReply}</p>
          <button onClick={() => { setReplying(true); setReplyText(review.sellerReply); }}
            className="text-label-sm text-on-surface-variant hover:text-primary mt-1 transition-colors">
            Edit reply
          </button>
        </div>
      ) : replying || !review.sellerReply ? (
        <div className="ml-6 mt-2">
          {replying ? (
            <div className="space-y-2">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply to this review..." rows={2}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveReply}
                  className="px-4 h-8 bg-primary text-on-primary text-label-sm font-medium rounded-lg active:scale-95 shadow-sm">
                  Post Reply
                </button>
                <button onClick={() => { setReplying(false); setReplyText(review.sellerReply || ''); }}
                  className="px-4 h-8 bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-sm font-medium rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReplying(true)}
              className="text-label-sm text-primary hover:text-on-primary-fixed-variant font-medium flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">reply</span>
              Reply to this review
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewList({ reviews, onReply }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] opacity-40">chat_bubble_outline</span>
        <p className="text-body-md mt-2">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((review) => (
        <ReviewItem key={review.id} review={review} onReply={onReply} />
      ))}
    </div>
  );
}
