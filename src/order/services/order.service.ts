import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { Order } from '../models';

@Injectable()
export class OrderService {
  private orders: Record<string, Order> = {};

  async findById(orderId: string): Promise<Order> {
    console.log('orders', orderId, this.orders)
    return await this.orders[orderId];
  }

  async create(data: any) {
    const id = v4();
    const order = {
      ...data,
      id,
      status: 'inProgress',
    };

    this.orders[id] = order;

    return order;
  }

  async update(orderId, data) {
    const order = this.findById(orderId);

    if (!order) {
      throw new Error('Order does not exist.');
    }

    this.orders[orderId] = {
      ...data,
      id: orderId,
    };
  }
}
