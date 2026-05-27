import { Router } from 'express';
import { registerEndpointController, deleteEndpointController, addEventTypeController, removeEventTypeController } from '../controllers/endpoints.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, registerEndpointController);
router.delete('/:id', authMiddleware, deleteEndpointController);
router.post('/:id/subscriptions', authMiddleware, addEventTypeController);
router.delete('/:id/subscriptions/:event_type', authMiddleware, removeEventTypeController);  

export default router;