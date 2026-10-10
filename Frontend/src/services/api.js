import axios from 'axios';

// Ensure no trailing slash on BASE_URL
const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5001/api/v1'
    : 'https://ai-finance-dashboard-v2t6.onrender.com/api/v1');

const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

// Socket.io lives on the server root, not under /api/v1
export const API_ORIGIN = (() => {
  try {
    return new URL(BASE_URL).origin;
  } catch {
    return BASE_URL;
  }
})();

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
      localStorage.removeItem('fina_user');
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

// 📱 Phone-app device key (the plain key is returned only once, on create)
export const getDeviceKeyStatus = async () => {
  const response = await apiClient.get('/auth/device-key');
  return response.data; // { hasKey, prefix, createdAt, lastSeenAt }
};

export const createDeviceKey = async () => {
  const response = await apiClient.post('/auth/device-key');
  return response.data; // { deviceKey }
};

export const revokeDeviceKey = async () => {
  const response = await apiClient.delete('/auth/device-key');
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
// Resolves to { ignored: true } when the server filtered it out (OTP, promo, chat),
// or { jobId } when it was queued for the AI parser.
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

// ✅ Mark a flagged transaction as reviewed (clears low-confidence + duplicate flags)
export const confirmTransaction = async (id) => {
  const response = await apiClient.post(`/transactions/${id}/confirm`);
  return response.data;
};

// 🗑️ Delete Transaction Record
export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`/transactions/${id}`);
  return response.data;
};

export default apiClient;