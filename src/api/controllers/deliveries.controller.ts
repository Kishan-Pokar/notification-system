import { Request, Response, NextFunction } from 'express';
import { getAllEvents,getEventById } from '../../services/deliveries.service';

export const getAllEventsController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try{
        const userId = req.user!.id;
        const events = await getAllEvents(userId);
        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
}

export const getEventByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try{
        const userId = req.user!.id;
        const eventId = req.params.id as string;
        const event = await getEventById(eventId, userId);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.status(200).json(event);
    } catch (error) {
        next(error);
    }
}