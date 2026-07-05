// frontend/src/services/api.js
import axios from 'axios';

// Create a standardized Axios client worker instance
const apiClient = axios.create({
  // Point directly to your local Express server port
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000, // Terminate request if server takes longer than 10 seconds to respond
  headers: {
    'Content-Type': 'application/json',
    // Inject the exact shield key your backend middleware expects
    'x-api-key': 'FinaSecureShieldKey_2026_S'
  }
});

/**
 * Service call to fetch the chronologically sorted transaction feed
 */
export const fetchTransactions = async () => {
  const response = await apiClient.get('/transactions');
  return response.data;
};

/**
 * Service call to fetch the category aggregation spending summaries
 */
export const fetchTransactionStats = async () => {
  const response = await apiClient.get('/transactions/stats');
  return response.data;
};

/**
 * Service call to ingest a fresh raw SMS alert text string to the AI engine
 */
export const processIncomingSMS = async (rawText) => {
  const response = await apiClient.post('/transactions', { rawText });
  return response.data;
};

// frontend/src/services/api.js

export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`/transactions/${id}`);
  return response.data;
};

export default apiClient;