import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CreateOrderDto } from './orders/dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    const { userId, items } = dto;

    return this.prisma.$transaction(async (tx) => {
      const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          );
        }

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: Number(product.price),
        });
      }

      return tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData.map((o) => ({
              product: { connect: { id: o.productId } },
              quantity: o.quantity,
              price: o.price,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async cancelOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.COMPLETED
      ) {
        throw new BadRequestException('Order cannot be cancelled');
      }

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      return updatedOrder;
    });
  }
}

