import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      (error: AxiosError<any>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        // Network / connection errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const networkError = new Error('Connection error. Please check your internet and try again.');
          return Promise.reject(networkError);
        }
        return Promise.reject(error);
      }
    );
  }

  // AUTH
  async register(data: any) { return (await this.client.post('/auth/register', data)).data; }
  async login(data: any) { return (await this.client.post('/auth/login', data)).data.data; }
  async verifyOTP(userId: string, otp: string) { return (await this.client.post('/auth/verify-otp', { userId, otp })).data; }
  async resendOTP(userId: string) { return (await this.client.post('/auth/resend-otp', { userId })).data; }
  async logout() { return (await this.client.post('/auth/logout')).data; }

  // SERVICES
  async getServices(filters?: any) { return (await this.client.get('/services', { params: filters })).data.data; }
  async getServiceById(id: string) { return (await this.client.get(`/services/${id}`)).data.data; }
  async createService(data: any) { return (await this.client.post('/services', data)).data.data; }
  async updateService(id: string, data: any) { return (await this.client.put(`/services/${id}`, data)).data.data; }
  async deleteService(id: string) { return (await this.client.delete(`/services/${id}`)).data; }
  async getOrganiserServices() { return (await this.client.get('/organiser/services')).data.data; }

  // RESOURCES
  async getResources() { return (await this.client.get('/resources')).data.data; }
  async createResource(data: any) { return (await this.client.post('/resources', data)).data.data; }
  async updateResource(id: string, data: any) { return (await this.client.put(`/resources/${id}`, data)).data.data; }
  async deleteResource(id: string) { return (await this.client.delete(`/resources/${id}`)).data; }
  async createSchedule(resourceId: string, data: any) { return (await this.client.post(`/resources/${resourceId}/schedules`, data)).data.data; }
  async getSchedules(resourceId: string) { return (await this.client.get(`/resources/${resourceId}/schedules`)).data.data; }
  async deleteSchedule(id: string) { return (await this.client.delete(`/schedules/${id}`)).data; }
  async createException(resourceId: string, data: any) { return (await this.client.post(`/resources/${resourceId}/exceptions`, data)).data.data; }
  async getExceptions(resourceId: string) { return (await this.client.get(`/resources/${resourceId}/exceptions`)).data.data; }
  async deleteException(id: string) { return (await this.client.delete(`/exceptions/${id}`)).data; }

  // AVAILABILITY
  async getAvailableSlots(resourceId: string, date: string) { return (await this.client.get('/availability', { params: { resourceId, date } })).data.data; }

  // BOOKINGS
  async getBookings(filters?: any) { return (await this.client.get('/bookings', { params: filters })).data.data; }
  async getBookingById(id: string) { return (await this.client.get(`/bookings/${id}`)).data.data; }
  async createBooking(data: any) { return (await this.client.post('/bookings', data)).data.data; }
  async updateBookingStatus(id: string, status: string) { return (await this.client.put(`/bookings/${id}/status`, { status })).data.data; }
  async rescheduleBooking(id: string, newSlotTime: string) { return (await this.client.put(`/bookings/${id}/reschedule`, { newSlotTime })).data.data; }
  async cancelBooking(id: string) { return (await this.client.delete(`/bookings/${id}`)).data.data; }

  // PAYMENTS
  async processPayment(bookingId: string, amount: number) { return (await this.client.post('/payments', { bookingId, amount })).data.data; }

  // PROFILE
  async getProfile() { return (await this.client.get('/profile')).data.data; }
  async updateProfile(data: any) { return (await this.client.put('/profile', data)).data.data; }
  async changePassword(data: { currentPassword: string; newPassword: string }) { return (await this.client.put('/profile/password', data)).data; }
  async deleteAccount(password?: string) { return (await this.client.delete('/profile', { data: { password } })).data; }

  // DASHBOARDS
  async getOrganiserDashboard() { return (await this.client.get('/dashboard/organiser')).data.data; }
  async getAdminDashboard() { return (await this.client.get('/dashboard/admin')).data.data; }
  async deactivateUser(id: string) { return (await this.client.put(`/users/${id}/deactivate`)).data.data; }
}

export default new ApiClient();
