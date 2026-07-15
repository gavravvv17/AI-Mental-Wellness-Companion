import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
});

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 → dispatch a custom event so AuthContext can react without circular imports
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
      // Fire a DOM event; AuthContext listens for this and updates React state
      window.dispatchEvent(new CustomEvent('mindmate:session-expired'));
    }

    return Promise.reject(error);
  }
);

export default API;
