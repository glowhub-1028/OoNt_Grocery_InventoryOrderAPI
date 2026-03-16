import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'UUID of the product to add to the cart',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity for this cart item', example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

