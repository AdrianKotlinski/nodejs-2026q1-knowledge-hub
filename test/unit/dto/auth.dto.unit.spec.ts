import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { SignupDto } from '../../../src/auth/dto/signup.dto';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { RefreshDto } from '../../../src/auth/dto/refresh.dto';

describe('SignupDto', () => {
  it('passes with login and password', async () => {
    const dto = plainToInstance(SignupDto, { login: 'alice', password: 'pw' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = plainToInstance(SignupDto, { password: 'pw' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = plainToInstance(SignupDto, { login: 'alice' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

describe('LoginDto', () => {
  it('passes with login and password', async () => {
    const dto = plainToInstance(LoginDto, { login: 'alice', password: 'pw' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const dto = plainToInstance(LoginDto, { password: 'pw' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = plainToInstance(LoginDto, { login: 'alice' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

describe('RefreshDto', () => {
  it('passes with a refreshToken string', async () => {
    const dto = plainToInstance(RefreshDto, { refreshToken: 'some.jwt.token' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('passes when refreshToken is absent (field is @IsOptional)', async () => {
    const dto = plainToInstance(RefreshDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when refreshToken is a non-string value', async () => {
    const dto = plainToInstance(RefreshDto, { refreshToken: 12345 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'refreshToken')).toBe(true);
  });
});
