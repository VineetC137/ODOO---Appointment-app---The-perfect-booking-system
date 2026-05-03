import prisma from '../config/database';
import { CreateServiceRequest } from '../types';

export class ServiceService {
  /**
   * Get all active services with optional filtering
   * Note: SQLite does not support case-insensitive mode — using contains without mode
   */
  async getAllServices(filters?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    duration?: number;
  }) {
    const where: any = { isActive: true };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters?.duration) {
      where.duration = filters.duration;
    }

    return prisma.service.findMany({
      where,
      include: {
        organiser: { select: { id: true, firstName: true, lastName: true } },
        serviceResources: { include: { resource: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        organiser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        serviceResources: { include: { resource: true } },
      },
    });
  }

  /**
   * Create a new service and link resources (Organiser only)
   */
  async createService(organiserId: string, data: CreateServiceRequest) {
    const { name, description, duration, price, resourceIds } = data;

    return prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: { name, description: description || '', duration, price, organiserId },
      });

      if (resourceIds && resourceIds.length > 0) {
        await tx.serviceResource.createMany({
          data: resourceIds.map((resourceId) => ({ serviceId: service.id, resourceId })),
        });
      }

      return tx.service.findUnique({
        where: { id: service.id },
        include: { serviceResources: { include: { resource: true } } },
      });
    });
  }

  /**
   * Update a service (Organiser only)
   */
  async updateService(serviceId: string, organiserId: string, data: Partial<CreateServiceRequest>) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error('Service not found');
    if (service.organiserId !== organiserId) throw new Error('Unauthorized');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id: serviceId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.duration && { duration: data.duration }),
          ...(data.price !== undefined && { price: data.price }),
        },
      });

      if (data.resourceIds) {
        await tx.serviceResource.deleteMany({ where: { serviceId } });
        if (data.resourceIds.length > 0) {
          await tx.serviceResource.createMany({
            data: data.resourceIds.map((resourceId) => ({ serviceId, resourceId })),
          });
        }
      }

      return tx.service.findUnique({
        where: { id: serviceId },
        include: { serviceResources: { include: { resource: true } } },
      });
    });
  }

  /**
   * Soft-delete a service (mark inactive)
   */
  async deleteService(serviceId: string, organiserId: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error('Service not found');
    if (service.organiserId !== organiserId) throw new Error('Unauthorized');

    return prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  /**
   * Get all services for a specific organiser
   */
  async getOrganiserServices(organiserId: string) {
    return prisma.service.findMany({
      where: { organiserId },
      include: { serviceResources: { include: { resource: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new ServiceService();
