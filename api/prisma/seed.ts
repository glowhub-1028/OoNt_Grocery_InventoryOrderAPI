import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create 5 categories
  const categoryNames = [
    'Fruits',
    'Vegetables',
    'Dairy',
    'Bakery',
    'Beverages',
  ];

  await prisma.category.createMany({
    data: categoryNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const categories = await prisma.category.findMany();

  if (categories.length === 0) {
    throw new Error('No categories found after seeding.');
  }

  // Create 30 products with random stock values
  const productsData = Array.from({ length: 30 }).map((_, index) => {
    const category =
      categories[Math.floor(Math.random() * categories.length)];

    return {
      name: `Product ${index + 1}`,
      description: `Sample description for product ${index + 1}`,
      price: (Math.random() * 20 + 1).toFixed(2),
      stock: Math.floor(Math.random() * 100),
      categoryId: category.id,
    };
  });

  await prisma.product.createMany({
    data: productsData,
  });

  console.log('Seed completed: categories and products created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

