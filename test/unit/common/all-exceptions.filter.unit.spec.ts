import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ArgumentsHost, BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from '../../../src/common/filters/all-exceptions.filter';

function makeHost(status: ReturnType<typeof vi.fn>, json: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status, json }),
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: ReturnType<typeof vi.fn>;
  let status: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = vi.fn();
    status = vi.fn(() => ({ json }));
  });

  it('handles HttpException with string message', () => {
    filter.catch(new NotFoundException('not found'), makeHost(status, json));
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ statusCode: 404, message: 'not found' });
  });

  it('handles HttpException with array message', () => {
    const err = new BadRequestException(['field is required', 'must be string']);
    filter.catch(err, makeHost(status, json));
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'field is required, must be string' }),
    );
  });

  it('handles HttpException with object body', () => {
    const err = new HttpException({ message: 'custom message' }, 422);
    filter.catch(err, makeHost(status, json));
    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({ statusCode: 422, message: 'custom message' });
  });

  it('returns 500 for unknown errors', () => {
    filter.catch(new Error('something broke'), makeHost(status, json));
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  it('returns 500 for non-Error throws', () => {
    filter.catch('plain string thrown', makeHost(status, json));
    expect(status).toHaveBeenCalledWith(500);
  });
});
