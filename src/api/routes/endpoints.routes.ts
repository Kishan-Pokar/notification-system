import { Router } from 'express';
import { registerEndpointController, deleteEndpointController, addEventTypeController, removeEventTypeController } from '../controllers/endpoints.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../../utils/validate';
import { createEndpointSchema, addEventTypeSchema } from '../../validators/endpoints.validator';


const router = Router();

router.post('/', authMiddleware, validate(createEndpointSchema), registerEndpointController);
router.post('/:id/subscriptions', authMiddleware, validate(addEventTypeSchema), addEventTypeController);
router.delete('/:id', authMiddleware, deleteEndpointController);
router.delete('/:id/subscriptions/:event_type', authMiddleware, removeEventTypeController);  

export default router;