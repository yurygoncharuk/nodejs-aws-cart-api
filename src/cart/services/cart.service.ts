import { Injectable } from '@nestjs/common';

import { Pool } from 'pg';
import { v4 } from 'uuid';
import { Cart, CartStatuses } from '../models';
import { count } from 'console';

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

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
    process.exit(-1);
  } else {
    console.log('Connected to the database successfully!');
    console.log('Query result:', res.rows[0]);
  }
});

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  async findByUserId(userId: string) {
    try {
      const { rows } = await pool.query(`
        SELECT
            c.*,
            COALESCE(
                JSON_AGG(
                    CASE
                        WHEN ci.cart_id IS NOT NULL THEN
                            JSON_BUILD_OBJECT(
                                'cart_id', ci.cart_id,
                                'product_id', ci.product_id,
                                'count', ci.count,
                                'price', ci.price
                            )
                    END
                ) FILTER (WHERE ci.cart_id IS NOT NULL),
                '[]'
            ) AS items
        FROM
            carts c
        LEFT JOIN
            cart_items ci ON c.id = ci.cart_id
        WHERE
            c.user_id = $1
            AND c.status = 'OPEN'
        GROUP BY
            c.id;
      `, [userId]);
      console.log('findByUserId rows', rows)
      return rows[0];
    } catch (error) {
      console.error('Error executing findByUserId operation:', error);
    }
  }

  async findItemsByCartId(cartId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1',
      [cartId],
    );
    return rows;
  }

  async createByUserId(userId: string) {
    const id = v4();
    const createdAt = new Date().toISOString();
    const status = CartStatuses.OPEN;

    const { rows } = await pool.query(
      'INSERT INTO carts(id, user_id, created_at, updated_at, status) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [id, userId, createdAt, createdAt, status],
    );

    console.log('createByUserId rows', rows)
    return rows[0];
  }

  async findOrCreateByUserId(userId: string) {
    const cart = await this.findByUserId(userId);

    if (cart) {
      return cart;
    }
    console.log('findOrCreateByUserId createByUserId')
    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { product, count }) {
    const cart = await this.findOrCreateByUserId(userId);
    const { rows } = await pool.query(
      'INSERT INTO cart_items(cart_id, product_id, count, price) VALUES($1, $2, $4, $3) ON CONFLICT (cart_id, product_id) DO UPDATE SET count = $4 RETURNING *',
      [cart.id, product.id, product.price, count],
    );

    cart.items = rows
    if (cart.items) {
      if (count === 0) {
        await this.removeItemsByCartID(cart.id, [ product.id ])
        cart.items = []
      }
    }
    return cart;
  }

  async removeItemsByCartID(cartId: string, productIds) {

    for (const productId of productIds) {
      try {
          const res = await pool.query(
              'DELETE FROM cart_items WHERE cart_id = $1 and product_id = $2',
              [cartId, productId]
          );
          console.log('Item was removed successfully!');
      } catch (err) {
          console.error('Error executing query', err.stack);
      }
    } 
  }

  async removeByUserId(userId: string): Promise<void> {
    console.log('removeByUserId', userId)
    await pool.query(
      'DELETE FROM carts WHERE user_id = $1',
      [userId],
    );
  }
}
