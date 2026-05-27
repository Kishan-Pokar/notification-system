import express, { Application, Request, Response, NextFunction } from 'express';
import { connectDB } from './db/client';
import { config } from './config/index';
import authRoutes from './api/routes/auth.routes';
import endpointRoutes from './api/routes/endpoints.routes';

const app: Application = express();


app.use(express.json());


app.use('/auth', authRoutes);

app.use('/endpoints', endpointRoutes);


app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});


const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();

export default app;