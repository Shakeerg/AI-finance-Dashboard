// frontend/src/services/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api/v1';
// Create a standardized Axios client worker instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Terminate request if server takes longer than 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dynamic JWT Interceptor: Automatically injects bearer token on every single request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fina_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// 🔐 User Login Request
export const loginUserApi = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data; // Returns token and user object payloads
};

// 🔐 User Registration Request
export const registerUserApi = async (name, email, password) => {
  const response = await apiClient.post('/auth/register', { name, email, password });
  return response.data;
};

// 📥 Fetch Transactions (Secure & Multi-tenant)
export const fetchTransactions = async () => {
  const response = await apiClient.get('/transactions');
  return response.data;
};

// 📊 Fetch Category Aggregations / Financial Stats
export const fetchTransactionStats = async () => {
  const response = await apiClient.get('/transactions/stats');
  return response.data;
};

// 📤 Ingest Bank SMS Alert (Secure & Managed via AI)
export const processIncomingSMS = async (rawText) => {
  const response = await apiClient.post('/transactions', { rawText });
  return response.data;
};

// 🗑️ Delete Transaction Record (Securely owned validation check)
export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`/transactions/${id}`);
  return response.data;
};

export default apiClient;