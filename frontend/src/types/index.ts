// User types
export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ORGANISER: 'ORGANISER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
  organiserId: string;
  organiser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  serviceResources?: ServiceResource[];
}

export interface ServiceResource {
  id: string;
  serviceId: string;
  resourceId: string;
  resource: Resource;
}

// Resource types
export const ResourceType = {
  STAFF: 'STAFF',
  ROOM: 'ROOM',
  EQUIPMENT: 'EQUIPMENT',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  isActive: boolean;
  organiserId: string;
}

// Booking types
export const BookingStatus = {
  REQUEST: 'REQUEST',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export interface Booking {
  id: string;
  slotTime: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  customerId: string;
  serviceId: string;
  resourceId: string;
  service: Service;
  resource: Resource;
  createdAt: string;
  updatedAt: string;
}

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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
