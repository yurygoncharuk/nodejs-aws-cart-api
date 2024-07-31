import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { Order } from '../models';
import { Pool } from 'pg';

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
export class OrderService {
  private orders: Record<string, Order> = {};

  async findAll(): Promise<Order[]> {
    const { rows } = await pool.query(`
      SELECT
          o.* ,
          JSON_AGG(
              JSON_BUILD_OBJECT(
                  'productId', ci.product_id,
                  'count', ci.count,
                  'price', ci.price
              )
          ) AS items
      FROM
          orders o
      LEFT JOIN
          cart_items ci ON o.cart_id = ci.cart_id
      GROUP BY o.id
    `);
    return rows;
  }

  async findById(orderId: string): Promise<Order> {
    try {
      const { rows } = await pool.query(`
        SELECT
            o.* ,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'productId', ci.product_id,
                    'count', ci.count,
                    'price', ci.price
                )
            ) AS items
        FROM
            orders o
        LEFT JOIN
            cart_items ci ON o.cart_id = ci.cart_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [orderId]);
      return rows[0];
    } catch (error) {
      console.error('Error executing upsert operation:', error);
    }
  }

  async create(data: any) {
    const id = v4();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO orders(id, user_id, cart_id, payment, delivery, comments, status, total) VALUES($1, $2, $3, $4, $5, $6, $7::character varying, $8) RETURNING *',
        [id, data.userId, data.cartId, '{}', data.address, data.address.comment, 'OPEN', data.total],
      );
      await client.query(
        'UPDATE carts SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        ["ORDERED", new Date().toISOString(), data.cartId],
      );
      await client.query('COMMIT');

      console.log('Transaction completed successfully:', rows);
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction failed. Rolled back.', error);
    } finally {
      client.release();
    }
  }

  async update(orderId, data) {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1, comments = $2 WHERE id = $3 RETURNING *',
      [data.status, data.comments, orderId],
    );

    console.log('Update successful:', rows);
    return rows[0]
  }

  async delete(orderId: string, cartId: string): Promise<Order> {
    console.log('orders delete', orderId, cartId)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await pool.query(
        'DELETE FROM orders WHERE id = $1 RETURNING *',
        [orderId],
      );
      await pool.query(
        'DELETE FROM cart_items WHERE cart_id = $1',
        [cartId],
      );
      await pool.query(
        'DELETE FROM carts WHERE id = $1',
        [cartId],
      );
      await client.query('COMMIT');

      console.log('Transaction delete completed successfully:', rows);
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction delete failed. Rolled back.', error);
    } finally {
      client.release();
    }
  }
}
