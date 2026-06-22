/**
 * Domain-specific error hierarchy.
 *
 * Separating errors by domain allows callers to handle specific failure
 * modes without brittle string matching.
 *
 * @module errors/DomainError
 */

export class DomainError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.context = context;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class EmptyOrdersError extends DomainError {
  constructor() {
    super('Orders array must not be empty', 'EMPTY_ORDERS');
    this.name = 'EmptyOrdersError';
  }
}

export class InvalidDiscountError extends DomainError {
  constructor(discount: number) {
    super(
      `Discount must be a positive number between 0 and 1. Got: ${discount}`,
      'INVALID_DISCOUNT',
      { discount }
    );
    this.name = 'InvalidDiscountError';
  }
}
