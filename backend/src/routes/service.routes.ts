import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(services);
  } catch (error) {
    throw error;
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    throw error;
  }
});

export default router;
