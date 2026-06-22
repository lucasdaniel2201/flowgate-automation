#!/usr/bin/env node

/**
 * Flowgate Automation — CLI Entry Point
 *
 * Runs the order processing pipeline with sample data.
 * In production, data would come from STDIN, a file, or an API.
 *
 * Usage:
 *   npx tsx src/cli/processOrders.cli.ts
 *   npx tsx src/cli/processOrders.cli.ts --file orders.json
 *
 * @module cli/processOrders
 */

import { OrderProcessor } from '../core/services/OrderProcessor';
import { PercentageDiscountStrategy } from '../core/services/DiscountCalculator';
import type { ProcessedOrder } from '../core/domain/ProcessedOrder';
import { getLogger } from '../core/utils/logger';

const logger = getLogger({ module: 'CLI' });

// ---------------------------------------------------------------------------
// Sample data (demonstration)
// ---------------------------------------------------------------------------
const sampleOrders = [
  { id: 'P001', quantity: 3, unitPrice: 100.0, discount: 0.1 },
  { id: 'P002', quantity: 1, unitPrice: 250.0, discount: 0.0 },
  { id: 'P003', quantity: 2, unitPrice: 80.0, discount: 0.05 },
  { id: 'P004', quantity: 5, unitPrice: 45.0, discount: 0.15 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  logger.info({ orderCount: sampleOrders.length }, 'Starting order processing');

  const processor = new OrderProcessor(new PercentageDiscountStrategy());
  const result = processor.process(sampleOrders);

  // Pretty-print the result
  console.log('\n=== Order Processing Result ===\n');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n=== Summary ===');
  console.log(`   Total Orders: ${result.count}`);
  console.log(`   Grand Total:  $${result.grandTotal.toFixed(2)}`);
  console.log(`   Average:      $${result.average.toFixed(2)}`);
  console.log(
    `   With Discount: ${result.orders.filter((o: ProcessedOrder) => o.hasDiscount).length}`
  );
  console.log('');
}

main();
