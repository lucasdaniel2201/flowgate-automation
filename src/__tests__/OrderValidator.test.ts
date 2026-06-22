/**
 * Unit tests for OrderValidator — Zod-based runtime schema validation.
 * Uses Node.js native test runner.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateOrder, validateOrders, isOrder } from '../core/services/OrderValidator';
import { ValidationError } from '../core/errors/DomainError';

describe('validateOrder', () => {
  it('should validate a correct order', () => {
    const order = { id: 'P001', quantity: 3, unitPrice: 100.0, discount: 0.1 };
    const result = validateOrder(order);
    assert.deepStrictEqual(result, order);
  });

  it('should throw ValidationError for missing id', () => {
    assert.throws(
      () => validateOrder({ quantity: 3, unitPrice: 100, discount: 0 }),
      ValidationError
    );
  });

  it('should throw ValidationError for empty id', () => {
    assert.throws(
      () => validateOrder({ id: '', quantity: 3, unitPrice: 100, discount: 0 }),
      ValidationError
    );
  });

  it('should throw ValidationError for negative quantity', () => {
    assert.throws(
      () => validateOrder({ id: 'P001', quantity: -3, unitPrice: 100, discount: 0 }),
      ValidationError
    );
  });

  it('should throw ValidationError for zero quantity', () => {
    assert.throws(
      () => validateOrder({ id: 'P001', quantity: 0, unitPrice: 100, discount: 0 }),
      ValidationError
    );
  });

  it('should throw ValidationError for non-integer quantity', () => {
    assert.throws(
      () => validateOrder({ id: 'P001', quantity: 3.5, unitPrice: 100, discount: 0 }),
      ValidationError
    );
  });

  it('should throw ValidationError for negative unitPrice', () => {
    assert.throws(
      () => validateOrder({ id: 'P001', quantity: 3, unitPrice: -100, discount: 0 }),
      ValidationError
    );
  });

  it('should accept discount of 0 (no discount)', () => {
    const result = validateOrder({ id: 'P001', quantity: 3, unitPrice: 100, discount: 0 });
    assert.strictEqual(result.discount, 0);
  });

  it('should accept discount of 1 (100% off)', () => {
    const result = validateOrder({ id: 'P001', quantity: 3, unitPrice: 100, discount: 1 });
    assert.strictEqual(result.discount, 1);
  });

  it('should throw ValidationError for null input', () => {
    assert.throws(() => validateOrder(null), ValidationError);
  });

  it('should throw ValidationError for undefined input', () => {
    assert.throws(() => validateOrder(undefined), ValidationError);
  });

  it('should throw ValidationError for string input', () => {
    assert.throws(() => validateOrder('invalid'), ValidationError);
  });

  it('should include context in the error for debugging', () => {
    try {
      validateOrder({ invalid: 'data' });
      assert.fail('Expected ValidationError to be thrown');
    } catch (err) {
      assert.ok(err instanceof ValidationError);
      assert.ok((err as ValidationError).context !== undefined);
    }
  });
});

describe('validateOrders', () => {
  it('should validate an array of correct orders', () => {
    const orders = [
      { id: 'P001', quantity: 3, unitPrice: 100, discount: 0.1 },
      { id: 'P002', quantity: 1, unitPrice: 250, discount: 0 },
    ];
    const result = validateOrders(orders);
    assert.strictEqual(result.length, 2);
  });

  it('should throw ValidationError for empty array', () => {
    assert.throws(() => validateOrders([]), ValidationError);
  });

  it('should throw if any order is invalid', () => {
    const orders = [
      { id: 'P001', quantity: 3, unitPrice: 100, discount: 0.1 },
      { id: 'P002', quantity: -1, unitPrice: 250, discount: 0 },
    ];
    assert.throws(() => validateOrders(orders), ValidationError);
  });
});

describe('isOrder (type guard)', () => {
  it('should return true for a valid order object', () => {
    assert.strictEqual(isOrder({ id: 'P001', quantity: 3, unitPrice: 100, discount: 0 }), true);
  });

  it('should return false for a missing property', () => {
    assert.strictEqual(isOrder({ id: 'P001', quantity: 3, unitPrice: 100 }), false);
  });

  it('should return false for null', () => {
    assert.strictEqual(isOrder(null), false);
  });

  it('should return false for a string', () => {
    assert.strictEqual(isOrder('not an order'), false);
  });

  it('should return false for an empty object', () => {
    assert.strictEqual(isOrder({}), false);
  });
});
