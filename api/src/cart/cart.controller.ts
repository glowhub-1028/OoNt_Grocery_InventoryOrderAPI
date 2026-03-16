import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get current contents of a user cart' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Current cart with items',
  })
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post(':userId/items')
  @ApiOperation({ summary: 'Add an item to the cart (or increase quantity)' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiBody({
    type: AddCartItemDto,
    description: 'Product and quantity to add',
    examples: {
      default: {
        summary: 'Add product to cart',
        value: {
          productId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Item added or quantity increased',
  })
  addItem(@Param('userId') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Put(':userId/items/:productId')
  @ApiOperation({ summary: 'Update quantity for a specific item in the cart' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiBody({
    type: UpdateCartItemDto,
    description: 'New quantity for the item',
  })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 404, description: 'Cart or cart item not found' })
  updateItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, productId, dto);
  }

  @Delete(':userId/items/:productId')
  @ApiOperation({ summary: 'Remove a single item from the cart' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Clear entire cart for a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Cart cleared (idempotent)' })
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}

