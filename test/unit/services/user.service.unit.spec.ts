import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../src/user/user.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UserRole } from '../../../src/common/enums';

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

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UserService);
  });

  describe('findAll', () => {
    it('returns mapped users without password field', async () => {
      mockPrisma.user.findMany.mockResolvedValue([makeDbUser()]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].login).toBe('alice');
    });
  });

  describe('findOne', () => {
    it('returns mapped user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      const result = await service.findOne('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('hashes the password before storing', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);
      mockPrisma.user.create.mockResolvedValue(makeDbUser());
      await service.create({ login: 'alice', password: 'plain_pw' });
      expect(bcrypt.hash).toHaveBeenCalledWith('plain_pw', expect.any(Number));
    });

    it('returns user without password field', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);
      mockPrisma.user.create.mockResolvedValue(makeDbUser());
      const result = await service.create({ login: 'alice', password: 'pw' });
      expect(result).not.toHaveProperty('password');
    });

    it('assigns viewer role when none is provided', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockPrisma.user.create.mockResolvedValue(makeDbUser());
      await service.create({ login: 'alice', password: 'pw' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: UserRole.VIEWER }) }),
      );
    });

    it('assigns the provided role when specified', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockPrisma.user.create.mockResolvedValue(makeDbUser({ role: 'admin' }));
      await service.create({ login: 'alice', password: 'pw', role: UserRole.ADMIN });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: UserRole.ADMIN }) }),
      );
    });

    it('throws BadRequestException on duplicate login (P2002)', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.create({ login: 'alice', password: 'pw' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePassword', () => {
    it('throws BadRequestException when no fields are provided', async () => {
      await expect(service.updatePassword('user-uuid-1', {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePassword('missing', { oldPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates role without touching password when only role is provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      mockPrisma.user.update.mockResolvedValue(makeDbUser({ role: 'editor' }));
      await service.updatePassword('user-uuid-1', { role: UserRole.EDITOR });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: UserRole.EDITOR }) }),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when oldPassword is provided without newPassword', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      await expect(
        service.updatePassword('user-uuid-1', { oldPassword: 'old' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when old password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(
        service.updatePassword('user-uuid-1', { oldPassword: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('hashes new password and updates when old password is correct', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('new_hashed' as never);
      mockPrisma.user.update.mockResolvedValue(makeDbUser());
      await service.updatePassword('user-uuid-1', { oldPassword: 'correct', newPassword: 'new' });
      expect(bcrypt.hash).toHaveBeenCalledWith('new', expect.any(Number));
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ password: 'new_hashed' }) }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('calls prisma delete when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      mockPrisma.user.delete.mockResolvedValue(makeDbUser());
      await service.remove('user-uuid-1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-uuid-1' } });
    });
  });
});
