/**
 * OrderValidator — schema validation for incoming orders using Zod.
 *
 * Runtime validation ensures that even untyped sources (JSON payloads,
 * API responses) conform to the expected shape before entering the
 * processing pipeline.
 *
 * @module services/OrderValidator
 */

import { z } from 'zod';
import { ValidationError } from '../errors/DomainError';
import type { Order, ValidOrder } from '../domain/Order';

/**
 * Zod schema for a single order.
 *
 * Constraints:
 * - `id`: non-empty string
 * - `quantity`: positive integer
 * - `unitPrice`: positive number
 * - `discount`: number (validation for range happens in the strategy)
 */
const orderSchema = z.object({
  id: z.string().min(1, 'Order id must not be empty'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number(),
});

/**
 * Zod schema for an array of orders.
 */
const ordersArraySchema = z.array(orderSchema).min(1, 'Orders array must not be empty');

/**
 * Validate and parse a single order.
 *
 * @param data - Untrusted input object
 * @returns A validated Order
 * @throws {ValidationError} If the input does not match the schema
 */
export function validateOrder(data: unknown): ValidOrder {
  const result = orderSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new ValidationError(`Invalid order: ${issues.join('; ')}`, {
      input: data,
      errors: result.error.flatten(),
    });
  }

  return result.data as ValidOrder;
}

/**
 * Validate an array of orders.
 *
 * @param data - Untrusted input array
 * @returns Array of validated orders
 * @throws {ValidationError} If any order is invalid
 */
export function validateOrders(data: unknown[]): ValidOrder[] {
  const result = ordersArraySchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new ValidationError(`Invalid orders array: ${issues.join('; ')}`, {
      errorCount: result.error.issues.length,
      errors: result.error.flatten(),
    });
  }

  return result.data as ValidOrder[];
}

/**
 * Type guard to check if an unknown value conforms to the Order shape
 * at the TypeScript level (no runtime validation — use `validateOrder`
 * for that).
 */
export function isOrder(value: unknown): value is Order {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'quantity' in value &&
    'unitPrice' in value &&
    'discount' in value
  );
}
