import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Put,
    Req,
    UseGuards,
  } from '@nestjs/common';
  
  import { BasicAuthGuard } from '../auth';
  import { AppRequest, getUserIdFromRequest } from '../shared';
  
  import { OrderService } from './services';
  
  @Controller('api/order')
  export class OrderController {
    constructor(private orderService: OrderService) {}
  
    @Get()
    async findAll() {
      const orders = await this.orderService.findAll();
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: orders,
      };
    }
  
    @UseGuards(BasicAuthGuard)
    @Put()
    async createUserOrder(@Req() req: AppRequest, @Body() body) {
      const order = await this.orderService.create(
        getUserIdFromRequest(req),
      );
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: order,
      };
    }
  
    @Get('/:id')
    async findOne(@Req() req: AppRequest) {
      const order = await this.orderService.findById(req.params.id);

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: order ,
      };
    }
  
    @UseGuards(BasicAuthGuard)
    @Delete('/:id')
    async delete(@Req() req: AppRequest) {
      const order = await this.orderService.delete(req.params.id);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: order,
      };
    }
  
    @UseGuards(BasicAuthGuard)
    @Put('/:id/status')
    async update(@Param('id') id: number, @Body() body) {
      console.log('createUserOrder req', id);
      console.log('createUserOrder body', body);
      const order = await this.orderService.update(id, body);
      console.log('createUserOrder order', order);

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: order,
      };
    }
  }