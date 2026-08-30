/**
 * MODULES.js — TECHNOVA central module registry.
 *
 * Active modules:
 * 1. Seller Profile — manage store details
 * 2. Products — manage catalog
 * 3. Inbox — unified messaging with AI auto-reply
 * 4. Buyers — discover and connect with buyers
 * 5. Analytics — sales insights
 */

const MODULES = [
  {
    key: 'seller-profile',
    icon: 'person',
    label: 'Seller Profile',
    description: 'Manage your store details, verification, and public presence',
  },
  {
    key: 'product-listing',
    icon: 'inventory_2',
    label: 'Products',
    description: 'Manage your catalog and product listings',
  },
  {
    key: 'unified-inbox',
    icon: 'chat',
    label: 'Inbox',
    description: 'Unified messaging with AI-powered auto-reply',
  },
  {
    key: 'buyer-discovery',
    icon: 'group',
    label: 'Buyers',
    description: 'Discover and connect with buyers',
  },
  {
    key: 'analytics',
    icon: 'analytics',
    label: 'Analytics',
    description: 'Sales insights and performance metrics',
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
