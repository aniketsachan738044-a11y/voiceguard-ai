import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://voiceguard-backend-laf2.onrender.com';
  }
  return '';
};

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000 // 60s timeout for cloud cold starts
});

export const api = {
  checkHealth: async () => {
    const res = await apiClient.get('/api/health');
    return res.data;
  },

  analyzeAudio: async (audioBlobOrFile, filename = 'recording.webm') => {
    const formData = new FormData();
    if (audioBlobOrFile instanceof File) {
      formData.append('audio', audioBlobOrFile);
    } else {
      formData.append('audio', audioBlobOrFile, filename);
    }

    const res = await apiClient.post('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getHistory: async (params = {}) => {
    const res = await apiClient.get('/api/history', { params });
    return res.data;
  },

  deleteHistoryItem: async (id) => {
    const res = await apiClient.delete(`/api/history/${id}`);
    return res.data;
  },

  clearHistory: async () => {
    const res = await apiClient.delete('/api/history');
    return res.data;
  },

  getSettings: async () => {
    const res = await apiClient.get('/api/settings');
    return res.data;
  },

  updateSettings: async (settingsData) => {
    const res = await apiClient.post('/api/settings', settingsData);
    return res.data;
  }
};
