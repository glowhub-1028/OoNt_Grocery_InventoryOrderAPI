import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './orders/dto/create-order.dto';


describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  const productId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const mockProduct = {
    id: productId,
    name: 'Test Product',
    description: null,
    price: 9.99,
    stock: 10,
    categoryId: '33333333-3333-3333-3333-333333333333',
    deletedAt: null,
  };
  const mockOrder = {
    id: '44444444-4444-4444-4444-444444444444',
    userId,
    status: 'PENDING',
    createdAt: new Date(),
    items: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        orderId: '44444444-4444-4444-4444-444444444444',
        productId,
        quantity: 2,
        price: 9.99,
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = {
      $transaction: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
  });

  describe('createOrder', () => {
    it('should create order when stock is sufficient', async () => {
      const cartFindUnique = jest.fn().mockResolvedValue({
        id: 'cart-id',
        userId,
        items: [{ productId, quantity: 2 }],
      });
      const findFirst = jest.fn().mockResolvedValue(mockProduct);
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const orderCreate = jest.fn().mockResolvedValue(mockOrder);
      const cartItemDeleteMany = jest.fn().mockResolvedValue({ count: 1 });

      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            cart: { findUnique: cartFindUnique },
            cartItem: { deleteMany: cartItemDeleteMany },
            product: { findFirst, updateMany },
            order: { create: orderCreate },
          };
          return fn(tx);
        },
      );

      const dto: CreateOrderDto = {
        userId,
      };

      const result = await service.createOrder(dto);

      expect(result).toEqual(mockOrder);
      expect(cartFindUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { items: true },
      });
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: productId, deletedAt: null },
      });
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: productId, stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(orderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            status: 'PENDING',
            items: { create: expect.any(Array) },
          }),
          include: { items: true },
        }),
      );
      expect(cartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-id' },
      });
    });

    it('should fail order when stock insufficient', async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            cart: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'cart-id',
                userId,
                items: [{ productId, quantity: 999 }],
              }),
            },
            cartItem: { deleteMany: jest.fn() },
            product: {
              findFirst: jest.fn().mockResolvedValue(mockProduct),
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            order: { create: jest.fn() },
          };
          return fn(tx);
        },
      );

      const dto: CreateOrderDto = {
        userId,
      };

      const err = await service.createOrder(dto).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toMatch(/Insufficient stock/);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            cart: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'cart-id',
                userId,
                items: [
                  {
                    productId: '00000000-0000-0000-0000-000000000000',
                    quantity: 1,
                  },
                ],
              }),
            },
            cartItem: { deleteMany: jest.fn() },
            product: {
              findFirst: jest.fn().mockResolvedValue(null),
              updateMany: jest.fn(),
            },
            order: { create: jest.fn() },
          };
          return fn(tx);
        },
      );

      const dto: CreateOrderDto = {
        userId,
      };

      const err = await service.createOrder(dto).catch((e) => e);
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toMatch(/not found/);
    });

    it('concurrent orders should not oversell stock', async () => {
      const stockMap: Record<string, number> = { [productId]: 1 };

      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            cart: {
              findUnique: jest
                .fn()
                .mockResolvedValue({ id: 'cart-id', userId, items: [{ productId, quantity: 1 }] }),
            },
            cartItem: { deleteMany: jest.fn() },
            product: {
              findFirst: jest.fn().mockResolvedValue({ ...mockProduct, stock: 1 }),
              updateMany: jest.fn().mockImplementation(
                (args: {
                  where: { id: string; stock: { gte: number } };
                  data: { stock: { decrement: number } };
                }) => {
                  const id = args.where.id;
                  const required = args.where.stock.gte;
                  const current = stockMap[id] ?? 0;
                  if (current >= required) {
                    stockMap[id] = current - args.data.stock.decrement;
                    return Promise.resolve({ count: 1 });
                  }
                  return Promise.resolve({ count: 0 });
                },
              ),
            },
            order: {
              create: jest.fn().mockImplementation((args: { data: { userId: string } }) =>
                Promise.resolve({
                  id: 'order-id',
                  userId: args.data.userId,
                  status: 'PENDING',
                  createdAt: new Date(),
                  items: [],
                }),
              ),
            },
          };
          return fn(tx);
        },
      );

      const dto: CreateOrderDto = {
        userId,
      };

      const [result1, result2] = await Promise.allSettled([
        service.createOrder(dto),
        service.createOrder(dto),
      ]);

      const fulfilled = [result1, result2].filter((r) => r.status === 'fulfilled');
      const rejected = [result1, result2].filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
        BadRequestException,
      );
      expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(
        /Insufficient stock/,
      );
      expect(stockMap[productId]).toBe(0);
    });
  });
});
