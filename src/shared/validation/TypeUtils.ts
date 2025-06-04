/**
 * TypeUtils - Shared type checking and validation utilities
 * Consolidates type checking patterns used across game and editor
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface RangeConfig {
  min?: number;
  max?: number;
  allowEqual?: boolean;
}

/**
 * Type checking utilities
 */
export class TypeUtils {
  /**
   * Check if value is a string
   */
  static isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  /**
   * Check if value is a non-empty string
   */
  static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Check if value is a number
   */
  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Check if value is a positive number
   */
  static isPositiveNumber(value: unknown): value is number {
    return this.isNumber(value) && value > 0;
  }

  /**
   * Check if value is a non-negative number
   */
  static isNonNegativeNumber(value: unknown): value is number {
    return this.isNumber(value) && value >= 0;
  }

  /**
   * Check if value is a boolean
   */
  static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Check if value is an array
   */
  static isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  /**
   * Check if value is a non-empty array
   */
  static isNonEmptyArray(value: unknown): value is unknown[] {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Check if value is a plain object
   */
  static isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Check if value is a valid enum value
   */
  static isValidEnum<T extends string>(value: unknown, enumValues: readonly T[]): value is T {
    return this.isString(value) && enumValues.includes(value as T);
  }

  /**
   * Check if object has required fields
   */
  static hasRequiredFields(
    obj: unknown,
    requiredFields: string[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!this.isObject(obj)) {
      return {
        isValid: false,
        errors: ['Expected object, got ' + typeof obj],
      };
    }

    for (const field of requiredFields) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate number is within range
   */
  static isValidRange(value: unknown, config: RangeConfig): ValidationResult {
    const errors: string[] = [];

    if (!this.isNumber(value)) {
      return {
        isValid: false,
        errors: [`Expected number, got ${typeof value}`],
      };
    }

    const { min, max, allowEqual = true } = config;

    if (min !== undefined) {
      if (allowEqual ? value < min : value <= min) {
        errors.push(`Value ${value} is ${allowEqual ? 'less than' : 'less than or equal to'} minimum ${min}`);
      }
    }

    if (max !== undefined) {
      if (allowEqual ? value > max : value >= max) {
        errors.push(`Value ${value} is ${allowEqual ? 'greater than' : 'greater than or equal to'} maximum ${max}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate min/max object structure
   */
  static isValidMinMax(value: unknown): value is { min: number; max: number } {
    if (!this.isObject(value)) return false;

    const hasMin = 'min' in value && this.isNumber(value.min);
    const hasMax = 'max' in value && this.isNumber(value.max);

    if (!hasMin || !hasMax) return false;

    const obj = value as { min: number; max: number };
    return obj.min <= obj.max;
  }

  /**
   * Validate aspect ratio constraints
   */
  static isValidAspectRatio(value: unknown): value is { min: number; max: number } {
    if (!this.isValidMinMax(value)) return false;

    // Aspect ratios should be positive
    return value.min > 0 && value.max > 0;
  }

  /**
   * Get safe string representation of value
   */
  static safeString(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    return JSON.stringify(value);
  }

  /**
   * Deep clone object (for validation without side effects)
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as unknown as T;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Merge validation results
   */
  static mergeValidationResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    for (const result of results) {
      if (!result.isValid) {
        isValid = false;
      }
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  }
}