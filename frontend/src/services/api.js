import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('memorasupport_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Conversations API
export const conversationsAPI = {
  list: () => api.get('/conversations'),
  create: (title) => api.post('/conversations', { title }),
  get: (id) => api.get(`/conversations/${id}`),
  delete: (id) => api.delete(`/conversations/${id}`),
};

// Chat API
export const chatAPI = {
  sendMessage: (conversationId, message) => api.post('/chat', { conversation_id: conversationId, message }),
};

// Memory API
export const memoryAPI = {
  getMemories: () => api.get('/memory'),
  searchMemories: (query) => api.get(`/memory/search?q=${encodeURIComponent(query)}`),
};

// Tickets API
export const ticketsAPI = {
  list: () => api.get('/tickets'),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.patch(`/tickets/${id}`, data),
};

// Admin API
export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getCustomers: () => api.get('/admin/customers'),
  getCustomerDetail: (id) => api.get(`/admin/customers/${id}`),
};

// Demo API
export const demoAPI = {
  seed: () => api.post('/demo/seed'),
  resetMemory: (customerId) => api.post(`/demo/reset-memory/${customerId}`),
};

export default api;
