import { Request, Response, NextFunction } from 'express';
import { triggerEvent } from '../../services/events.service';

export const triggerEventController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try{
        const userId = req.user!.id;
        const { event_type, payload } = req.body;

        const event = await triggerEvent(userId, event_type, payload);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};