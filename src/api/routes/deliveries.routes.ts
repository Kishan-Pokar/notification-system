import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAllEventsController, getEventByIdController } from '../controllers/deliveries.controller';

const router = Router();

router.get('/', authMiddleware, getAllEventsController);
router.get('/:id', authMiddleware, getEventByIdController);

export default router;