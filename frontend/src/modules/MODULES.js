/**
 * MODULES.js — TECHNOVA central module registry.
 *
 * All 10 business domain modules are defined here. To add a new module:
 * 1. Create a folder under src/modules/<module-key>/
 * 2. Export a React component from its index.jsx
 * 3. Add an entry to the MODULES array below
 * 4. Add the key to the TABS arrays in Sidebar.jsx and BottomNav.jsx
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
    description: 'Unified messaging across all channels',
  },
  {
    key: 'buyer-discovery',
    icon: 'group',
    label: 'Buyers',
    description: 'Discover and connect with buyers',
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
    key: 'ai-communication',
    icon: 'smart_toy',
    label: 'AI Comms',
    description: 'AI-powered communication intelligence',
    comingSoon: true,
  },
  {
    key: 'human-approval',
    icon: 'how_to_reg',
    label: 'Approvals',
    description: 'Human review and approval workflows',
    comingSoon: true,
  },
  {
    key: 'api-integration',
    icon: 'api',
    label: 'Integrations',
    description: 'External API connections and marketplace sync',
    comingSoon: true,
  },
  {
    key: 'admin',
    icon: 'admin_panel_settings',
    label: 'Admin',
    description: 'System administration and user management',
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
