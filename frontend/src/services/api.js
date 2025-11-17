// services/api.js - API calls to backend services
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AI_GATEWAY_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8001';
const R_OLS_URL = import.meta.env.VITE_R_OLS_URL || 'http://localhost:8000';
const R_LOGISTIC_URL = import.meta.env.VITE_R_LOGISTIC_URL || 'http://localhost:8002';

// Create axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiGateway = axios.create({
  baseURL: AI_GATEWAY_URL,
});

const rOls = axios.create({
  baseURL: R_OLS_URL,
});

const rLogistic = axios.create({
  baseURL: R_LOGISTIC_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const apiService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  
  // File upload
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  // Get uploaded files
  getFiles: () => api.get('/files'),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  
  // AI Gateway - Type Detection
  detectTypes: (data) => aiGateway.post('/detect-types', data),
  
  // AI Gateway - Model Suggestion
  suggestModel: (data) => aiGateway.post('/suggest-model', data),
  
  // AI Gateway - Interpret Results
  interpretResults: (data) => aiGateway.post('/interpret', data),
  
  // R Services - OLS Regression
  runOLS: (data) => rOls.post('/ols', data),
  
  // R Services - Logistic Regression
  runLogistic: (data) => rLogistic.post('/logistic', data),
  
  // Analysis history
  getAnalyses: () => api.get('/analyses'),
  getAnalysis: (analysisId) => api.get(`/analyses/${analysisId}`),
  saveAnalysis: (data) => api.post('/analyses', data),
};

export default apiService;