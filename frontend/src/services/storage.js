/**
 * Storage service — centralized API communication.
 *
 * Single identity, single login: role is chosen once at registration and
 * carried in the JWT. Sellers see the seller dashboard; buyers see the
 * buyer app (discover / chat / orders / profile).
 *
 * All data lives in the backend: PostgreSQL (identity, products, orders,
 * payments, analytics), MongoDB (conversations/messages), Redis (realtime).
 */
import api from '../utils/api';

// ── Session (JWT token stored in localStorage) ──

export function getSession() {
  try {
    const raw = localStorage.getItem('technova_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(data) {
  const session = {
    token: data.access_token || data.token,
    role: data.role || data.role || 'seller',
    sellerId: data.seller_id || null,
    buyerId: data.buyer_id || null,
    email: data.email,
    fullName: data.full_name || data.fullName,
  };
  localStorage.setItem('technova_session', JSON.stringify(session));
  if (session.token) localStorage.setItem('technova_token', session.token);
  return session;
}

export function clearSession() {
  localStorage.removeItem('technova_session');
  localStorage.removeItem('technova_token');
}

// ── Auth (role picked once, at registration) ──

export async function registerUser(data) {
  const result = await api.post('/auth/register', data);
  return setSession(result);
}

export async function loginUser(identifier, password) {
  const result = await api.post('/auth/login', { identifier, password });
  return setSession(result);
}

// Aliases kept for existing screens
export const registerSeller = registerUser;
export const loginSeller = loginUser;

// One-click temporary login with a seeded demo account (seller1/seller2/buyer1/buyer2/admin)
export async function demoLogin(demoKey) {
  const result = await api.post('/auth/demo-login', { demo: demoKey });
  return setSession(result);
}

export async function logoutUser() {
  try { await api.post('/auth/logout'); } catch { /* stateless JWT */ }
  clearSession();
}

export async function getCurrentUser() {
  return await api.get('/auth/me');
}

// ── Seller profile ──

export async function getSellerById() {
  const data = await getCurrentUser();
  return data?.seller || null;
}

export async function updateSeller(id, updates) {
  const fieldMap = {
    storeName: 'business_name',
    category: 'business_type',
    description: 'description',
    phone: 'phone',
    email: 'email',
    address: 'address_line_1',
  };
  const payload = {};
  for (const [key, value] of Object.entries(updates)) {
    const backendKey = fieldMap[key] || key;
    if (value !== undefined) payload[backendKey] = value;
  }
  return await api.put('/sellers/profile', payload);
}

// ── Buyer profile ──

export async function getBuyerById() {
  const data = await getCurrentUser();
  return data?.buyer || null;
}

export async function updateBuyer(id, updates) {
  const payload = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) payload[key] = value;
  }
  return await api.put('/buyers/me', payload);
}

// ── Products (seller CRUD) ──

export async function getProductsBySeller(onPage) {
  // The backend returns products paginated (offset-based). Fetch page by page
  // so a large catalog never arrives in one giant response — the first page
  // resolves quickly and remaining pages stream in via the onPage callback.
  const PAGE = 100;
  try {
    const all = [];
    let offset = 0;
    let hasMore = true;
    let pages = 0;
    while (hasMore && pages < 100) {
      const data = await api.get(`/products?limit=${PAGE}&offset=${offset}`);
      const items = (data?.items || []).map(mapProduct);
      all.push(...items);
      if (onPage) onPage(items);
      hasMore = !!data?.has_more;
      offset += PAGE;
      pages += 1;
    }
    return all;
  } catch {
    return [];
  }
}

function mapProduct(p) {
  return {
    id: p.id,
    sellerId: p.seller_id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    image: p.image_url,
    stock: p.stock,
    lowStockThreshold: p.low_stock_threshold,
    likes: p.likes,
    reviews: (p.reviews || []).map((r) => ({
      id: r.id,
      customerName: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      sellerReply: r.seller_reply,
      date: r.created_at,
    })),
    createdAt: p.created_at,
  };
}

export async function getProductById(id) {
  const p = await api.get(`/products/${id}`);
  return p ? mapProduct(p) : null;
}

export async function createProduct(data) {
  return await api.post('/products', {
    name: data.name,
    description: data.description,
    category: data.category || 'general',
    price: data.price,
    image_url: data.image,
    stock: data.stock || 0,
    low_stock_threshold: data.lowStockThreshold || 5,
  });
}

export async function updateProduct(id, updates) {
  const fieldMap = { image: 'image_url', lowStockThreshold: 'low_stock_threshold' };
  const payload = {};
  for (const [key, value] of Object.entries(updates)) {
    const backendKey = fieldMap[key] || key;
    if (value !== undefined) payload[backendKey] = value;
  }
  return await api.put(`/products/${id}`, payload);
}

export async function deleteProduct(id) {
  return await api.delete(`/products/${id}`);
}

// ── Discovery (buyer-facing search) ──

export async function discover(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  }
  const query = qs.toString();
  return await api.get(`/discover${query ? `?${query}` : ''}`);
}

export async function getSellerPublic(sellerId) {
  return await api.get(`/sellers/${sellerId}`);
}

export async function getSellerPublicProducts(sellerId, cursor) {
  const qs = cursor ? `?cursor=${cursor}` : '';
  return await api.get(`/sellers/${sellerId}/products${qs}`);
}

// ── Customers (seller-side buyer discovery, unchanged API) ──

export async function getCustomersBySeller() {
  try { return await api.get('/customers'); } catch { return []; }
}

export async function createCustomer(data) {
  return await api.post('/customers', {
    name: data.name, email: data.email || null, phone: data.contact || null,
  });
}

export async function updateCustomer(id, updates) {
  const payload = {};
  if (updates.contact !== undefined) payload.phone = updates.contact;
  if (updates.name !== undefined) payload.name = updates.name;
  return await api.put(`/customers/${id}`, payload);
}

// ── Conversations / Chat (MongoDB-backed) ──

export async function getConversations() {
  try {
    const data = await api.get('/conversations');
    return (data?.items || []).map((c) => ({
      id: c.id,
      sellerId: c.seller_id,
      buyerId: c.buyer_id,
      customerName: c.customer_name,
      lastMessage: c.last_message,
      lastMessageTime: c.last_message_at,
      unreadCount: c.unread_count,
      status: c.status,
    }));
  } catch {
    return [];
  }
}

export async function getConversationById(id) {
  // Fetch conversation summary and message page in parallel (2 sequential
  // round-trips made opening a chat noticeably slow)
  const [c, page] = await Promise.all([
    api.get(`/conversations/${id}`),
    api.get(`/conversations/${id}/messages?limit=200`),
  ]);
  if (!c) return null;
  return {
    id: c.id,
    sellerId: c.seller_id,
    buyerId: c.buyer_id,
    customerName: c.customer_name,
    lastMessage: c.last_message,
    lastMessageTime: c.last_message_at,
    unreadCount: c.unread_count,
    status: c.status,
    messages: (page.items || []).map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      text: m.content,
      timestamp: m.created_at,
      isAI: m.is_ai_generated,
      sentiment: m.sentiment,
    })),
  };
}

export async function createConversation(buyerId) {
  return await api.post('/conversations', { buyer_id: buyerId });
}

export async function sendMessage(conversationId, message) {
  return await api.post(`/conversations/${conversationId}/messages`, {
    content: message.text,
    message_type: 'text',
    client_message_id: message.clientMessageId,
  });
}

export async function markAsRead(conversationId) {
  return await api.patch(`/conversations/${conversationId}/read`);
}

// ── Human approval: AI drafts (seller reviews before send) ──

export async function listConversationDrafts(conversationId) {
  try {
    const data = await api.get(`/conversations/${conversationId}/drafts`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateDraft(conversationId) {
  return await api.post(`/conversations/${conversationId}/drafts`);
}

export async function editDraft(draftId, content) {
  return await api.put(`/ai/drafts/${draftId}`, { content });
}

export async function setDraftStatus(draftId, status) {
  return await api.patch(`/ai/drafts/${draftId}/status`, { status });
}

export async function sendDraft(draftId) {
  return await api.post(`/ai/drafts/${draftId}/send`);
}

export async function analyzeText(content) {
  return await api.post('/ai/analyze', { content });
}

// ── Orders ──

export async function createOrder(items, extra = {}) {
  return await api.post('/orders', {
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    shipping_address: extra.shippingAddress,
    notes: extra.notes,
  });
}

export async function getOrders(cursor) {
  try {
    const qs = cursor ? `?cursor=${cursor}` : '';
    const data = await api.get(`/orders${qs}`);
    return { items: (data.items || []).map(mapOrder), nextCursor: data.next_cursor };
  } catch {
    return { items: [], nextCursor: null };
  }
}

export async function getOrder(id) {
  const o = await api.get(`/orders/${id}`);
  return o ? mapOrder(o) : null;
}

export async function updateOrderStatus(id, status) {
  return await api.patch(`/orders/${id}/status`, { status });
}

export async function reviewOrder(orderId, rating, comment, title) {
  return await api.post(`/orders/${orderId}/review`, { rating, comment, title });
}

function mapOrder(o) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    status: o.status,
    totalAmount: o.total_amount,
    currency: o.currency,
    paymentMethod: o.payment_method,
    shippingAddress: o.shipping_address,
    notes: o.notes,
    createdAt: o.created_at,
    items: (o.items || []).map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.total_price,
    })),
  };
}

// ── Payments / Transactions ──

export async function getPaymentForOrder(orderId) {
  return await api.get(`/payments/orders/${orderId}`);
}

// ── Analytics ──

export async function getSellerAnalytics(sellerId, force = false) {
  try {
    return await api.get(`/analytics/${sellerId}${force ? '?force=true' : ''}`);
  } catch {
    return null;
  }
}

export async function getTrustScore(sellerId) {
  try { return await api.get(`/analytics/${sellerId}/trust-score`); } catch { return null; }
}

// ── Derived helpers (pure functions over an already-fetched product list) ──
// These used to fetch the full product catalog themselves, so opening a tab
// that used them re-downloaded every product (and its reviews) N times.
// Callers that already have products (App state) now pass them in directly.

export async function getTotalUnread() {
  // Lightweight aggregate endpoint — the old version fetched and mapped the
  // entire conversation list just to sum unread counts
  try {
    const data = await api.get('/conversations/unread/total');
    return data?.total || 0;
  } catch {
    return 0;
  }
}

export function getRecentReviews(products, limit = 10) {
  const allReviews = [];
  for (const product of products) {
    for (const review of product.reviews || []) {
      allReviews.push({ ...review, productName: product.name, productId: product.id });
    }
  }
  return allReviews.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

export function computeTrustScore(products) {
  const allReviews = products.flatMap((p) => p.reviews || []);
  if (allReviews.length === 0) return null;
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  return Math.round(avg * 10) / 10;
}

export function getReviewCount(products) {
  return products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
}

// ── Derived: Customer list from reviews ──

export function getDerivedCustomers(products) {
  const customerMap = {};
  for (const product of products) {
    for (const review of product.reviews || []) {
      const key = review.customerName.toLowerCase().trim();
      if (!customerMap[key]) {
        customerMap[key] = { name: review.customerName, reviews: [], lastDate: review.date };
      }
      customerMap[key].reviews.push({ ...review, productName: product.name, productId: product.id });
      if (review.date > customerMap[key].lastDate) customerMap[key].lastDate = review.date;
    }
  }
  return customerMap;
}