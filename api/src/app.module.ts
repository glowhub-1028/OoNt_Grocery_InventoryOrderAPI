import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from './prisma.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    OrdersController,
    ProductsController,
    CartController,
    CategoriesController,
  ],
  providers: [
    AppService,
    OrdersService,
    ProductsService,
    CartService,
    CategoriesService,
    PrismaService,
  ],
})
export class AppModule {}
