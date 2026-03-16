import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany();
  }

  findProductsByCategory(categoryId: string) {
    return this.prisma.product.findMany({
      where: {
        categoryId,
        deletedAt: null,
      },
    });
  }
}

