import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundError, ValidationError, ForbiddenError } from '../common/errors';
import { UserRole } from '../common/enums';
import { Article, Tag, ArticleStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleStatus as ArticleStatusEnum } from '../common/enums';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

type ArticleWithTags = Article & { tags: Tag[] };

const toResponse = (article: ArticleWithTags) => ({
  id: article.id,
  title: article.title,
  content: article.content,
  status: article.status as unknown as ArticleStatusEnum,
  authorId: article.authorId,
  categoryId: article.categoryId,
  tags: article.tags.map((t) => t.name),
  createdAt: article.createdAt.getTime(),
  updatedAt: article.updatedAt.getTime(),
});

const INCLUDE_TAGS = { tags: true } as const;

const VALID_TRANSITIONS: Partial<Record<string, string[]>> = {
  draft: ['published'],
  published: ['archived'],
  archived: [],
};

const tagConnectOrCreate = (names: string[]) =>
  names.map((name) => ({ where: { name }, create: { name } }));

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string, categoryId?: string, tag?: string) {
    const articles = await this.prisma.article.findMany({
      where: {
        ...(status ? { status: status as ArticleStatus } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(tag ? { tags: { some: { name: tag } } } : {}),
      },
      include: INCLUDE_TAGS,
    });
    return articles.map(toResponse);
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: INCLUDE_TAGS,
    });
    if (!article) throw new NotFoundError('Article not found');
    return toResponse(article);
  }

  async create(dto: CreateArticleDto) {
    if (dto.authorId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.authorId },
      });
      if (!user) throw new UnprocessableEntityException('Author not found');
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category)
        throw new UnprocessableEntityException('Category not found');
    }

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: (dto.status ??
          ArticleStatusEnum.DRAFT) as unknown as ArticleStatus,
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: { connectOrCreate: tagConnectOrCreate(dto.tags ?? []) },
      },
      include: INCLUDE_TAGS,
    });
    return toResponse(article);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const exists = await this.prisma.article.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Article not found');

    if (dto.status && dto.status !== (exists.status as unknown as string)) {
      const allowed =
        VALID_TRANSITIONS[exists.status as unknown as string] ?? [];
      if (!allowed.includes(dto.status as string)) {
        throw new ValidationError(
          `Cannot transition from ${exists.status} to ${dto.status}`,
        );
      }
    }

    if (dto.authorId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.authorId },
      });
      if (!user) throw new UnprocessableEntityException('Author not found');
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category)
        throw new UnprocessableEntityException('Category not found');
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status as unknown as ArticleStatus }
          : {}),
        ...(dto.authorId !== undefined ? { authorId: dto.authorId } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.tags !== undefined
          ? {
              tags: {
                set: [],
                connectOrCreate: tagConnectOrCreate(dto.tags),
              },
            }
          : {}),
      },
      include: INCLUDE_TAGS,
    });
    return toResponse(article);
  }

  async remove(id: string, currentUser?: { userId: string; role: UserRole }) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundError('Article not found');
    if (
      currentUser?.role === UserRole.EDITOR &&
      article.authorId !== currentUser.userId
    ) {
      throw new ForbiddenError('Not authorized to delete this article');
    }
    await this.prisma.article.delete({ where: { id } });
  }
}
