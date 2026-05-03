import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import resourceService from '../services/resourceService';
import { AuthRequest } from '../types';

export class ResourceController {
  validateCreateResource = [
    body('name').notEmpty().withMessage('Resource name is required'),
    body('type').isIn(['STAFF', 'ROOM', 'EQUIPMENT']).withMessage('Type must be STAFF, ROOM, or EQUIPMENT'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ];

  validateCreateSchedule = [
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0–6'),
    body('startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime must be HH:MM'),
    body('endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime must be HH:MM'),
    body('slotDuration').isInt({ min: 1 }).withMessage('slotDuration must be at least 1 minute'),
  ];

  async getOrganiserResources(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resources = await resourceService.getOrganiserResources(req.user!.id);
      res.status(200).json({ success: true, data: resources });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getResourceById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resource = await resourceService.getResourceById(req.params.id);
      if (!resource) { res.status(404).json({ success: false, error: 'Resource not found' }); return; }
      res.status(200).json({ success: true, data: resource });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createResource(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() }); return; }
    try {
      const resource = await resourceService.createResource(req.user!.id, req.body);
      res.status(201).json({ success: true, data: resource, message: 'Resource created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateResource(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resource = await resourceService.updateResource(req.params.id, req.user!.id, req.body);
      res.status(200).json({ success: true, data: resource, message: 'Resource updated successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized' ? 403 : 500;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async deleteResource(req: AuthRequest, res: Response): Promise<void> {
    try {
      await resourceService.deleteResource(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Resource deleted successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized' ? 403 : 500;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async createSchedule(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() }); return; }
    try {
      const schedule = await resourceService.createSchedule(req.params.resourceId, req.body);
      res.status(201).json({ success: true, data: schedule, message: 'Schedule created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await resourceService.updateSchedule(req.params.id, req.body);
      res.status(200).json({ success: true, data: schedule, message: 'Schedule updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      await resourceService.deleteSchedule(req.params.id);
      res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getResourceSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedules = await resourceService.getResourceSchedules(req.params.resourceId);
      res.status(200).json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createException(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date, reason } = req.body;
      if (!date) { res.status(400).json({ success: false, error: 'date is required' }); return; }
      const exception = await resourceService.createException(req.params.resourceId, date, reason);
      res.status(201).json({ success: true, data: exception, message: 'Exception created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteException(req: AuthRequest, res: Response): Promise<void> {
    try {
      await resourceService.deleteException(req.params.id);
      res.status(200).json({ success: true, message: 'Exception deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getResourceExceptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const exceptions = await resourceService.getResourceExceptions(req.params.resourceId);
      res.status(200).json({ success: true, data: exceptions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new ResourceController();
