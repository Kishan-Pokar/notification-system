import express, { Application, Request, Response, NextFunction } from 'express';
import { connectDB } from './db/client';
import { config } from './config/index';
import authRoutes from './api/routes/auth.routes';
import endpointRoutes from './api/routes/endpoints.routes';
import eventRoutes from './api/routes/events.routes';
import deliveriesRoutes from './api/routes/deliveries.routes';
import './workers/webhook.worker';
import { AppError } from './utils/errors';

const app: Application = express();


app.use(express.json());


app.use('/auth', authRoutes);

app.use('/endpoints', endpointRoutes);
app.use('/events', eventRoutes);
app.use('/deliveries', deliveriesRoutes);


app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
});

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();

export default app;