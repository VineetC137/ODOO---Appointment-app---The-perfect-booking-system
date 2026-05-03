import { Request } from 'express';

// Role and status constants (SQLite uses strings instead of enums)
export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ORGANISER: 'ORGANISER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BookingStatus = {
  REQUEST: 'REQUEST',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ResourceType = {
  STAFF: 'STAFF',
  ROOM: 'ROOM',
  EQUIPMENT: 'EQUIPMENT',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
  token: string;
}

// Service types
export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration: number;
  price: number;
  resourceIds: string[];
}

// Resource types
export interface CreateResourceRequest {
  name: string;
  type: ResourceType;
  capacity: number;
}

// Schedule types
export interface CreateScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

// Booking types
export interface CreateBookingRequest {
  serviceId: string;
  resourceId: string;
  slotTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

// Availability types
export interface AvailabilitySlot {
  time: string;
  available: boolean;
  remainingCapacity: number;
}
