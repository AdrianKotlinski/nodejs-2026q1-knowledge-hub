import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { CreateCategoryDto } from '../../../src/category/dto/create-category.dto';

describe('CreateCategoryDto', () => {
  it('passes with name and description', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'TS',
      description: 'TypeScript articles',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when name is missing', async () => {
    const dto = plainToInstance(CreateCategoryDto, { description: 'desc' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('fails when description is missing', async () => {
    const dto = plainToInstance(CreateCategoryDto, { name: 'TS' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });
});
