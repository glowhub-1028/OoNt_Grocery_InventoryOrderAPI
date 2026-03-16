import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CategoryResponseDto,
  ProductResponseDto,
} from '../products/dto/product-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all product categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: CategoryResponseDto,
    isArray: true,
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'List products belonging to a specific category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({
    status: 200,
    description: 'Products for this category',
    type: ProductResponseDto,
    isArray: true,
  })
  findProducts(@Param('id') id: string) {
    return this.categoriesService.findProductsByCategory(id);
  }
}

