/**
 * Legacy adapter — maintains backward compatibility with the original
 * processOrders_fixed.js API while routing through the new TypeScript pipeline.
 *
 * This file is kept as a bridge for consumers who imported the old JS function.
 * New code should use `OrderProcessor` directly from the barrel export.
 *
 * @deprecated Use `OrderProcessor` from the main barrel export instead.
 * @module processOrders_fixed
 */

import { OrderProcessor } from './core/services/OrderProcessor';
import type { Order } from './core/domain/Order';

interface LegacyResult {
  grandTotal: number;
  orders: Array<{
    id: string;
    total: number;
    hasDiscount: boolean;
  }>;
  count: number;
  average: number;
}

/**
 * @deprecated Use `new OrderProcessor().process(orders)` instead.
 */
export function processOrders(orders: Order[]): LegacyResult {
  const processor = new OrderProcessor();
  return processor.process(orders) as unknown as LegacyResult;
}

// If run directly (node processOrders_fixed.ts), execute with sample data
if (require.main === module) {
  const sampleOrders: Order[] = [
    { id: 'P001', quantity: 3, unitPrice: 100.0, discount: 0.1 },
    { id: 'P002', quantity: 1, unitPrice: 250.0, discount: 0.0 },
    { id: 'P003', quantity: 2, unitPrice: 80.0, discount: 0.05 },
  ];

  const result = processOrders(sampleOrders);
  console.log(JSON.stringify(result, null, 2));
}
