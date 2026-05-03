import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}
