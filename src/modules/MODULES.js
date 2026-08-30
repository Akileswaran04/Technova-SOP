/**
 * MODULES.js — Central module registry.
 *
 * All 8 dashboard modules are defined here. To add a new module:
 * 1. Create a folder under src/modules/<module-key>/
 * 2. Export a React component from its index.jsx
 * 3. Add an entry to the MODULES array below
 * 4. Add the key to the TABS arrays in Sidebar.jsx and BottomNav.jsx
 */

const MODULES = [
  {
    key: 'products',
    icon: 'inventory_2',
    label: 'Products',
    description: 'Manage your catalog and product listings',
  },
  {
    key: 'inventory',
    icon: 'shelves',
    label: 'Inventory',
    description: 'Track and adjust stock levels',
  },
  {
    key: 'inbox',
    icon: 'chat',
    label: 'Inbox',
    description: 'Message customers and manage conversations',
  },
  {
    key: 'customers',
    icon: 'group',
    label: 'Customers',
    description: 'View customer profiles and review history',
  },
  {
    key: 'profile',
    icon: 'person',
    label: 'Profile',
    description: 'Manage your store details and verification',
  },
  {
    key: 'orders',
    icon: 'receipt_long',
    label: 'Orders',
    description: 'Track incoming orders and fulfillment',
    comingSoon: true,
  },
  {
    key: 'analytics',
    icon: 'analytics',
    label: 'Analytics',
    description: 'Sales insights and performance metrics',
    comingSoon: true,
  },
  {
    key: 'listings',
    icon: 'storefront',
    label: 'Listings',
    description: 'Manage marketplace listings and promotions',
    comingSoon: true,
  },
];

/** Get active (non-coming-soon) tabs for navigation */
export function getActiveModules() {
  return MODULES.filter((m) => !m.comingSoon);
}

/** Get all tabs including coming-soon placeholders */
export function getAllModules() {
  return MODULES;
}

/** Get tabs for sidebar/bottom nav (includes coming-soon as disabled) */
export function getNavTabs() {
  return MODULES.map((m) => ({
    ...m,
    disabled: !!m.comingSoon,
  }));
}

/** Look up a module by key */
export function getModuleByKey(key) {
  return MODULES.find((m) => m.key === key) || null;
}

export default MODULES;
