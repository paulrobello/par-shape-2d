/**
 * Shared event system exports
 */

// Base types and interfaces
export * from './BaseEventTypes';

// Event bus implementation
export { SharedEventBus, type EventBusConfig } from './SharedEventBus';

// Utilities
export {
  EventLogger,
  EventPerformanceMonitor,
  EventValidator,
  EventFlowAnalyzer,
  debounceEventHandler,
  throttleEventHandler,
  batchEventHandler,
  createEventFilter,
  createEventTransformer
} from './EventUtils';