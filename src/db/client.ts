import { Pool } from 'pg';
import { config } from '../config/index';

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

export const connectDB = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);  
  }
};

export default pool;