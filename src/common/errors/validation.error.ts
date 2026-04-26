export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}
