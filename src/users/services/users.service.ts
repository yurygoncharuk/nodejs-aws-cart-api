import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { User } from '../models';
import pool from '../../db';

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
