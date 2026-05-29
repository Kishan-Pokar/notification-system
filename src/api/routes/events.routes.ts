import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { triggerEventController } from '../controllers/events.controller';

const router = Router();

router.post('/', authMiddleware, triggerEventController);

export default router;