import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Organic Milk' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Product description', example: '1L, 3.5% fat' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Unit price', example: 9.99 })
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Stock quantity', example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Category UUID', example: '33333333-3333-3333-3333-333333333333' })
  @IsUUID()
  categoryId: string;
}
