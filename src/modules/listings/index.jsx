/**
 * ListingsModule — placeholder for marketplace listings management.
 * Coming soon: multi-platform listings, promotions, bulk edit.
 */
export default function ListingsModule() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-container/15 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-primary/40">storefront</span>
      </div>
      <h2 className="text-headline-lg text-on-surface mb-2" style={{ fontWeight: 600 }}>Listings</h2>
      <p className="text-body-md text-on-surface-variant max-w-sm">
        Manage marketplace listings, promotions, and bulk operations — coming soon.
      </p>
      <span className="mt-4 px-4 py-1.5 bg-tertiary-container/30 text-tertiary rounded-full text-label-sm font-medium">
        Coming Soon
      </span>
    </div>
  );
}
