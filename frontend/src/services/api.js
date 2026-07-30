import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('[API] No response – backend may be unreachable:', error.message);
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      console.warn('[API] 401 – session expired. Clearing credentials.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('mindmate:session-expired'));
    }

    return Promise.reject(error);
  }
);

export default API;
