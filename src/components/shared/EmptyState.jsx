/**
 * EmptyState — reusable empty state component for modules.
 * Material Design 3: centered icon, title, description, optional action button.
 */
export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
      <span className="material-symbols-outlined text-[48px] text-outline opacity-50">{icon}</span>
      <p className="text-on-surface-variant text-body-lg mt-4 mb-1">{title}</p>
      {description && <p className="text-on-surface-variant text-body-md mb-6">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-12 px-6 bg-primary text-on-primary text-label-md font-medium rounded-lg active:scale-[0.98] shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] mr-2">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
