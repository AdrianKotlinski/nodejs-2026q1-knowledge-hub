import { describe, it, expect } from 'vitest';
import { UnauthorizedError } from '../../../src/common/errors/unauthorized.error';

describe('UnauthorizedError', () => {
  it('has statusCode 401 and default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
    expect(err.name).toBe('UnauthorizedError');
  });

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});
