import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already there
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('pms_token');
        // Don't redirect immediately - let the component handle it
      }
    }
    return Promise.reject(error);
  }
);

export default API;
