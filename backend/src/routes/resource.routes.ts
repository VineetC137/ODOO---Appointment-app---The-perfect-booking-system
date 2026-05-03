import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(resources);
  } catch (error) {
    throw error;
  }
});

export default router;
