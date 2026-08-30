/**
 * TrustScoreBadge — circular gauge showing seller trust score (0–5).
 * Color coding: red (0–2), amber (2–3.5), green (3.5+)
 * Shows "New Seller" badge if no reviews exist.
 */
export default function TrustScoreBadge({ score, reviewCount }) {
  const isNew = score === null || score === undefined;

  const getColor = (s) => {
    if (s < 2) return { ring: '#ba1a1a', bg: '#ffdad6', text: '#ba1a1a', label: 'Low' };
    if (s < 3.5) return { ring: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: 'Fair' };
    return { ring: '#00685f', bg: '#008378', text: '#f4fffc', label: 'Good' };
  };

  if (isNew) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-medium">
        <span className="material-symbols-outlined text-[16px]">new_releases</span>
        New Seller
      </div>
    );
  }

  const colors = getColor(score);
  const isGreen = score >= 3.5;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-bold"
      style={{ backgroundColor: isGreen ? colors.bg : `${colors.bg}20`, color: isGreen ? colors.text : colors.ring }}
    >
      <span className="material-symbols-outlined filled text-[16px]" style={{ color: '#f59e0b' }}>star</span>
      <span>{score.toFixed(1)}</span>
      <span className="text-label-sm font-normal opacity-75">({reviewCount})</span>
    </div>
  );
}
