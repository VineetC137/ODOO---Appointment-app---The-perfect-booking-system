export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  resourceId: string;
  slotTime: string;
  status: string;
  service: Service;
  resource: {
    id: string;
    name: string;
  };
}

export interface CreateBookingRequest {
  serviceId: string;
  resourceId: string;
  slotTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}
