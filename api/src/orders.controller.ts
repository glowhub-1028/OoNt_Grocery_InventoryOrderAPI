import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './orders/dto/create-order.dto';
import { OrderResponseDto } from './orders/dto/order-response.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create order from user cart (atomic stock check, prevents overselling)',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'User for whom to create an order from the current cart',
    examples: {
      fromCart: {
        summary: 'Create order from existing cart',
        value: {
          userId: '22222222-2222-2222-2222-222222222222',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient stock for one or more products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order and restore stock' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order cancelled', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled (already completed or cancelled)' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID with items' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }
}

