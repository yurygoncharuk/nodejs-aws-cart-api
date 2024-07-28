import { Injectable } from '@nestjs/common';

import { Pool } from 'pg';
import { v4 } from 'uuid';
import { Cart, CartStatuses } from '../models';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  async findByUserId(userId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId],
    );
    return rows[0];
  }

  async createByUserId(userId: string) {
    const id = v4();
    const createdAt = new Date().toISOString();
    const status = CartStatuses.OPEN;

    const { rows } = await pool.query(
      'INSERT INTO carts(id, items, user_id, created_at, updated_at, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, JSON.stringify([]), userId, createdAt, createdAt, status],
    );

    return rows[0];
  }

  async findOrCreateByUserId(userId: string) {
    const cart = await this.findByUserId(userId);

    if (cart) {
      return cart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }) {
    const cart = await this.findOrCreateByUserId(userId);

    const { rows } = await pool.query(
      'UPDATE carts SET items = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [JSON.stringify(items), new Date().toISOString(), cart.id],
    );

    return rows[0];
  }

  removeByUserId(userId: string): void {
    this.userCarts[userId] = null;
  }
}
