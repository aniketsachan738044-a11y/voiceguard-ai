import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '') + '/api';

export const api = {
  checkHealth: async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  analyzeAudio: async (audioBlobOrFile, filename = 'recording.webm') => {
    const formData = new FormData();
    if (audioBlobOrFile instanceof File) {
      formData.append('audio', audioBlobOrFile);
    } else {
      formData.append('audio', audioBlobOrFile, filename);
    }

    const res = await axios.post(`${API_BASE}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getHistory: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/history`, { params });
    return res.data;
  },

  deleteHistoryItem: async (id) => {
    const res = await axios.delete(`${API_BASE}/history/${id}`);
    return res.data;
  },

  clearHistory: async () => {
    const res = await axios.delete(`${API_BASE}/history`);
    return res.data;
  },

  getSettings: async () => {
    const res = await axios.get(`${API_BASE}/settings`);
    return res.data;
  },

  updateSettings: async (settingsData) => {
    const res = await axios.post(`${API_BASE}/settings`, settingsData);
    return res.data;
  }
};
