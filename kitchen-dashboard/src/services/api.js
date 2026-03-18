import axios from 'axios';
import { getBackendUrl } from './backendUrl.js';

const baseURL = getBackendUrl();

const api = axios.create({
  baseURL,
  timeout: 20000
});

export default api;
