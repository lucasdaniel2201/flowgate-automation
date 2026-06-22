/**
 * PercentageDiscountStrategy — applies a percentage-based discount.
 *
 * Implements the PricingRule interface (Strategy Pattern).
 * Only applies the discount when `discount > 0` and `discount <= 1`.
 *
 * @example
 *   const rule = new PercentageDiscountStrategy();
 *   rule.calculate(3, 100, 0.10); // => 270 (10% off of 300)
 *
 * @module services/DiscountCalculator
 */

import type { PricingRule } from '../domain/PricingRule';

/** Configuration constants for discount bounds */
const DISCOUNT_LOWER_BOUND = 0;
const DISCOUNT_UPPER_BOUND = 1;

export class PercentageDiscountStrategy implements PricingRule {
  public readonly name = 'PercentageDiscount';

  /**
   * Calculate total after percentage discount.
   *
   * @param quantity  - Units purchased
   * @param unitPrice - Price per unit
   * @param discount  - Discount rate (0 = no discount, 0.10 = 10% off)
   * @returns Total after discount, rounded to 2 decimal places
   */
  calculate(quantity: number, unitPrice: number, discount: number): number {
    const subtotal = quantity * unitPrice;

    if (discount <= DISCOUNT_LOWER_BOUND || discount > DISCOUNT_UPPER_BOUND) {
      return subtotal;
    }

    const discounted = subtotal - subtotal * discount;
    return Math.round(discounted * 100) / 100;
  }
}

/**
 * NoDiscountStrategy — returns the raw subtotal unchanged.
 * Useful as a fallback or for orders that don't qualify.
 */
export class NoDiscountStrategy implements PricingRule {
  public readonly name = 'NoDiscount';

  calculate(quantity: number, unitPrice: number, _discount: number): number {
    return quantity * unitPrice;
  }
}
