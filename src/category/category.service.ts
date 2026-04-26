import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/errors';
import { Category } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const toResponse = (category: Category) => ({
  id: category.id,
  name: category.name,
  description: category.description,
});

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany();
    return categories.map(toResponse);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');
    return toResponse(category);
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: { name: dto.name, description: dto.description },
    });
    return toResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Category not found');
    const category = await this.prisma.category.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
    return toResponse(category);
  }

  async remove(id: string) {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Category not found');
    await this.prisma.category.delete({ where: { id } });
  }
}
