import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedError extends UnauthorizedException {
  readonly statusCode = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
