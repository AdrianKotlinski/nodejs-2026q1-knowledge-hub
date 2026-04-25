import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { describe, expect, it, beforeEach } from 'vitest';

const META = { type: 'param' as const, metatype: String, data: 'id' };
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;

  beforeEach(() => {
    pipe = new ParseUUIDPipe({ version: '4' });
  });

  it('returns the value unchanged for a valid UUID v4', async () => {
    expect(await pipe.transform(VALID_UUID, META)).toBe(VALID_UUID);
  });

  it('throws BadRequestException for a plain string', async () => {
    await expect(pipe.transform('abc', META)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for an empty string', async () => {
    await expect(pipe.transform('', META)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for a UUID v1 (wrong version digit)', async () => {
    await expect(
      pipe.transform('550e8400-e29b-11d4-a716-446655440000', META),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for a UUID missing hyphens', async () => {
    await expect(
      pipe.transform('550e8400e29b41d4a716446655440000', META),
    ).rejects.toThrow(BadRequestException);
  });
});
