import prisma from '../config/database';
import { CreateResourceRequest, CreateScheduleRequest } from '../types';

export class ResourceService {
  async getOrganiserResources(organiserId: string) {
    return prisma.resource.findMany({
      where: { organiserId, isActive: true },
      include: { schedules: true, exceptions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResourceById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: { schedules: true, exceptions: true },
    });
  }

  async createResource(organiserId: string, data: CreateResourceRequest) {
    const { name, type, capacity } = data;
    if (capacity <= 0) throw new Error('Capacity must be greater than 0');

    return prisma.resource.create({
      data: { name, type, capacity, organiserId },
    });
  }

  async updateResource(resourceId: string, organiserId: string, data: Partial<CreateResourceRequest>) {
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) throw new Error('Resource not found');
    if (resource.organiserId !== organiserId) throw new Error('Unauthorized');
    if (data.capacity !== undefined && data.capacity <= 0) throw new Error('Capacity must be greater than 0');

    return prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      },
    });
  }

  async deleteResource(resourceId: string, organiserId: string) {
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource) throw new Error('Resource not found');
    if (resource.organiserId !== organiserId) throw new Error('Unauthorized');

    return prisma.resource.update({
      where: { id: resourceId },
      data: { isActive: false },
    });
  }

  async createSchedule(resourceId: string, data: CreateScheduleRequest) {
    const { dayOfWeek, startTime, endTime, slotDuration } = data;

    if (dayOfWeek < 0 || dayOfWeek > 6) throw new Error('Day of week must be 0–6');

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Time must be in HH:MM format');
    }
    if (startTime >= endTime) throw new Error('End time must be after start time');

    return prisma.schedule.create({
      data: { resourceId, dayOfWeek, startTime, endTime, slotDuration },
    });
  }

  async updateSchedule(scheduleId: string, data: Partial<CreateScheduleRequest>) {
    return prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.slotDuration && { slotDuration: data.slotDuration }),
      },
    });
  }

  async deleteSchedule(scheduleId: string) {
    return prisma.schedule.delete({ where: { id: scheduleId } });
  }

  async getResourceSchedules(resourceId: string) {
    return prisma.schedule.findMany({
      where: { resourceId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async createException(resourceId: string, date: string, reason?: string) {
    return prisma.exception.create({
      data: { resourceId, date: new Date(date), reason },
    });
  }

  async deleteException(exceptionId: string) {
    return prisma.exception.delete({ where: { id: exceptionId } });
  }

  async getResourceExceptions(resourceId: string) {
    return prisma.exception.findMany({
      where: { resourceId },
      orderBy: { date: 'asc' },
    });
  }
}

export default new ResourceService();
