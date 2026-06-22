/**
 * Unit tests for DiscountCalculator strategy implementations.
 * Uses Node.js native test runner (no vitest/rollup dependency).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PercentageDiscountStrategy,
  NoDiscountStrategy,
} from '../core/services/DiscountCalculator';

describe('PercentageDiscountStrategy', () => {
  const strategy = new PercentageDiscountStrategy();

  it('should have a name', () => {
    assert.strictEqual(strategy.name, 'PercentageDiscount');
  });

  it('should return the raw subtotal when discount is 0', () => {
    const result = strategy.calculate(3, 100, 0);
    assert.strictEqual(result, 300);
  });

  it('should apply 10% discount correctly', () => {
    const result = strategy.calculate(3, 100, 0.1);
    assert.strictEqual(result, 270);
  });

  it('should handle 100% discount (free)', () => {
    const result = strategy.calculate(1, 50, 1);
    assert.strictEqual(result, 0);
  });

  it('should ignore discount > 1 (invalid)', () => {
    const result = strategy.calculate(1, 100, 1.5);
    assert.strictEqual(result, 100);
  });

  it('should ignore negative discount', () => {
    const result = strategy.calculate(2, 50, -0.25);
    assert.strictEqual(result, 100);
  });

  it('should round results to 2 decimal places', () => {
    const result = strategy.calculate(3, 33.33, 0.1);
    assert.strictEqual(result, 89.99);
  });

  it('should handle zero quantity (edge case)', () => {
    const result = strategy.calculate(0, 100, 0.1);
    assert.strictEqual(result, 0);
  });

  it('should handle single unit', () => {
    const result = strategy.calculate(1, 250, 0.0);
    assert.strictEqual(result, 250);
  });

  it('should handle large numbers', () => {
    const result = strategy.calculate(1000, 500, 0.25);
    assert.strictEqual(result, 375000);
  });
});

describe('NoDiscountStrategy', () => {
  const strategy = new NoDiscountStrategy();

  it('should have a name', () => {
    assert.strictEqual(strategy.name, 'NoDiscount');
  });

  it('should return raw subtotal regardless of discount parameter', () => {
    const result = strategy.calculate(5, 20, 0.5);
    assert.strictEqual(result, 100);
  });

  it('should handle zero units', () => {
    const result = strategy.calculate(0, 100, 0);
    assert.strictEqual(result, 0);
  });
});
