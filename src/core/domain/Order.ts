/**
 * Order domain entity representing a customer order before processing.
 *
 * @module domain/Order
 */

export interface Order {
  /** Unique identifier for the order (e.g., "P001") */
  readonly id: string;

  /** Number of units ordered */
  readonly quantity: number;

  /** Price per unit in base currency */
  readonly unitPrice: number;

  /**
   * Discount rate to apply.
   * - Positive values (0 to 1): percentage discount (e.g., 0.10 = 10% off)
   * - Zero: no discount
   * - Negative values: invalid — should be rejected by validation
   */
  readonly discount: number;
}

/**
 * A valid order after schema validation has passed.
 * Unlike `Order`, this is guaranteed to have safe field values.
 */
export type ValidOrder = Readonly<{
  id: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}>;
