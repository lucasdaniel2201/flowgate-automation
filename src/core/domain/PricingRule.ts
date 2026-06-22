/**
 * PricingRule — Strategy interface for discount calculation.
 *
 * Allows multiple discount strategies to be plugged in without modifying
 * the core OrderProcessor. New rules (tiered, fixed, BOGO) can be added
 * by implementing this interface — no changes to existing code.
 *
 * @module domain/PricingRule
 */

export interface PricingRule {
  /** Human-readable name of the rule (e.g., "PercentageDiscount") */
  readonly name: string;

  /**
   * Calculate the discounted total for a single order.
   *
   * @param quantity - Number of units ordered
   * @param unitPrice - Price per unit
   * @param discount - Discount rate (0 to 1 for percentage strategies)
   * @returns The final total after applying the discount
   */
  calculate(quantity: number, unitPrice: number, discount: number): number;
}
