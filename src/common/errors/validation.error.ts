import { BadRequestException } from '@nestjs/common';

export class ValidationError extends BadRequestException {
  readonly statusCode = 400;
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}
