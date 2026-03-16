# Database schema and relationships

This service uses PostgreSQL with Prisma as the ORM. The core entities are:

- **Category**
- **Product**
- **Cart**
- **CartItem**
- **Order**
- **OrderItem**

## Entities

- **Category**
  - `id` (UUID, PK)
  - `name` (unique)
  - `createdAt`
  - One **Category** has many **Products**.

- **Product**
  - `id` (UUID, PK)
  - `name`
  - `description` (nullable)
  - `price` (Decimal)
  - `stock` (Int)
  - `deletedAt` (for soft deletes)
  - `categoryId` (FK → Category.id)
  - A **Product** belongs to one **Category**.
  - A **Product** can appear in many **CartItem** and **OrderItem** records.

- **Cart**
  - `id` (UUID, PK)
  - `userId` (UUID, unique)
  - One **Cart** per `userId`.
  - A **Cart** has many **CartItem** rows.

- **CartItem**
  - `id` (UUID, PK)
  - `cartId` (FK → Cart.id)
  - `productId` (FK → Product.id)
  - `quantity` (Int)
  - Unique per (`cartId`, `productId`) so each product appears once per cart.

- **Order**
  - `id` (UUID, PK)
  - `userId` (UUID, indexed)
  - `status` (enum: `PENDING`, `CANCELLED`, `COMPLETED`)
  - `createdAt`
  - An **Order** has many **OrderItem** rows.

- **OrderItem**
  - `id` (UUID, PK)
  - `orderId` (FK → Order.id)
  - `productId` (FK → Product.id)
  - `quantity` (Int)
  - `price` (Decimal snapshot of price at time of order)

## Why this design

- **Normalization & history**
  - Orders are immutable snapshots: each `OrderItem` stores `price` at the moment of ordering.
  - Soft deletes on `Product` via `deletedAt` ensure past orders remain readable even if a product is no longer sold.

- **Cart vs. Order**
  - **Cart/CartItem** represent the mutable shopping cart state per user.
  - **Order/OrderItem** are created from the cart in a single transaction and then disconnected from further cart changes.

- **Indexes and constraints**
  - Unique `Category.name` to avoid duplicates.
  - Unique `Cart.userId` to enforce one cart per user.
  - Unique `CartItem(cartId, productId)` for one row per product per cart.
  - Indexes on `Order.userId`, `Order.status`, `Order.createdAt` for efficient order lookups.
  - Indexes on foreign keys (`categoryId`, `cartId`, `productId`, `orderId`) for join performance.

