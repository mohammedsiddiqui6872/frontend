import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,  // Add /api here
  headers: {
    'Content-Type': 'application/json'
  }
});

export const socket = io(SOCKET_URL);

// Menu APIs
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getByCategory: (category) => api.get(`/menu/${category}`)
};

// Rest of your code...