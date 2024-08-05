import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 } from 'uuid';

import { User } from '../models';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  sslmode: 'require',
});

@Injectable()
export class UsersService {
  private readonly users: Record<string, User>;

  constructor() {
    this.users = {};
  }

  async findOne(userId: string): Promise<User> {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE name = $1',
      [userId],
    );
    return rows[0];
  }

  async createOne({ name, password }: User): Promise<User> {
    const id = v4();
    const newUser = { id: name || id, name, password };

    this.users[id] = newUser;

    return newUser;
  }
}
