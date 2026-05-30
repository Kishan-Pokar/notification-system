import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { triggerEventController } from '../controllers/events.controller';
import { validate } from '../../utils/validate';
import { triggerEventSchema } from '../../validators/events.validator';

const router = Router();
router.post('/', authMiddleware, validate(triggerEventSchema), triggerEventController);


export default router;