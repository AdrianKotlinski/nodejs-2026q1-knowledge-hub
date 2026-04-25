import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';
import { UserRole } from '../../../src/common/enums';

const makeContext = (user: any): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockReflector = { getAllAndOverride: vi.fn() };
    guard = new RolesGuard(mockReflector as any);
  });

  it('returns true when no @Roles() metadata is set', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ role: UserRole.VIEWER }))).toBe(
      true,
    );
  });

  it('returns true when no user is on the request (JwtAuthGuard handles 401)', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('returns true when user role matches one of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.EDITOR,
    ]);
    expect(guard.canActivate(makeContext({ role: UserRole.EDITOR }))).toBe(
      true,
    );
  });

  it('throws ForbiddenException when user role is not in the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(makeContext({ role: UserRole.VIEWER })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with "Insufficient permissions" message', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(makeContext({ role: UserRole.VIEWER })),
    ).toThrow('Insufficient permissions');
  });
});
