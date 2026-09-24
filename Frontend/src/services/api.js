import axios from 'axios';

// Ensure no trailing slash on BASE_URL
const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  'https://ai-finance-dashboard-v2t6.onrender.com/api/v1';

const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const TOKEN_KEY = 'fina_token';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// 🔐 User Login Request
export const loginUserApi = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

// 🔐 User Registration Request
export const registerUserApi = async (name, email, password) => {
  const response = await apiClient.post('/auth/register', { name, email, password });
  return response.data;
};

// 📥 Fetch Paginated & Filtered Transactions
export const fetchTransactions = async (page = 1, limit = 20, startDate = null, endDate = null) => {
  const params = { page, limit };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get('/transactions', { params });
  return response.data;
};

// 📊 Fetch Category Aggregations & Expense Totals
export const fetchTransactionStats = async () => {
  const response = await apiClient.get('/transactions/stats');
  return response.data;
};

// 📤 Ingest Bank SMS Alert
export const processIncomingSMS = async (message, timestamp = Date.now()) => {
  const response = await apiClient.post('/transactions/ingest', { message, timestamp });
  return response.data;
};

// ✍️ Create Manual Transaction Record
export const createManualTransaction = async (transactionData) => {
  const transactionDate = transactionData.date || transactionData.createdAt || new Date().toISOString();
  
  const payload = {
    ...transactionData,
    date: transactionDate,
    createdAt: transactionDate
  };

  const response = await apiClient.post('/transactions/manual', payload);
  return response.data;
};

// ✏️ Update Existing Transaction Record
export const updateTransaction = async (id, transactionData) => {
  const transactionDate = transactionData.date || transactionData.createdAt;

  const payload = {
    ...transactionData,
    ...(transactionDate && {
      date: transactionDate,
      createdAt: transactionDate
    })
  };

  const response = await apiClient.put(`/transactions/${id}`, payload);
  return response.data;
};

// 🗑️ Delete Transaction Record
export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`/transactions/${id}`);
  return response.data;
};

export default apiClient;