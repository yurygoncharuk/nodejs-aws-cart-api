import { Module } from '@nestjs/common';
import { OrderService } from './services';
import { OrderController } from './order.controller';

@Module({
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
