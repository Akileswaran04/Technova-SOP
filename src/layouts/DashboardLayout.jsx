/**
 * DashboardLayout — shared layout wrapper for all authenticated pages.
 * Provides sidebar, header, and main content area.
 */

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
