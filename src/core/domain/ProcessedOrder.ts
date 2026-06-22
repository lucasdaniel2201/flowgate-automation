/**
 * Processed order DTO — the output of the order processing pipeline.
 *
 * @module domain/ProcessedOrder
 */

export interface ProcessedOrder {
  /** Original order ID */
  readonly id: string;

  /** Final total after applying discount */
  readonly total: number;

  /** Whether a discount was applied to this order */
  readonly hasDiscount: boolean;
}
