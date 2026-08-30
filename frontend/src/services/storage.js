/**
 * Storage service — centralized API communication.
 *
 * All data is now stored in PostgreSQL via the backend API.
 * Session token is kept in localStorage for persistence across page reloads.
 *
 * Every function is now async. Components must use async/await or .then().
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
  localStorage.setItem('technova_session', JSON.stringify(data));
  if (data?.token) {
    localStorage.setItem('technova_token', data.token);
  }
}

export function clearSession() {
  localStorage.removeItem('technova_session');
  localStorage.removeItem('technova_token');
}

// ── Auth ──

export async function registerSeller(data) {
  const result = await api.post('/auth/register', data);
  setSession({ token: result.access_token, sellerId: result.seller_id, email: result.email, fullName: result.full_name });
  return result;
}

export async function loginSeller(identifier, password) {
  const result = await api.post('/auth/login', { identifier, password });
  setSession({ token: result.access_token, sellerId: result.seller_id, email: result.email, fullName: result.full_name });
  return result;
}

export async function getCurrentUser() {
  return await api.get('/auth/me');
}

// ── Sellers / Profile ──

export async function getSellerById(id) {
  // Use auth/me to get current seller profile
  const data = await getCurrentUser();
  return data?.seller || null;
}

export async function updateSeller(id, updates) {
  // Map frontend field names to backend field names
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
    payload[backendKey] = value;
  }

  return await api.put('/sellers/profile', payload);
}

// ── Products ──

export async function getProductsBySeller(sellerId) {
  try {
    const products = await api.get('/products');
    // Map backend response to frontend shape
    return (products || []).map((p) => ({
      id: p.id,
      sellerId: p.seller_id,
      name: p.name,
      description: p.description,
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
    }));
  } catch {
    return [];
  }
}

export async function getProductById(id) {
  const p = await api.get(`/products/${id}`);
  return p ? {
    id: p.id,
    sellerId: p.seller_id,
    name: p.name,
    description: p.description,
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
  } : null;
}

export async function createProduct(data) {
  const payload = {
    name: data.name,
    description: data.description,
    price: data.price,
    image_url: data.image,
    stock: data.stock || 0,
    low_stock_threshold: data.lowStockThreshold || 5,
  };
  return await api.post('/products', payload);
}

export async function updateProduct(id, updates) {
  const fieldMap = {
    image: 'image_url',
    lowStockThreshold: 'low_stock_threshold',
  };

  const payload = {};
  for (const [key, value] of Object.entries(updates)) {
    const backendKey = fieldMap[key] || key;
    payload[backendKey] = value;
  }

  return await api.put(`/products/${id}`, payload);
}

export async function deleteProduct(id) {
  return await api.delete(`/products/${id}`);
}

// ── Customers ──

export async function getCustomersBySeller(sellerId) {
  try {
    return await api.get('/customers');
  } catch {
    return [];
  }
}

export async function createCustomer(data) {
  const payload = {
    name: data.name,
    email: data.email || null,
    phone: data.contact || null,
  };
  return await api.post('/customers', payload);
}

export async function updateCustomer(id, updates) {
  const payload = {};
  if (updates.contact !== undefined) payload.phone = updates.contact;
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.notes !== undefined) payload.email = updates.notes; // map notes -> email field
  return await api.put(`/customers/${id}`, payload);
}

// ── Derived: Trust Score ──

export async function computeTrustScore(sellerId) {
  const products = await getProductsBySeller(sellerId);
  const allReviews = products.flatMap((p) => p.reviews || []);
  if (allReviews.length === 0) return null;
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  return Math.round(avg * 10) / 10;
}

export async function getReviewCount(sellerId) {
  const products = await getProductsBySeller(sellerId);
  return products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
}

// ── Derived: Customer list from reviews ──

export async function getDerivedCustomers(sellerId) {
  const products = await getProductsBySeller(sellerId);
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

export async function getConversationsBySeller(sellerId) {
  try {
    const convos = await api.get('/conversations');
    return (convos || []).map((c) => ({
      id: c.id,
      sellerId: c.seller_id,
      customerName: c.customer_name,
      lastMessage: c.last_message,
      lastMessageTime: c.last_message_at,
      unreadCount: c.unread_count,
      orderTag: c.order_tag,
    }));
  } catch {
    return [];
  }
}

export async function getConversationById(id) {
  const c = await api.get(`/conversations/${id}`);
  if (!c) return null;
  return {
    id: c.id,
    sellerId: c.seller_id,
    customerName: c.customer_name,
    lastMessage: c.last_message,
    lastMessageTime: c.last_message_at,
    unreadCount: c.unread_count,
    orderTag: c.order_tag,
    messages: (c.messages || []).map((m) => ({
      id: m.id,
      senderType: m.sender_type,
      text: m.text,
      timestamp: m.created_at,
      isAI: m.is_ai_generated,
      order: m.order_data,
    })),
  };
}

export async function createConversation(data) {
  return await api.post('/conversations', {
    customer_name: data.customerName,
    order_tag: data.orderTag,
  });
}

export async function updateConversation(id, updates) {
  const payload = {};
  if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
  if (updates.orderTag !== undefined) payload.order_tag = updates.orderTag;
  return await api.put(`/conversations/${id}`, payload);
}

export async function sendMessage(conversationId, message) {
  const payload = {
    sender_type: message.senderType || 'seller',
    sender_name: message.senderName || null,
    text: message.text,
    is_ai_generated: message.isAI || false,
    order_data: message.order || null,
  };
  return await api.post(`/conversations/${conversationId}/messages`, payload);
}

export async function markAsRead(conversationId) {
  return await api.patch(`/conversations/${conversationId}/read`);
}

// ── Derived: All reviews sorted by date ──

export async function getRecentReviews(sellerId, limit = 10) {
  const products = await getProductsBySeller(sellerId);
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

export async function getTotalUnread(sellerId) {
  const convos = await getConversationsBySeller(sellerId);
  return convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}
