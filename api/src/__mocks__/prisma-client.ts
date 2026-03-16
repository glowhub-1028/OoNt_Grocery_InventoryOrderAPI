export const OrderStatus = {
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export class PrismaClient {
  $transaction = jest.fn();
  $connect = jest.fn();
  $disconnect = jest.fn();
  order = { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() };
  product = { findFirst: jest.fn(), updateMany: jest.fn(), update: jest.fn() };
}
