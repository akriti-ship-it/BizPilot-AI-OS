import axios from 'axios';

// FastAPI runs on port 8000 by default or relative path in production
const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization and OpenAI Key headers automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bizpilot_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const openaiKey = localStorage.getItem('openai_key_bizpilot');
    if (openaiKey && config.headers) {
      config.headers['X-OpenAI-Key'] = openaiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authService = {
  login: async (formData: FormData) => {
    // login uses urlencoded form data as expected by OAuth2PasswordRequestForm
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  signup: async (userData: any) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  testOpenAIKey: async () => {
    const response = await api.post('/api/auth/test-openai');
    return response.data;
  },
};

// Inventory endpoints
export const inventoryService = {
  getProducts: async (search?: string, category?: string, page: number = 1, limit: number = 10) => {
    const response = await api.get('/api/inventory/', {
      params: { search, category, page, limit }
    });
    return response.data;
  },
  addProduct: async (productData: any) => {
    const response = await api.post('/api/inventory/', productData);
    return response.data;
  },
  updateProduct: async (id: number, productData: any) => {
    const response = await api.put(`/api/inventory/${id}`, productData);
    return response.data;
  },
  updateStock: async (id: number, stockLevel: number, safetyThreshold?: number) => {
    const response = await api.put(`/api/inventory/${id}/stock`, {
      stock_level: stockLevel,
      safety_threshold: safetyThreshold,
    });
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await api.delete(`/api/inventory/${id}`);
    return response.data;
  },
};

// Invoices endpoints
export const invoiceService = {
  getInvoices: async () => {
    const response = await api.get('/api/invoices/');
    return response.data;
  },
  uploadInvoice: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Orders endpoints
export const orderService = {
  getOrders: async () => {
    const response = await api.get('/api/orders/');
    return response.data;
  },
  createOrder: async (orderData: any) => {
    const response = await api.post('/api/orders/', orderData);
    return response.data;
  },
  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.put(`/api/orders/${id}/status`, { status });
    return response.data;
  },
  getSuppliers: async () => {
    const response = await api.get('/api/orders/suppliers');
    return response.data;
  },
  addSupplier: async (supplierData: any) => {
    const response = await api.post('/api/orders/suppliers', supplierData);
    return response.data;
  },
};

// Reports endpoints
export const reportService = {
  getReports: async () => {
    const response = await api.get('/api/reports/');
    return response.data;
  },
  getCSVDownloadUrl: (type: string = 'inventory') => {
    const token = localStorage.getItem('bizpilot_token');
    return `${API_URL}/api/reports/export/csv?report_type=${type}&token=${token}`;
  },
  getPDFDownloadUrl: (type: string = 'inventory') => {
    const token = localStorage.getItem('bizpilot_token');
    return `${API_URL}/api/reports/export/pdf?report_type=${type}&token=${token}`;
  },
  getExcelDownloadUrl: (type: string = 'inventory') => {
    const token = localStorage.getItem('bizpilot_token');
    return `${API_URL}/api/reports/export/excel?report_type=${type}&token=${token}`;
  },
};

// Analytics endpoints
export const analyticsService = {
  getDashboardSummary: async () => {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
  },
  getHealthScore: async () => {
    const response = await api.get('/api/analytics/health-score');
    return response.data;
  },
  getCEOBriefing: async () => {
    const response = await api.get('/api/analytics/ceo-briefing');
    return response.data;
  },
};

// Chat and Multi-Agent endpoints
export const chatService = {
  sendMessage: async (message: string) => {
    const response = await api.post('/api/chat/', { message });
    return response.data;
  },
};

// Notifications endpoints
export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/api/notifications/');
    return response.data;
  },
  markRead: async (id: number) => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  },
};

export default api;
