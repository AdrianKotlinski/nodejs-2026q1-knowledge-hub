import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ArticleService } from '../../../src/article/article.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { ArticleStatus, UserRole } from '../../../src/common/enums';

const makeDbArticle = (overrides: Record<string, any> = {}) => ({
  id: 'article-uuid-1',
  title: 'Test Article',
  content: 'Test content',
  status: 'draft',
  authorId: null,
  categoryId: null,
  tags: [],
  createdAt: new Date(1000),
  updatedAt: new Date(2000),
  ...overrides,
});

const mockPrisma = {
  article: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  category: {
    findUnique: vi.fn(),
  },
};

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ArticleService);
  });

  describe('findAll', () => {
    it('passes no where clauses when called without filters', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by status when provided', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      await service.findAll('published');
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('filters by categoryId when provided', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      await service.findAll(undefined, 'cat-uuid-1');
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-uuid-1' }),
        }),
      );
    });

    it('filters by tag when provided', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      await service.findAll(undefined, undefined, 'nestjs');
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { name: 'nestjs' } },
          }),
        }),
      );
    });

    it('maps tags to a string array', async () => {
      mockPrisma.article.findMany.mockResolvedValue([
        makeDbArticle({ tags: [{ name: 'nestjs' }, { name: 'typescript' }] }),
      ]);
      const result = await service.findAll();
      expect(result[0].tags).toEqual(['nestjs', 'typescript']);
    });
  });

  describe('findOne', () => {
    it('returns the mapped article when found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ tags: [{ name: 'node' }] }),
      );
      const result = await service.findOne('article-uuid-1');
      expect(result.id).toBe('article-uuid-1');
      expect(result.tags).toEqual(['node']);
    });

    it('throws NotFoundException when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates article without optional fields', async () => {
      mockPrisma.article.create.mockResolvedValue(makeDbArticle());
      await service.create({ title: 'T', content: 'C' });
      expect(mockPrisma.article.create).toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when authorId does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'T', content: 'C', authorId: 'nonexistent' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when categoryId does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-uuid-1' });
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          title: 'T',
          content: 'C',
          authorId: 'user-uuid-1',
          categoryId: 'nonexistent',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('builds connectOrCreate array for tags', async () => {
      mockPrisma.article.create.mockResolvedValue(
        makeDbArticle({ tags: [{ name: 'nestjs' }, { name: 'typescript' }] }),
      );
      await service.create({
        title: 'T',
        content: 'C',
        tags: ['nestjs', 'typescript'],
      });
      expect(mockPrisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              connectOrCreate: [
                { where: { name: 'nestjs' }, create: { name: 'nestjs' } },
                {
                  where: { name: 'typescript' },
                  create: { name: 'typescript' },
                },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { title: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows valid status transition draft → published', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ status: 'draft' }),
      );
      mockPrisma.article.update.mockResolvedValue(
        makeDbArticle({ status: 'published' }),
      );
      await expect(
        service.update('article-uuid-1', { status: ArticleStatus.PUBLISHED }),
      ).resolves.not.toThrow();
    });

    it('allows valid status transition published → archived', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ status: 'published' }),
      );
      mockPrisma.article.update.mockResolvedValue(
        makeDbArticle({ status: 'archived' }),
      );
      await expect(
        service.update('article-uuid-1', { status: ArticleStatus.ARCHIVED }),
      ).resolves.not.toThrow();
    });

    it('throws BadRequestException for invalid transition published → draft', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ status: 'published' }),
      );
      await expect(
        service.update('article-uuid-1', { status: ArticleStatus.DRAFT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when transitioning from archived to any status', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ status: 'archived' }),
      );
      await expect(
        service.update('article-uuid-1', { status: ArticleStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('replaces tags with set:[] + connectOrCreate when tags are provided', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(makeDbArticle());
      mockPrisma.article.update.mockResolvedValue(
        makeDbArticle({ tags: [{ name: 'new-tag' }] }),
      );
      await service.update('article-uuid-1', { tags: ['new-tag'] });
      expect(mockPrisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              set: [],
              connectOrCreate: [
                { where: { name: 'new-tag' }, create: { name: 'new-tag' } },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows admin to delete any article regardless of authorId', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ authorId: 'other-user' }),
      );
      mockPrisma.article.delete.mockResolvedValue({});
      await expect(
        service.remove('article-uuid-1', {
          userId: 'admin-uuid',
          role: UserRole.ADMIN,
        }),
      ).resolves.not.toThrow();
    });

    it('allows editor to delete their own article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ authorId: 'editor-uuid' }),
      );
      mockPrisma.article.delete.mockResolvedValue({});
      await expect(
        service.remove('article-uuid-1', {
          userId: 'editor-uuid',
          role: UserRole.EDITOR,
        }),
      ).resolves.not.toThrow();
    });

    it('throws ForbiddenException when editor tries to delete another user article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(
        makeDbArticle({ authorId: 'another-user' }),
      );
      await expect(
        service.remove('article-uuid-1', {
          userId: 'editor-uuid',
          role: UserRole.EDITOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
