import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AI Agent APIs
export const runFullWorkflow = async (data) => {
  const res = await api.post('/ai/full-workflow', data);
  return res.data;
};

export const submitIntake = async (data) => {
  const res = await api.post('/ai/intake', data);
  return res.data;
};

export const runDiagnosis = async (data) => {
  const res = await api.post('/ai/diagnose', data);
  return res.data;
};

export const getWeather = async (data) => {
  const res = await api.post('/ai/weather', data);
  return res.data;
};

export const getTreatment = async (data) => {
  const res = await api.post('/ai/treatment', data);
  return res.data;
};

export const calculateCost = async (data) => {
  const res = await api.post('/ai/cost', data);
  return res.data;
};

export const verifyTreatment = async (data) => {
  const res = await api.post('/ai/verify', data);
  return res.data;
};

// Market & Scheme APIs
export const getMarketPrices = async (params) => {
  const res = await api.get('/market/prices', { params });
  return res.data;
};

export const getSchemes = async (params) => {
  const res = await api.get('/market/schemes', { params });
  return res.data;
};

// Marketplace APIs
export const getProducts = async (params) => {
  const res = await api.get('/marketplace/products', { params });
  return res.data;
};

export const createOrder = async (orderData) => {
  const res = await api.post('/marketplace/order', orderData);
  return res.data;
};

export const getPestReports = async (params) => {
  const res = await api.get('/marketplace/pest-reports', { params });
  return res.data;
};

// Farmer APIs
export const getFarmerProfile = async (id = 'demo-farmer-id') => {
  const res = await api.get(`/farmer/profile/${id}`);
  return res.data;
};

export const getDashboardSummary = async (farmerId = 'demo-farmer-id') => {
  const res = await api.get(`/farmer/dashboard/${farmerId}`);
  return res.data;
};

export default api;
