/**
 * axios wrapper for API calls. Reads base URL from VITE_API_BASE.
 */
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export function apiClient(token) {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
  // Disable caching
  instance.interceptors.request.use((config) => {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    return config;
  });

  return instance;
}
