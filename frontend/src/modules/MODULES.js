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

/**
 * TAB_KEYS — single source of truth for seller dashboard tab keys.
 * Nav components send these keys via onTabChange; App.jsx switches on them.
 * Always reference TAB_KEYS.xxx instead of hard-coding strings so the two
 * sides can't drift apart (drift = blank screen with no console error).
 */
export const TAB_KEYS = {
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  INBOX: 'inbox',
  NEUROCHAT: 'neurochat',
  CUSTOMERS: 'customers',
  ANALYTICS: 'analytics',
  PROFILE: 'profile',
};

const MODULES = [
  {
    key: TAB_KEYS.PROFILE,
    icon: 'person',
    label: 'Seller Profile',
    description: 'Manage your store details, verification, and public presence',
  },
  {
    key: TAB_KEYS.PRODUCTS,
    icon: 'inventory_2',
    label: 'Products',
    description: 'Manage your catalog and product listings',
  },
  {
    key: TAB_KEYS.INBOX,
    icon: 'chat',
    label: 'Inbox',
    description: 'Unified messaging with AI-powered auto-reply',
  },
  {
    key: TAB_KEYS.NEUROCHAT,
    icon: 'smart_toy',
    label: 'NeuroChat AI',
    description: 'Seller-only AI response engine for buyer inquiries',
  },
  {
    key: TAB_KEYS.CUSTOMERS,
    icon: 'group',
    label: 'Buyers',
    description: 'Discover and connect with buyers',
  },
  {
    key: TAB_KEYS.ANALYTICS,
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
