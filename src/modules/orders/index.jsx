/**
 * OrdersModule — placeholder for order management.
 * Coming soon: order tracking, fulfillment status, shipping integration.
 */
export default function OrdersModule() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-container/15 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-primary/40">receipt_long</span>
      </div>
      <h2 className="text-headline-lg text-on-surface mb-2" style={{ fontWeight: 600 }}>Orders</h2>
      <p className="text-body-md text-on-surface-variant max-w-sm">
        Track incoming orders, manage fulfillment status, and handle shipping — coming soon.
      </p>
      <span className="mt-4 px-4 py-1.5 bg-tertiary-container/30 text-tertiary rounded-full text-label-sm font-medium">
        Coming Soon
      </span>
    </div>
  );
}
