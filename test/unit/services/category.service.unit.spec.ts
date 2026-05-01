import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../../src/category/category.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

const makeDbCategory = (overrides: Record<string, any> = {}) => ({
  id: 'cat-uuid-1',
  name: 'TypeScript',
  description: 'TypeScript articles',
  ...overrides,
});

const mockPrisma = {
  category: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CategoryService);
  });

  describe('findAll', () => {
    it('returns all categories as mapped objects', async () => {
      mockPrisma.category.findMany.mockResolvedValue([makeDbCategory()]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'cat-uuid-1',
        name: 'TypeScript',
        description: 'TypeScript articles',
      });
    });

    it('returns an empty array when no categories exist', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the mapped category when found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      const result = await service.findOne('cat-uuid-1');
      expect(result.id).toBe('cat-uuid-1');
      expect(result.name).toBe('TypeScript');
    });

    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns the mapped category', async () => {
      mockPrisma.category.create.mockResolvedValue(makeDbCategory());
      const result = await service.create({
        name: 'TypeScript',
        description: 'TypeScript articles',
      });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: { name: 'TypeScript', description: 'TypeScript articles' },
      });
      expect(result.id).toBe('cat-uuid-1');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'New', description: 'New desc' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and returns the mapped category when found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.update.mockResolvedValue(
        makeDbCategory({ name: 'Updated' }),
      );
      const result = await service.update('cat-uuid-1', {
        name: 'Updated',
        description: 'TypeScript articles',
      });
      expect(result.name).toBe('Updated');
      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'cat-uuid-1' } }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls prisma delete when category exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.delete.mockResolvedValue({});
      await service.remove('cat-uuid-1');
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-uuid-1' },
      });
    });
  });
});
