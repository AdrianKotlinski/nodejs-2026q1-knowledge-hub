import { Injectable, NotFoundException } from '@nestjs/common';
import { db, Category } from '../db/in-memory.store';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  findAll(): Category[] {
    return Array.from(db.categories.values());
  }

  findOne(id: string): Category {
    const category = db.categories.get(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
    };
    db.categories.set(category.id, category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = db.categories.get(id);
    if (!category) throw new NotFoundException('Category not found');
    category.name = dto.name;
    category.description = dto.description;
    return category;
  }

  remove(id: string): void {
    const category = db.categories.get(id);
    if (!category) throw new NotFoundException('Category not found');

    db.articles.forEach((article) => {
      if (article.categoryId === id) {
        article.categoryId = null;
        article.updatedAt = Date.now();
      }
    });

    db.categories.delete(id);
  }
}
