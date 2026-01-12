import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  requestOTP: (phoneNumber) => api.post('/auth/request-otp', { phoneNumber }),
  verifyOTP: (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Admin APIs
export const adminAPI = {
  getOwners: () => api.get('/admin/owners'),
  getOwnerDetails: (ownerId) => api.get(`/admin/owners/${ownerId}`),
  createOwner: (data) => api.post('/admin/owners', data),
  updateOwner: (ownerId, data) => api.put(`/admin/owners/${ownerId}`, data),
  deleteOwner: (ownerId) => api.delete(`/admin/owners/${ownerId}`),
  addMachineToOwner: (ownerId, data) => api.post(`/admin/owners/${ownerId}/machines`, data),
  deleteMachineFromOwner: (ownerId, machineId) => api.delete(`/admin/owners/${ownerId}/machines/${machineId}`),
  getStatistics: () => api.get('/admin/statistics'),
};

// Owner APIs
export const ownerAPI = {
  getDashboard: () => api.get('/owner/dashboard'),
  getMachines: () => api.get('/owner/machines'),
  getTransactions: (params) => api.get('/owner/transactions', { params }),
  getEarnings: (params) => api.get('/owner/earnings', { params }),
};

// Machine APIs
export const machineAPI = {
  getAll: () => api.get('/machines'),
  getOne: (machineId) => api.get(`/machines/${machineId}`),
  create: (data) => api.post('/machines', data),
  update: (machineId, data) => api.put(`/machines/${machineId}`, data),
  delete: (machineId) => api.delete(`/machines/${machineId}`),
};

// GPIO APIs
export const gpioAPI = {
  getConfig: (machineId) => api.get(`/gpio/${machineId}`),
  updateConfig: (machineId, gpios) => api.put(`/gpio/${machineId}`, { gpios }),
  toggle: (machineId, data) => api.post(`/gpio/${machineId}/toggle`, data),
};

// Sequence APIs
export const sequenceAPI = {
  getAll: () => api.get('/sequences'),
  getOne: (sequenceId) => api.get(`/sequences/${sequenceId}`),
  create: (data) => api.post('/sequences', data),
  update: (sequenceId, data) => api.put(`/sequences/${sequenceId}`, data),
  delete: (sequenceId) => api.delete(`/sequences/${sequenceId}`),
  getDefault: () => api.get('/sequences/default/get'),
};

// Control APIs
export const controlAPI = {
  emergencyStop: (machineId) => api.post(`/control/emergency-stop/${machineId}`),
  startSequence: (machineId, sequenceId) => api.post(`/control/start-sequence/${machineId}`, { sequenceId }),
  getStatus: (machineId) => api.get(`/control/status/${machineId}`),
  toggleGPIO: (machineId, gpioId) => api.post(`/control/toggle-gpio/${machineId}`, { gpioId }),
  pulseGPIO: (machineId, gpioId, duration) => api.post(`/control/pulse-gpio/${machineId}`, { gpioId, duration }),
  restartESP: (machineId) => api.post(`/control/restart-esp/${machineId}`),
  getGPIOStatus: (machineId) => api.get(`/control/gpio-status/${machineId}`),
};

// Transaction APIs
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (transactionId) => api.get(`/transactions/${transactionId}`),
  getStats: (params) => api.get('/transactions/stats/summary', { params }),
};

// Log APIs
export const logAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getMachineLogs: (machineId, params) => api.get(`/logs/machine/${machineId}`, { params }),
  getStats: (params) => api.get('/logs/stats/summary', { params }),
  cleanup: (daysOld) => api.delete(`/logs/cleanup?daysOld=${daysOld}`),
};

// OTA APIs
export const otaAPI = {
  getAll: () => api.get('/ota'),
  upload: (formData) => api.post('/ota/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  activate: (firmwareId) => api.put(`/ota/${firmwareId}/activate`),
  deploy: (firmwareId, machineIds) => api.post(`/ota/${firmwareId}/deploy`, { machineIds }),
  delete: (firmwareId) => api.delete(`/ota/${firmwareId}`),
};

// Razorpay APIs
export const razorpayAPI = {
  createOrder: (machineId) => api.post('/razorpay/create-order', { machineId }),
  verifyPayment: (data) => api.post('/razorpay/verify-payment', data),
};

export default api;
