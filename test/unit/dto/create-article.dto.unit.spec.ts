import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { CreateArticleDto } from '../../../src/article/dto/create-article.dto';

describe('CreateArticleDto', () => {
  it('passes with title and content', async () => {
    const dto = plainToInstance(CreateArticleDto, { title: 'T', content: 'C' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('passes with all optional fields', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'T',
      content: 'C',
      status: 'draft',
      tags: ['nestjs', 'ts'],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when title is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, { content: 'C' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('fails when content is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, { title: 'T' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('fails when status is an invalid enum value', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'T',
      content: 'C',
      status: 'deleted',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});
