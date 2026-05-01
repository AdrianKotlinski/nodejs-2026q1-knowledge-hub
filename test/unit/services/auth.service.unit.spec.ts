import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/auth.service';
import { UserService } from '../../../src/user/user.service';
import { UserRole } from '../../../src/common/enums';

vi.mock('bcrypt', () => ({ hash: vi.fn(), compare: vi.fn() }));

const makeUserResponse = (overrides: Record<string, any> = {}) => ({
  id: 'user-uuid-1',
  login: 'alice',
  role: UserRole.VIEWER,
  createdAt: 1000,
  updatedAt: 2000,
  ...overrides,
});

const makeDbUser = (overrides: Record<string, any> = {}) => ({
  id: 'user-uuid-1',
  login: 'alice',
  password: 'hashed_pw',
  role: 'viewer',
  createdAt: new Date(1000),
  updatedAt: new Date(2000),
  ...overrides,
});

const mockUserService = {
  findByLogin: vi.fn(),
  findByLoginWithPassword: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_SECRET_KEY = 'access-secret';
    process.env.JWT_SECRET_REFRESH_KEY = 'refresh-secret';
    process.env.TOKEN_EXPIRE_TIME = '1h';
    process.env.TOKEN_REFRESH_EXPIRE_TIME = '24h';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('creates the first user with admin role', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);
      mockUserService.count.mockResolvedValue(0);
      mockUserService.create.mockResolvedValue(
        makeUserResponse({ role: UserRole.ADMIN }),
      );
      await service.signup({ login: 'alice', password: 'pw' });
      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });

    it('creates subsequent users with viewer role', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);
      mockUserService.count.mockResolvedValue(3);
      mockUserService.create.mockResolvedValue(makeUserResponse());
      await service.signup({ login: 'bob', password: 'pw' });
      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.VIEWER }),
      );
    });

    it('throws BadRequestException when login is already taken', async () => {
      mockUserService.findByLogin.mockResolvedValue(makeUserResponse());
      await expect(
        service.signup({ login: 'alice', password: 'pw' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws ForbiddenException when user is not found', async () => {
      mockUserService.findByLoginWithPassword.mockResolvedValue(null);
      await expect(
        service.login({ login: 'alice', password: 'pw' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when password is incorrect', async () => {
      mockUserService.findByLoginWithPassword.mockResolvedValue(makeDbUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(
        service.login({ login: 'alice', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns accessToken and refreshToken on success', async () => {
      mockUserService.findByLoginWithPassword.mockResolvedValue(makeDbUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.sign
        .mockReturnValueOnce('access.token')
        .mockReturnValueOnce('refresh.token');
      const result = await service.login({
        login: 'alice',
        password: 'correct',
      });
      expect(result).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      });
    });

    it('signs access token with JWT_SECRET_KEY and refresh token with JWT_SECRET_REFRESH_KEY', async () => {
      mockUserService.findByLoginWithPassword.mockResolvedValue(makeDbUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('token');
      await service.login({ login: 'alice', password: 'correct' });
      const [firstCall, secondCall] = mockJwtService.sign.mock.calls;
      expect(firstCall[1]).toMatchObject({ secret: 'access-secret' });
      expect(secondCall[1]).toMatchObject({ secret: 'refresh-secret' });
    });

    it('includes userId, login, and role in the token payload', async () => {
      mockUserService.findByLoginWithPassword.mockResolvedValue(
        makeDbUser({ role: 'editor' }),
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('token');
      await service.login({ login: 'alice', password: 'correct' });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          login: 'alice',
          role: 'editor',
        }),
        expect.any(Object),
      );
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when refreshToken is absent', () => {
      expect(() => service.refresh({})).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refreshToken is an empty string', () => {
      expect(() => service.refresh({ refreshToken: '' })).toThrow(
        UnauthorizedException,
      );
    });

    it('throws ForbiddenException when token is invalid or expired', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      expect(() => service.refresh({ refreshToken: 'bad.token' })).toThrow(
        ForbiddenException,
      );
    });

    it('returns a new token pair when refresh token is valid', () => {
      mockJwtService.verify.mockReturnValue({
        userId: 'user-uuid-1',
        login: 'alice',
        role: UserRole.ADMIN,
      });
      mockJwtService.sign
        .mockReturnValueOnce('new.access')
        .mockReturnValueOnce('new.refresh');
      const result = service.refresh({ refreshToken: 'valid.token' });
      expect(result).toEqual({
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
      });
    });

    it('forwards payload fields from the decoded refresh token', () => {
      mockJwtService.verify.mockReturnValue({
        userId: 'user-uuid-1',
        login: 'alice',
        role: UserRole.EDITOR,
      });
      mockJwtService.sign.mockReturnValue('token');
      service.refresh({ refreshToken: 'valid.token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          login: 'alice',
          role: UserRole.EDITOR,
        }),
        expect.any(Object),
      );
    });
  });
});
