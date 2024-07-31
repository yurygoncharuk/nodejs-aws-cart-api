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
      console.log('findById orderId', orderId)
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

    try {
      const { rows } = await pool.query(
        'INSERT INTO orders(id, user_id, cart_id, payment, delivery, comments, status, total) VALUES($1, $2, $3, $4, $5, $6, $7::character varying, $8) RETURNING *',
        [id, data.userId, data.cartId, '{}', data.address, data.address.comment, 'OPEN', data.total],
      );
      console.log('Insert successful:', rows);
      return rows[0];
    } catch (error) {
      console.error('Error executing insert operation:', error);
    }
  }

  async update(orderId, data) {
    // const order = await this.findById(orderId);
    // console.log('orders update', order)

    // if (!order) {
    //   throw new Error('Order does not exist.');
    // }

    const { rows } = await pool.query(
      'UPDATE orders SET status = $1, comments = $2 WHERE id = $3 RETURNING *',
      [data.status, data.comments, orderId],
    );

    console.log('Update successful:', rows);
    return rows[0]
  }

  async delete(orderId: string): Promise<Order> {
    console.log('orders delete', orderId)
    const { rows } = await pool.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [orderId],
    );
    console.log('Delete successful:', rows);
    return rows[0];
  }
}
