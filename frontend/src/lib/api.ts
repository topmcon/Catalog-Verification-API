import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key header for protected routes
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

// Enrichment API functions
export const enrichSingle = async (productData: Record<string, any>) => {
  const response = await api.post('/api/enrich/single', productData);
  return response.data;
};

export const enrichBatch = async (products: Record<string, any>[]) => {
  const response = await api.post('/api/enrich/batch', { products });
  return response.data;
};

export default api;
