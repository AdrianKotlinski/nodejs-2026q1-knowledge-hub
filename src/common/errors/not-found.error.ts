import { NotFoundException } from '@nestjs/common';

export class NotFoundError extends NotFoundException {
  readonly statusCode = 404;
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
