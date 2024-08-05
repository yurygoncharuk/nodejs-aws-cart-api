import { Pool } from 'pg';

const pool = new Pool({
  host: "34.254.25.182",
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  sslmode: 'require',
});

export default pool;
