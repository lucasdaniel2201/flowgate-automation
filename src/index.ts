/**
 * Flowgate Automation — Public API Barrel Export
 *
 * @module index
 */

// Domain models (types/interfaces)
export type { Order, ValidOrder } from './core/domain/Order';
export type { ProcessedOrder } from './core/domain/ProcessedOrder';
export type { PricingRule } from './core/domain/PricingRule';

// Services
export { OrderProcessor, processOrders } from './core/services/OrderProcessor';
export type { ProcessingResult } from './core/services/OrderProcessor';
export { PercentageDiscountStrategy, NoDiscountStrategy } from './core/services/DiscountCalculator';
export { validateOrder, validateOrders, isOrder } from './core/services/OrderValidator';

// Errors
export {
  DomainError,
  ValidationError,
  EmptyOrdersError,
  InvalidDiscountError,
} from './core/errors/DomainError';

// Utilities
export { getLogger, logger } from './core/utils/logger';
export type { LoggerContext } from './core/utils/logger';
