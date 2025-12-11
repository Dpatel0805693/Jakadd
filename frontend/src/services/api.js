// src/services/api.js
// Centralized API service for StatsMate backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('token');
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Generic fetch wrapper with auth
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Unauthorized - Please login again');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email, password) {
    const data = await this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async register(name, email, password) {
    const data = await this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout() {
    this.clearAuth();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ==================== FILE ENDPOINTS ====================

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async listFiles() {
    return this.fetch('/api/files');
  }

  async getFile(fileId) {
    return this.fetch(`/api/files/${fileId}`);
  }

  async deleteFile(fileId) {
    return this.fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async downloadFile(fileId) {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/api/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }

  // ==================== ANALYSIS ENDPOINTS ====================

  async createAnalysis(fileId, dependentVar, independentVars, modelType = 'auto') {
    return this.fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        fileId,
        dependentVar,
        independentVars,
        modelType,
      }),
    });
  }

  async getAnalysisStatus(analysisId) {
    return this.fetch(`/api/analyze/${analysisId}/status`);
  }

  async listAnalyses() {
    return this.fetch('/api/analyses');
  }

  async getAnalysis(analysisId) {
    return this.fetch(`/api/analyses/${analysisId}`);
  }

  async deleteAnalysis(analysisId) {
    return this.fetch(`/api/analyses/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // ==================== UTILITY METHODS ====================

  isAuthenticated() {
    return !!this.getToken();
  }

  // Parse variable types from first row of data
  detectVariableTypes(data) {
    if (!data || data.length < 2) return {};
    
    const headers = data[0];
    const firstRow = data[1];
    
    const types = {};
    
    headers.forEach((header, index) => {
      const value = firstRow[index];
      
      // Check if numeric
      if (!isNaN(value) && value !== '') {
        types[header] = 'numeric';
      } else {
        types[header] = 'categorical';
      }
    });
    
    return types;
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;