/**
 * OrderProcessor — core orchestrator for the order processing pipeline.
 *
 * Responsibilities:
 *  1. Delegate validation to OrderValidator
 *  2. Apply discount via injected PricingRule (Strategy Pattern)
 *  3. Aggregate results: grandTotal, average, processed list
 *
 * This class follows Single Responsibility Principle: it orchestrates,
 * but does not validate or calculate — those are separate concerns.
 *
 * @module services/OrderProcessor
 */

import type { Order, ValidOrder } from '../domain/Order';
import type { ProcessedOrder } from '../domain/ProcessedOrder';
import type { PricingRule } from '../domain/PricingRule';
import { validateOrders } from './OrderValidator';
import { PercentageDiscountStrategy } from './DiscountCalculator';
import { getLogger } from '../utils/logger';

const logger = getLogger({ module: 'OrderProcessor' });

/**
 * Result of the order processing pipeline.
 */
export interface ProcessingResult {
  /** Sum of all order totals */
  readonly grandTotal: number;

  /** List of individually processed orders */
  readonly orders: readonly ProcessedOrder[];

  /** Total number of orders processed */
  readonly count: number;

  /** Arithmetic mean of order totals (0 if no orders) */
  readonly average: number;
}

/**
 * OrderProcessor — inject a PricingRule to customize discount behavior.
 *
 * @example
 *   const processor = new OrderProcessor(new PercentageDiscountStrategy());
 *   const result = processor.process(orders);
 *   console.log(result.grandTotal);
 */
export class OrderProcessor {
  private readonly pricingRule: PricingRule;

  /**
   * @param pricingRule - Discount strategy to apply (defaults to percentage-based)
   */
  constructor(pricingRule?: PricingRule) {
    this.pricingRule = pricingRule ?? new PercentageDiscountStrategy();
    logger.info({ strategy: this.pricingRule.name }, 'OrderProcessor initialized');
  }

  /**
   * Process an array of orders through the full pipeline:
   * validate → calculate → aggregate.
   *
   * @param orders - Raw input orders (will be validated at runtime)
   * @returns Aggregated processing result
   */
  process(orders: unknown[]): ProcessingResult {
    const startTime = performance.now();

    // 1. Validate
    const validOrders = validateOrders(orders);
    logger.info({ count: validOrders.length }, 'Orders validated successfully');

    // 2. Process each order (immutable — no side effects)
    const processed: ProcessedOrder[] = validOrders.map((order: ValidOrder) => {
      const total = this.pricingRule.calculate(order.quantity, order.unitPrice, order.discount);
      const hasDiscount = total !== order.quantity * order.unitPrice;

      return {
        id: order.id,
        total,
        hasDiscount,
      };
    });

    // 3. Aggregate
    const grandTotal = this.aggregateTotal(processed);
    const count = processed.length;
    const average = count > 0 ? grandTotal / count : 0;

    const durationMs = Math.round(performance.now() - startTime);
    logger.info(
      { grandTotal, count, average: Math.round(average * 100) / 100, durationMs },
      'Processing complete'
    );

    return {
      grandTotal: Math.round(grandTotal * 100) / 100,
      orders: processed,
      count,
      average: Math.round(average * 100) / 100,
    };
  }

  /**
   * Sum all processed order totals.
   * Extracted to allow testing in isolation.
   */
  private aggregateTotal(orders: readonly ProcessedOrder[]): number {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }
}

/**
 * Convenience function for the original `processOrders` API.
 * Maintains backward compatibility while routing through the refactored pipeline.
 *
 * @param orders - Raw orders array
 * @returns Processing result with grandTotal, orders, count, and average
 */
export function processOrders(orders: Order[]): ProcessingResult {
  const processor = new OrderProcessor();
  return processor.process(orders);
}
