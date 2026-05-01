import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

const makeContext = (
  handler: object = {},
  cls: object = {},
): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockReflector = { getAllAndOverride: vi.fn() };
    guard = new JwtAuthGuard(mockReflector as any);
  });

  describe('canActivate', () => {
    it('returns true immediately for routes marked @Public()', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const result = await guard.canActivate(makeContext());
      expect(result).toBe(true);
    });

    it('delegates to passport AuthGuard when route is not public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = vi
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true as never);
      const result = await guard.canActivate(makeContext());
      expect(superSpy).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });

  describe('handleRequest', () => {
    it('returns the user when no error and user is present', () => {
      const user = { userId: 'user-uuid-1', login: 'alice', role: 'viewer' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('throws UnauthorizedException when an error is passed', () => {
      expect(() => guard.handleRequest(new Error('fail'), null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
