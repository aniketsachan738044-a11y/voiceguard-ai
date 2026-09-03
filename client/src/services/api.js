import axios from 'axios';

const RENDER_URL = 'https://voiceguard-backend-laf2.onrender.com';

const getBaseUrl = () => {
  // If explicit env var is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // On cloud deployments (Vercel, etc.), use Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return RENDER_URL;
  }
  // Local dev — use Vite proxy
  return '';
};

const BASE = getBaseUrl();

// Create axios instance with generous timeout for Render free-tier cold starts (~50s)
const http = axios.create({
  timeout: 90000,
});

// Helper: make a request with up to 2 retries (for cold-start resilience)
async function requestWithRetry(fn, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      // Wait 2s before retry
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

export const api = {
  checkHealth: async () => {
    return requestWithRetry(async () => {
      const res = await http.get(`${BASE}/api/health`);
      return res.data;
    }, 3);
  },

  analyzeAudio: async (audioBlobOrFile, filename = 'recording.webm') => {
    const formData = new FormData();
    if (audioBlobOrFile instanceof File) {
      formData.append('audio', audioBlobOrFile);
    } else {
      formData.append('audio', audioBlobOrFile, filename);
    }

    return requestWithRetry(async () => {
      const res = await http.post(`${BASE}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min for large audio files on slow cloud
      });
      return res.data;
    }, 1);
  },

  getHistory: async (params = {}) => {
    const res = await http.get(`${BASE}/api/history`, { params });
    return res.data;
  },

  deleteHistoryItem: async (id) => {
    const res = await http.delete(`${BASE}/api/history/${id}`);
    return res.data;
  },

  clearHistory: async () => {
    const res = await http.delete(`${BASE}/api/history`);
    return res.data;
  },

  getSettings: async () => {
    const res = await http.get(`${BASE}/api/settings`);
    return res.data;
  },

  updateSettings: async (settingsData) => {
    const res = await http.post(`${BASE}/api/settings`, settingsData);
    return res.data;
  }
};
