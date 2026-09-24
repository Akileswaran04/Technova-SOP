/**
 * WhyThis — plain-language reasons behind an AI recommendation (PRD §10).
 * Concise by default; kept short since callers already trim to 2-3 reasons.
 */
export default function WhyThis({ reasons }) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {reasons.map((reason, i) => (
        <li key={i} className="flex items-start gap-1.5 text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] text-emerald-600 mt-0.5">check_circle</span>
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}
