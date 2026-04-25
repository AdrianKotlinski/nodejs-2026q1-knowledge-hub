import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';

describe('CreateUserDto', () => {
  it('passes with login and password', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'pw',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('passes with valid role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'pw',
      role: 'admin',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = plainToInstance(CreateUserDto, { password: 'pw' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = plainToInstance(CreateUserDto, { login: 'alice' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails when role is an invalid enum value', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'pw',
      role: 'superuser',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'role')).toBe(true);
  });
});
