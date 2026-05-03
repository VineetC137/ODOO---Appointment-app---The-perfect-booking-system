import axios from 'axios';
import { Service, AvailabilityResponse, Booking, CreateBookingRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
};

export const serviceAPI = {
  getAll: async (): Promise<Service[]> => {
    const { data } = await api.get('/services');
    return data;
  },
  getById: async (id: string): Promise<Service> => {
    const { data } = await api.get(`/services/${id}`);
    return data;
  },
};

export const resourceAPI = {
  getAll: async () => {
    const { data } = await api.get('/resources');
    return data;
  },
};

export const availabilityAPI = {
  getSlots: async (resourceId: string, date: string): Promise<AvailabilityResponse> => {
    const { data } = await api.get('/availability', {
      params: { resourceId, date },
    });
    return data;
  },
};

export const bookingAPI = {
  create: async (booking: CreateBookingRequest): Promise<Booking> => {
    const { data } = await api.post('/bookings', booking);
    return data;
  },
  getMyBookings: async (): Promise<Booking[]> => {
    const { data } = await api.get('/bookings');
    return data;
  },
  cancel: async (id: string): Promise<Booking> => {
    const { data } = await api.patch(`/bookings/${id}/cancel`);
    return data;
  },
};

export default api;
