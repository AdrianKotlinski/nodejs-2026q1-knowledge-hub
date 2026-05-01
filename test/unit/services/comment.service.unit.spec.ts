import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommentService } from '../../../src/comment/comment.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UserRole } from '../../../src/common/enums';

const makeDbComment = (overrides: Record<string, any> = {}) => ({
  id: 'comment-uuid-1',
  content: 'Great article!',
  articleId: 'article-uuid-1',
  authorId: 'user-uuid-1',
  createdAt: new Date(1000),
  ...overrides,
});

const mockPrisma = {
  comment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  article: {
    findUnique: vi.fn(),
  },
};

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CommentService);
  });

  describe('findByArticle', () => {
    it('returns comments filtered by articleId', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([makeDbComment()]);
      const result = await service.findByArticle('article-uuid-1');
      expect(result).toHaveLength(1);
      expect(result[0].articleId).toBe('article-uuid-1');
      expect(result[0].createdAt).toBe(1000);
    });

    it('returns an empty array when no comments exist for the article', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      const result = await service.findByArticle('article-uuid-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the mapped comment when found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(makeDbComment());
      const result = await service.findOne('comment-uuid-1');
      expect(result.id).toBe('comment-uuid-1');
      expect(result.content).toBe('Great article!');
    });

    it('throws NotFoundException when comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns the mapped comment when article exists', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-uuid-1' });
      mockPrisma.comment.create.mockResolvedValue(makeDbComment());
      const result = await service.create({
        content: 'Great article!',
        articleId: 'article-uuid-1',
      });
      expect(result.id).toBe('comment-uuid-1');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Great article!',
            articleId: 'article-uuid-1',
            authorId: null,
          }),
        }),
      );
    });

    it('throws UnprocessableEntityException when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ content: 'Hi', articleId: 'nonexistent-article' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockPrisma.comment.create).not.toHaveBeenCalled();
    });

    it('stores the authorId when provided', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-uuid-1' });
      mockPrisma.comment.create.mockResolvedValue(
        makeDbComment({ authorId: 'user-uuid-1' }),
      );
      await service.create({
        content: 'Great!',
        articleId: 'article-uuid-1',
        authorId: 'user-uuid-1',
      });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: 'user-uuid-1' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the comment when found with no currentUser', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(makeDbComment());
      mockPrisma.comment.delete.mockResolvedValue({});
      await service.remove('comment-uuid-1');
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-uuid-1' },
      });
    });

    it('allows admin to delete any comment regardless of authorId', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(
        makeDbComment({ authorId: 'another-user' }),
      );
      mockPrisma.comment.delete.mockResolvedValue({});
      await expect(
        service.remove('comment-uuid-1', {
          userId: 'admin-uuid',
          role: UserRole.ADMIN,
        }),
      ).resolves.not.toThrow();
    });

    it('allows editor to delete their own comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(
        makeDbComment({ authorId: 'editor-uuid' }),
      );
      mockPrisma.comment.delete.mockResolvedValue({});
      await expect(
        service.remove('comment-uuid-1', {
          userId: 'editor-uuid',
          role: UserRole.EDITOR,
        }),
      ).resolves.not.toThrow();
    });

    it('throws ForbiddenException when editor tries to delete another user comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(
        makeDbComment({ authorId: 'another-user' }),
      );
      await expect(
        service.remove('comment-uuid-1', {
          userId: 'editor-uuid',
          role: UserRole.EDITOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
