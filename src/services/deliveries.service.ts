import { findEventById,findEventsByUserId } from '../repositories/events.repository';
import { Event,EventWithStats } from '../types/events.types';

export const getAllEvents = async (
    userId: string
): Promise<Event[]> => {
    const result = await findEventsByUserId(userId);
    return result;
};


export const getEventById = async (
    eventId: string,
    userId: string
): Promise<EventWithStats | null> => {
    const result = await findEventById(eventId, userId);
    return result;
}