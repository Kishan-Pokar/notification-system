import { Request, Response, NextFunction } from 'express';
import { registerEndpoint,deleteEndpoint,addEventType,removeEventType } from '../../services/endpoints.service';


export const registerEndpointController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url, event_types } = req.body;
    const userId = req.user!.id;          

    const endpoint = await registerEndpoint({ url, event_types }, userId);
    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
};


export const deleteEndpointController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try{
        const id = req.params.id as string;
        const userId = req.user!.id;
        const result = await deleteEndpoint(id, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export const addEventTypeController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const endpointId = req.params.id as string;
        const userId = req.user!.id;
        const { event_type } = req.body;

        const result = await addEventType(endpointId, event_type, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export const removeEventTypeController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const endpointId = req.params.id as string;
        const userId = req.user!.id;
        const event_type = req.params.event_type as string;

        const result = await removeEventType(endpointId, event_type, userId);
        res.status(200).json(result);
    }  catch (error) {
        next(error);
    }
};