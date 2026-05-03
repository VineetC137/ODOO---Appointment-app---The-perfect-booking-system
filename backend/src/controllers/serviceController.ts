import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import serviceService from '../services/serviceService';
import { AuthRequest, ApiResponse } from '../types';

export class ServiceController {
  validateCreateService = [
    body('name').notEmpty().withMessage('Service name is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('resourceIds').isArray().withMessage('resourceIds must be an array'),
  ];

  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const { search, minPrice, maxPrice, duration } = req.query;
      const services = await serviceService.getAllServices({
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        duration: duration ? parseInt(duration as string) : undefined,
      });
      res.status(200).json({ success: true, data: services });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      if (!service) { res.status(404).json({ success: false, error: 'Service not found' }); return; }
      res.status(200).json({ success: true, data: service });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createService(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() }); return; }
    try {
      const service = await serviceService.createService(req.user!.id, req.body);
      res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateService(req: AuthRequest, res: Response): Promise<void> {
    try {
      const service = await serviceService.updateService(req.params.id, req.user!.id, req.body);
      res.status(200).json({ success: true, data: service, message: 'Service updated successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized' ? 403 : error.message === 'Service not found' ? 404 : 500;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async deleteService(req: AuthRequest, res: Response): Promise<void> {
    try {
      await serviceService.deleteService(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized' ? 403 : error.message === 'Service not found' ? 404 : 500;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async getOrganiserServices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const services = await serviceService.getOrganiserServices(req.user!.id);
      res.status(200).json({ success: true, data: services });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new ServiceController();
