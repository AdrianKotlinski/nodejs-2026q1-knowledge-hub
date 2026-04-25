import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { CreateCommentDto } from '../../../src/comment/dto/create-comment.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('CreateCommentDto', () => {
  it('passes with content and valid articleId', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: 'Great!', articleId: VALID_UUID });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('fails when content is missing', async () => {
    const dto = plainToInstance(CreateCommentDto, { articleId: VALID_UUID });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('fails when articleId is missing', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: 'Great!' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'articleId')).toBe(true);
  });

  it('fails when articleId is not a UUID', async () => {
    const dto = plainToInstance(CreateCommentDto, { content: 'Great!', articleId: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'articleId')).toBe(true);
  });
});
