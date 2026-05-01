import { ForbiddenException } from '@nestjs/common';

export class ForbiddenError extends ForbiddenException {
  readonly statusCode = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
