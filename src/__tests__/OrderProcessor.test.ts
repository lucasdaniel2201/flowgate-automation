/**
 * Unit tests for OrderProcessor — the core orchestrator.
 * Uses Node.js native test runner.
 *
 * Covers:
 *  - Happy path (single, multiple orders)
 *  - Empty input
 *  - Invalid input
 *  - Strategy substitution
 *  - Edge cases (zero quantity, large numbers)
 *  - Immutability guarantee
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderProcessor } from '../core/services/OrderProcessor';
import { NoDiscountStrategy } from '../core/services/DiscountCalculator';
import { ValidationError } from '../core/errors/DomainError';

describe('OrderProcessor', () => {
  describe('with default strategy (PercentageDiscount)', () => {
    const processor = new OrderProcessor();

    it('should process a single order without discount', () => {
      const orders = [{ id: 'P001', quantity: 1, unitPrice: 250, discount: 0 }];
      const result = processor.process(orders);
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.grandTotal, 250);
      assert.strictEqual(result.average, 250);
      assert.strictEqual(result.orders[0]!.hasDiscount, false);
    });

    it('should process a single order with 10% discount', () => {
      const orders = [{ id: 'P001', quantity: 3, unitPrice: 100, discount: 0.1 }];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.total, 270);
      assert.strictEqual(result.orders[0]!.hasDiscount, true);
    });

    it('should process multiple orders and aggregate correctly', () => {
      const orders = [
        { id: 'P001', quantity: 3, unitPrice: 100.0, discount: 0.1 },
        { id: 'P002', quantity: 1, unitPrice: 250.0, discount: 0.0 },
        { id: 'P003', quantity: 2, unitPrice: 80.0, discount: 0.05 },
      ];
      const result = processor.process(orders);
      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.grandTotal, 672);
      assert.strictEqual(result.average, 224);
    });

    it('should mark orders with discounts correctly', () => {
      const orders = [
        { id: 'P001', quantity: 1, unitPrice: 100, discount: 0.25 },
        { id: 'P002', quantity: 1, unitPrice: 100, discount: 0.0 },
      ];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.hasDiscount, true);
      assert.strictEqual(result.orders[1]!.hasDiscount, false);
    });
  });

  describe('with NoDiscountStrategy', () => {
    const processor = new OrderProcessor(new NoDiscountStrategy());

    it('should ignore all discounts and return raw subtotal', () => {
      const orders = [{ id: 'P001', quantity: 3, unitPrice: 100, discount: 0.9 }];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.total, 300);
      assert.strictEqual(result.orders[0]!.hasDiscount, false);
    });
  });

  describe('edge cases', () => {
    const processor = new OrderProcessor();

    it('should throw ValidationError for empty array', () => {
      assert.throws(() => processor.process([]), ValidationError);
    });

    it('should throw ValidationError for invalid order fields', () => {
      assert.throws(
        () => processor.process([{ id: 'P001', quantity: -1, unitPrice: 100, discount: 0 }]),
        ValidationError
      );
    });

    it('should throw ValidationError for missing fields', () => {
      assert.throws(() => processor.process([{ id: 'P001', quantity: 3 }]), ValidationError);
    });

    it('should handle order with 100% discount (free item)', () => {
      const orders = [{ id: 'P001', quantity: 5, unitPrice: 20, discount: 1 }];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.total, 0);
    });

    it('should handle order with discount just above 0', () => {
      const orders = [{ id: 'P001', quantity: 10, unitPrice: 10, discount: 0.001 }];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.total, 99.9);
    });

    it('should ignore discount > 1 (returns subtotal)', () => {
      const orders = [{ id: 'P001', quantity: 1, unitPrice: 100, discount: 2.5 }];
      const result = processor.process(orders);
      assert.strictEqual(result.orders[0]!.total, 100);
    });
  });

  describe('immutability', () => {
    const processor = new OrderProcessor();

    it('should not mutate the input array', () => {
      const orders = [{ id: 'P001', quantity: 3, unitPrice: 100, discount: 0.1 }];
      const snapshot = JSON.stringify(orders);
      processor.process(orders);
      assert.strictEqual(JSON.stringify(orders), snapshot);
    });
  });

  describe('large input', () => {
    const processor = new OrderProcessor();

    it('should handle 1000 orders efficiently', () => {
      const orders = Array.from({ length: 1000 }, (_, i) => ({
        id: `P${String(i + 1).padStart(4, '0')}`,
        quantity: 1,
        unitPrice: 10,
        discount: i % 2 === 0 ? 0.1 : 0,
      }));
      const result = processor.process(orders);
      assert.strictEqual(result.count, 1000);
      assert.ok(result.grandTotal > 0);
    });
  });
});
