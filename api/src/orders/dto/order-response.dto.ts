import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: '55555555-5555-5555-5555-555555555555' })
  id: string;

  @ApiProperty({ example: '44444444-4444-4444-4444-444444444444' })
  orderId: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  productId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 9.99 })
  price: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: '44444444-4444-4444-4444-444444444444' })
  id: string;

  @ApiProperty({ example: '22222222-2222-2222-2222-222222222222' })
  userId: string;

  @ApiProperty({ enum: ['PENDING', 'CANCELLED', 'COMPLETED'] })
  status: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];
}
