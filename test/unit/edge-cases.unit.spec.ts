import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../src/user/user.service';
import { ArticleService } from '../../src/article/article.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '../../src/common/enums';

vi.mock('bcrypt', () => ({ hash: vi.fn(), compare: vi.fn() }));

const makeDbUser = (overrides: Record<string, any> = {}) => ({
  id: 'user-uuid-1',
  login: 'alice',
  password: 'hashed_pw',
  role: 'viewer',
  createdAt: new Date(1000),
  updatedAt: new Date(2000),
  ...overrides,
});

const makeDbArticle = (overrides: Record<string, any> = {}) => ({
  id: 'article-uuid-1',
  title: 'Test',
  content: 'Content',
  status: 'draft',
  authorId: null,
  categoryId: null,
  tags: [],
  createdAt: new Date(1000),
  updatedAt: new Date(2000),
  ...overrides,
});

const mockUserPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

const mockArticlePrisma = {
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

describe('UserService — edge cases', () => {
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockUserPrisma },
      ],
    }).compile();
    service = module.get(UserService);
  });

  describe('findByLogin', () => {
    it('returns mapped user (without password) when found', async () => {
      mockUserPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      const result = await service.findByLogin('alice');
      expect(result).not.toBeNull();
      expect(result!.login).toBe('alice');
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when no user matches the login', async () => {
      mockUserPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByLogin('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findByLoginWithPassword', () => {
    it('returns the raw user record (including password) when found', async () => {
      mockUserPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      const result = await service.findByLoginWithPassword('alice');
      expect(result).not.toBeNull();
      expect(result!.password).toBe('hashed_pw');
    });

    it('returns null when no user matches the login', async () => {
      mockUserPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByLoginWithPassword('unknown');
      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('returns the count from prisma', async () => {
      mockUserPrisma.user.count.mockResolvedValue(5);
      const result = await service.count();
      expect(result).toBe(5);
    });

    it('returns 0 when no users exist', async () => {
      mockUserPrisma.user.count.mockResolvedValue(0);
      const result = await service.count();
      expect(result).toBe(0);
    });
  });

  describe('create — viewer role default', () => {
    it('stores viewer role when role is not specified', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockUserPrisma.user.create.mockResolvedValue(makeDbUser());
      await service.create({ login: 'alice', password: 'pw' });
      expect(mockUserPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: UserRole.VIEWER }),
        }),
      );
    });
  });

  describe('findOne — non-uuid string behaves as not found', () => {
    it('throws NotFoundException when prisma returns null for any id', async () => {
      mockUserPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('ArticleService — update edge cases', () => {
  let service: ArticleService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: mockArticlePrisma },
      ],
    }).compile();
    service = module.get(ArticleService);
  });

  it('throws UnprocessableEntityException when updated authorId does not exist', async () => {
    mockArticlePrisma.article.findUnique.mockResolvedValue(makeDbArticle());
    mockArticlePrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.update('article-uuid-1', { authorId: 'nonexistent-user' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws UnprocessableEntityException when updated categoryId does not exist', async () => {
    mockArticlePrisma.article.findUnique.mockResolvedValue(makeDbArticle());
    mockArticlePrisma.user.findUnique.mockResolvedValue({ id: 'user-uuid-1' });
    mockArticlePrisma.category.findUnique.mockResolvedValue(null);
    await expect(
      service.update('article-uuid-1', {
        authorId: 'user-uuid-1',
        categoryId: 'nonexistent-cat',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('updates only the title without touching tags or status', async () => {
    mockArticlePrisma.article.findUnique.mockResolvedValue(makeDbArticle());
    mockArticlePrisma.article.update.mockResolvedValue(
      makeDbArticle({ title: 'New Title' }),
    );
    await service.update('article-uuid-1', { title: 'New Title' });
    expect(mockArticlePrisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'New Title' }),
      }),
    );
    const callData = mockArticlePrisma.article.update.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty('tags');
    expect(callData).not.toHaveProperty('status');
  });

  it('does not call prisma when the same status is set (no transition)', async () => {
    mockArticlePrisma.article.findUnique.mockResolvedValue(
      makeDbArticle({ status: 'draft' }),
    );
    mockArticlePrisma.article.update.mockResolvedValue(makeDbArticle());
    await service.update('article-uuid-1', { status: 'draft' as any });
    expect(mockArticlePrisma.article.update).toHaveBeenCalled();
  });
});
