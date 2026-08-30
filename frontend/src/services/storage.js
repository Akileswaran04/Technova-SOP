/**
 * Storage service — centralized localStorage access.
 * 
 * All data persistence logic lives here. To swap for real API calls,
 * replace these functions with fetch/axios calls. The rest of the app
 * only interacts with data through this module and useLocalStorage hooks.
 * 
 * Data is keyed by seller ID so multiple sellers can coexist in localStorage.
 */

const KEYS = {
  SELLERS: 'msme_sellers',
  PRODUCTS: 'msme_products',
  CUSTOMERS: 'msme_customers',
  SESSION: 'msme_session',
  CONVERSATIONS: 'msme_conversations',
};

// ── Generic helpers ──

function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Session ──

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSION));
  } catch {
    return null;
  }
}

export function setSession(sellerId) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify({ loggedInSellerId: sellerId }));
}

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}

// ── Sellers ──

export function getSellers() {
  return getAll(KEYS.SELLERS);
}

export function getSellerById(id) {
  return getAll(KEYS.SELLERS).find((s) => s.id === id) || null;
}

export function createSeller(data) {
  const sellers = getAll(KEYS.SELLERS);
  sellers.push(data);
  setAll(KEYS.SELLERS, sellers);
  return data;
}

export function updateSeller(id, updates) {
  const sellers = getAll(KEYS.SELLERS);
  const idx = sellers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sellers[idx] = { ...sellers[idx], ...updates };
  setAll(KEYS.SELLERS, sellers);
  return sellers[idx];
}

// ── Products ──

export function getProductsBySeller(sellerId) {
  return getAll(KEYS.PRODUCTS).filter((p) => p.sellerId === sellerId);
}

export function getProductById(id) {
  return getAll(KEYS.PRODUCTS).find((p) => p.id === id) || null;
}

export function createProduct(data) {
  const products = getAll(KEYS.PRODUCTS);
  products.push(data);
  setAll(KEYS.PRODUCTS, products);
  return data;
}

export function updateProduct(id, updates) {
  const products = getAll(KEYS.PRODUCTS);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates };
  setAll(KEYS.PRODUCTS, products);
  return products[idx];
}

export function deleteProduct(id) {
  const products = getAll(KEYS.PRODUCTS).filter((p) => p.id !== id);
  setAll(KEYS.PRODUCTS, products);
}

// ── Customers ──

export function getCustomersBySeller(sellerId) {
  return getAll(KEYS.CUSTOMERS).filter((c) => c.sellerId === sellerId);
}

export function createCustomer(data) {
  const customers = getAll(KEYS.CUSTOMERS);
  customers.push(data);
  setAll(KEYS.CUSTOMERS, customers);
  return data;
}

export function updateCustomer(id, updates) {
  const customers = getAll(KEYS.CUSTOMERS);
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  customers[idx] = { ...customers[idx], ...updates };
  setAll(KEYS.CUSTOMERS, customers);
  return customers[idx];
}

// ── Derived: Trust Score ──

export function computeTrustScore(sellerId) {
  const products = getProductsBySeller(sellerId);
  const allReviews = products.flatMap((p) => p.reviews || []);
  if (allReviews.length === 0) return null; // null means "New Seller"
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  return Math.round(avg * 10) / 10;
}

export function getReviewCount(sellerId) {
  const products = getProductsBySeller(sellerId);
  return products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
}

// ── Derived: Customer list from reviews/likes ──

export function getDerivedCustomers(sellerId) {
  const products = getProductsBySeller(sellerId);
  const customerMap = {};

  for (const product of products) {
    for (const review of product.reviews || []) {
      const key = review.customerName.toLowerCase().trim();
      if (!customerMap[key]) {
        customerMap[key] = {
          name: review.customerName,
          reviews: [],
          lastDate: review.date,
        };
      }
      customerMap[key].reviews.push({ ...review, productName: product.name, productId: product.id });
      if (review.date > customerMap[key].lastDate) {
        customerMap[key].lastDate = review.date;
      }
    }
  }

  return customerMap;
}

// ── Conversations / Inbox ──

export function getConversationsBySeller(sellerId) {
  return getAll(KEYS.CONVERSATIONS).filter((c) => c.sellerId === sellerId);
}

export function getConversationById(id) {
  return getAll(KEYS.CONVERSATIONS).find((c) => c.id === id) || null;
}

export function createConversation(data) {
  const convos = getAll(KEYS.CONVERSATIONS);
  convos.push(data);
  setAll(KEYS.CONVERSATIONS, convos);
  return data;
}

export function updateConversation(id, updates) {
  const convos = getAll(KEYS.CONVERSATIONS);
  const idx = convos.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  convos[idx] = { ...convos[idx], ...updates };
  setAll(KEYS.CONVERSATIONS, convos);
  return convos[idx];
}

export function sendMessage(conversationId, message) {
  const convos = getAll(KEYS.CONVERSATIONS);
  const idx = convos.findIndex((c) => c.id === conversationId);
  if (idx === -1) return null;
  convos[idx].messages.push(message);
  convos[idx].lastMessage = message.text;
  convos[idx].lastMessageTime = message.timestamp;
  convos[idx].unreadCount = message.senderType === 'customer' ? (convos[idx].unreadCount || 0) + 1 : convos[idx].unreadCount || 0;
  setAll(KEYS.CONVERSATIONS, convos);
  return convos[idx];
}

export function markAsRead(conversationId) {
  const convos = getAll(KEYS.CONVERSATIONS);
  const idx = convos.findIndex((c) => c.id === conversationId);
  if (idx === -1) return null;
  convos[idx].unreadCount = 0;
  setAll(KEYS.CONVERSATIONS, convos);
  return convos[idx];
}

// ── Derived: All reviews sorted by date ──

export function getRecentReviews(sellerId, limit = 10) {
  const products = getProductsBySeller(sellerId);
  const allReviews = [];
  for (const product of products) {
    for (const review of product.reviews || []) {
      allReviews.push({ ...review, productName: product.name, productId: product.id });
    }
  }
  return allReviews
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

export function getTotalUnread(sellerId) {
  return getConversationsBySeller(sellerId).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}
