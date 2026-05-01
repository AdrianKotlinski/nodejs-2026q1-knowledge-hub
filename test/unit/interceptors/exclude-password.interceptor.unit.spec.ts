import { describe, it, expect, beforeEach } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { ExcludePasswordInterceptor } from '../../../src/common/interceptors/exclude-password.interceptor';

const makeHandler = (value: any) => ({ handle: () => of(value) });

describe('ExcludePasswordInterceptor', () => {
  let interceptor: ExcludePasswordInterceptor;

  beforeEach(() => {
    interceptor = new ExcludePasswordInterceptor();
  });

  it('strips password from a single user object', async () => {
    const input = {
      id: '1',
      login: 'alice',
      password: 'secret',
      role: 'viewer',
    };
    const result = await firstValueFrom(
      interceptor.intercept(
        null as unknown as ExecutionContext,
        makeHandler(input),
      ),
    );
    expect(result).not.toHaveProperty('password');
    expect(result.login).toBe('alice');
  });

  it('strips password from every element in an array response', async () => {
    const input = [
      { id: '1', login: 'alice', password: 'pw1' },
      { id: '2', login: 'bob', password: 'pw2' },
    ];
    const result = await firstValueFrom(
      interceptor.intercept(
        null as unknown as ExecutionContext,
        makeHandler(input),
      ),
    );
    expect(result[0]).not.toHaveProperty('password');
    expect(result[1]).not.toHaveProperty('password');
  });

  it('returns objects without a password key unchanged', async () => {
    const input = { id: '1', name: 'some category' };
    const result = await firstValueFrom(
      interceptor.intercept(
        null as unknown as ExecutionContext,
        makeHandler(input),
      ),
    );
    expect(result).toEqual(input);
  });

  it('returns primitive values unchanged', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        null as unknown as ExecutionContext,
        makeHandler(42),
      ),
    );
    expect(result).toBe(42);
  });

  it('returns null unchanged', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        null as unknown as ExecutionContext,
        makeHandler(null),
      ),
    );
    expect(result).toBeNull();
  });
});
