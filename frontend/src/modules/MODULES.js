

export const TAB_KEYS = {
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  ORDERS: 'orders',
  NEGOTIATION: 'negotiation',
  INBOX: 'inbox',
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
    key: TAB_KEYS.ORDERS,
    icon: 'receipt_long',
    label: 'Orders',
    description: 'Confirm, pack, and track orders through fulfillment',
  },
  {
    key: TAB_KEYS.NEGOTIATION,
    icon: 'sell',
    label: 'Negotiation',
    description: 'Configure price negotiation and respond to buyer offers',
  },
  {
    key: TAB_KEYS.INBOX,
    icon: 'chat',
    label: 'Inbox',
    description: 'Unified messaging with AI-powered auto-reply',
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

export function getActiveModules() {
  return MODULES.filter((m) => !m.comingSoon);
}

export function getAllModules() {
  return MODULES;
}

export function getNavTabs() {
  return MODULES.map((m) => ({
    ...m,
    disabled: !!m.comingSoon,
  }));
}

export function getModuleByKey(key) {
  return MODULES.find((m) => m.key === key) || null;
}

export default MODULES;
