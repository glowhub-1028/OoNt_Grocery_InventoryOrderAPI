# Grocery Inventory & Order API

A RESTful API for managing grocery inventory and orders, built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/) on PostgreSQL.

## Features

- **Categories & products** — Organize products by category with pricing and stock
- **Carts & cart items** — Shopping carts per user with product quantities
- **Orders** — Create and manage orders with status (PENDING, CANCELLED, COMPLETED)
- **Order cancellation** — Cancel orders and restore product stock within a single transaction

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [Docker](https://www.docker.com/) & Docker Compose (for running with PostgreSQL)
- PostgreSQL 15 (if running without Docker)

## Setup (local development)

### 1. Clone and install

```bash
git clone <repository-url>
cd OoNt_Grocery_InventoryOrderAPI
cd api
npm install
```

### 2. Environment

Create `api/.env` with your database URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
```

(When using Docker for Postgres, use the same credentials as in `docker-compose.yml`.)

### 3. Database

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Run the API

```bash
npm run start:dev
```

API: `http://localhost:3000` · Swagger: `http://localhost:3000/api`

## Docker

Run the entire stack (API + PostgreSQL) with Docker Compose:

```bash
docker compose up --build
```

- **API** — `http://localhost:3000`
- **PostgreSQL** — `localhost:5432`

Default credentials (defined in `docker-compose.yml`):

- User: `grocery_user`
- Password: `grocery_password`
- Database: `grocery_db`

To run in detached mode:

```bash
docker compose up -d --build
```

To apply migrations inside the API container:

```bash
docker compose exec api npx prisma migrate deploy
```

To seed the database:

```bash
docker compose exec api npx prisma db seed
```

## API documentation (Swagger)

When the API is running with Swagger enabled:

**Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)

Use Swagger to browse endpoints, view request/response schemas, and test the API interactively.

## Concurrency strategy: database transactions

To avoid race conditions and inconsistent data, operations that update multiple tables (e.g., order cancellation and stock restoration) run inside a single database transaction.

### How it works

1. **Atomicity** — All steps in the transaction succeed or all fail; there is no partial success.
2. **Isolation** — Other connections do not see uncommitted changes until the transaction commits.
3. **Prisma `$transaction`** — The transaction client (`tx`) is passed through, so all reads and writes use the same transaction.

### Order creation from cart (preventing overselling)

`POST /orders` takes a `userId`, loads that user’s cart, and creates an order from all cart items inside a single transaction. For each cart item, stock is decremented using a conditional update (`updateMany` with `stock >= quantity`). If any product has insufficient stock, the entire transaction rolls back, no order is created, and the cart remains unchanged. This ensures consistency even when multiple order requests for the last item in stock happen at the same time.

### Example: order cancellation

```ts
await this.prisma.$transaction(async (tx) => {
  // 1. Load order and items (within transaction)
  const order = await tx.order.findUnique({ where: { id }, include: { items: true } });

  // 2. Restore stock for each item (within same transaction)
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  // 3. Mark order as CANCELLED (within same transaction)
  await tx.order.update({
    where: { id },
    data: { status: OrderStatus.CANCELLED },
  });
});
```

If any step fails or throws, the transaction rolls back and the database is left unchanged. This prevents over-selling or inconsistent stock when multiple cancellations or concurrent updates happen at the same time.

## Tests

From the `api` directory:

```bash
npm run test
```

## Project structure

```
api/
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Seed script (5 categories, 30 products)
│   └── migrations/      # Migration history
├── src/
│   ├── orders/          # Order create & cancel
│   ├── products/        # Product CRUD
│   ├── prisma.service.ts
│   └── main.ts
└── Dockerfile
```

## License

UNLICENSED
