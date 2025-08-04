import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env['REACT_APP_API_URL'] || 'https://backend-b3tt.onrender.com/api';
const SOCKET_URL = process.env['REACT_APP_SOCKET_URL'] || 'https://backend-b3tt.onrender.com';

export const api = axios.create({
  baseURL: API_URL,  // API_URL already includes /api
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