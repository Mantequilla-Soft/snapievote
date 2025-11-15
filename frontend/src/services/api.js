import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  checkSetup: () => api.get('/auth/check-setup'),
  setup: (password) => api.post('/auth/setup', { password }),
  login: (password) => api.post('/auth/login', { password })
};

export const accounts = {
  getAll: () => api.get('/accounts'),
  add: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getVP: (username) => api.get(`/accounts/${username}/vp`)
};

export const lists = {
  getGood: () => api.get('/lists/good'),
  addGood: (data) => api.post('/lists/good', data),
  updateGood: (id, data) => api.put(`/lists/good/${id}`, data),
  deleteGood: (id) => api.delete(`/lists/good/${id}`),
  getShit: () => api.get('/lists/shit'),
  addShit: (data) => api.post('/lists/shit', data),
  updateShit: (id, data) => api.put(`/lists/shit/${id}`, data),
  deleteShit: (id) => api.delete(`/lists/shit/${id}`)
};

export const bot = {
  start: (masterPassword) => api.post('/bot/start', { masterPassword }),
  stop: () => api.post('/bot/stop'),
  getStatus: () => api.get('/bot/status'),
  getHistory: (limit) => api.get('/bot/history', { params: { limit } }),
  getLogs: (limit) => api.get('/bot/logs', { params: { limit } })
};

export default api;
