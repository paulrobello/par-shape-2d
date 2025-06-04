/**
 * Shared Validation Module
 * Exports all validation utilities for use by game and editor
 */

export * from './TypeUtils';
export * from './JsonUtils';
export * from './ParameterValidator';
export * from './ShapeValidator';

// Re-export common types for convenience
export type {
  ValidationResult,
  RangeConfig,
} from './TypeUtils';

export type {
  JsonParseResult,
  JsonValidationOptions,
} from './JsonUtils';

export type {
  Vector2,
  Bounds,
  Circle,
} from './ParameterValidator';

export type {
  ShapeValidationOptions,
  ShapeValidationResult,
} from './ShapeValidator';