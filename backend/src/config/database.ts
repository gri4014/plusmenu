import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// Test database connection
// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('Database connected successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
};

testConnection();

export default pool;
