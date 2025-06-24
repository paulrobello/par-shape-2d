/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ValidationUtils - Common validation patterns and utilities
 * 
 * Provides reusable patterns for:
 * - Type checking and guards
 * - Range and bounds validation
 * - Format validation
 * - Business rule validation
 * - Validation composition
 */

import { Vector2 } from '@/types/game';

/**
 * Validation result type
 */
export type ValidationResult = {
  valid: boolean;
  errors?: string[];
};

/**
 * Validator function type
 */
export type Validator<T> = (value: T) => boolean | string;

/**
 * Validation rule
 */
export interface ValidationRule<T> {
  validate: Validator<T>;
  message?: string;
}

export class ValidationUtils {
  /**
   * Check if value is within range (inclusive)
   * 
   * @example
   * ValidationUtils.inRange(5, 0, 10); // true
   * ValidationUtils.inRange(-1, 0, 10); // false
   */
  static inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Check if value is positive
   * 
   * @example
   * ValidationUtils.isPositive(5); // true
   * ValidationUtils.isPositive(0); // false
   * ValidationUtils.isPositive(0, true); // true (zero allowed)
   */
  static isPositive(value: number, allowZero = false): boolean {
    return allowZero ? value >= 0 : value > 0;
  }

  /**
   * Check if value is negative
   */
  static isNegative(value: number, allowZero = false): boolean {
    return allowZero ? value <= 0 : value < 0;
  }

  /**
   * Check if value is integer
   */
  static isInteger(value: number): boolean {
    return Number.isInteger(value);
  }

  /**
   * Check if value is finite number
   */
  static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && isFinite(value);
  }

  /**
   * Check if string is non-empty
   * 
   * @example
   * ValidationUtils.isNonEmptyString('hello'); // true
   * ValidationUtils.isNonEmptyString(''); // false
   * ValidationUtils.isNonEmptyString('  '); // false
   */
  static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Check if value is valid email format
   * 
   * @example
   * ValidationUtils.isEmail('user@example.com'); // true
   */
  static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Check if value is valid URL
   */
  static isURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is valid hex color
   * 
   * @example
   * ValidationUtils.isHexColor('#ff0000'); // true
   * ValidationUtils.isHexColor('#f00'); // true
   * ValidationUtils.isHexColor('red'); // false
   */
  static isHexColor(value: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  }

  /**
   * Check if value is valid RGB color
   */
  static isRGBColor(value: string): boolean {
    return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(value);
  }

  /**
   * Check if value is valid RGBA color
   */
  static isRGBAColor(value: string): boolean {
    return /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(value);
  }

  /**
   * Check if point is within bounds
   * 
   * @example
   * ValidationUtils.isPointInBounds({ x: 50, y: 50 }, 0, 0, 100, 100); // true
   */
  static isPointInBounds(
    point: Vector2,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    return point.x >= x && 
           point.x <= x + width && 
           point.y >= y && 
           point.y <= y + height;
  }

  /**
   * Check if two rectangles overlap
   */
  static rectanglesOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  /**
   * Check if value is array with items
   */
  static isNonEmptyArray<T>(value: unknown): value is T[] {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Check if value is plain object
   */
  static isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && 
           typeof value === 'object' && 
           value.constructor === Object;
  }

  /**
   * Check if object has required properties
   * 
   * @example
   * const obj = { name: 'John', age: 30 };
   * ValidationUtils.hasProperties(obj, ['name', 'age']); // true
   * ValidationUtils.hasProperties(obj, ['name', 'email']); // false
   */
  static hasProperties<T extends object>(
    obj: T,
    properties: (keyof T)[]
  ): boolean {
    return properties.every(prop => prop in obj);
  }

  /**
   * Create a composite validator
   * 
   * @example
   * const validator = ValidationUtils.createValidator<number>([
   *   { validate: v => v > 0, message: 'Must be positive' },
   *   { validate: v => v < 100, message: 'Must be less than 100' },
   *   { validate: v => Number.isInteger(v), message: 'Must be integer' }
   * ]);
   * 
   * const result = validator(50); // { valid: true }
   * const result2 = validator(150); // { valid: false, errors: ['Must be less than 100'] }
   */
  static createValidator<T>(
    rules: ValidationRule<T>[]
  ): (value: T) => ValidationResult {
    return (value: T): ValidationResult => {
      const errors: string[] = [];

      for (const rule of rules) {
        const result = rule.validate(value);
        if (result !== true) {
          const message = typeof result === 'string' ? result : rule.message || 'Validation failed';
          errors.push(message);
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    };
  }

  /**
   * Create a validator with custom error formatter
   * 
   * @example
   * const ageValidator = ValidationUtils.createFormattedValidator(
   *   'age',
   *   [
   *     { validate: v => v >= 0, message: 'cannot be negative' },
   *     { validate: v => v <= 150, message: 'seems unrealistic' }
   *   ]
   * );
   */
  static createFormattedValidator<T>(
    fieldName: string,
    rules: ValidationRule<T>[]
  ): (value: T) => ValidationResult {
    const baseValidator = this.createValidator(rules);
    
    return (value: T): ValidationResult => {
      const result = baseValidator(value);
      if (result.errors) {
        result.errors = result.errors.map(error => 
          `${fieldName} ${error}`
        );
      }
      return result;
    };
  }

  /**
   * Validate object against schema
   * 
   * @example
   * const schema = {
   *   name: [
   *     { validate: (v: any) => ValidationUtils.isNonEmptyString(v), message: 'Name is required' }
   *   ],
   *   age: [
   *     { validate: (v: any) => v >= 18, message: 'Must be 18 or older' }
   *   ]
   * };
   * 
   * const result = ValidationUtils.validateObject({ name: 'John', age: 25 }, schema);
   */
  static validateObject<T extends Record<string, unknown>>(
    obj: T,
    schema: Record<keyof T, ValidationRule<any>[]>
  ): ValidationResult {
    const errors: string[] = [];

    for (const [key, rules] of Object.entries(schema) as [keyof T, ValidationRule<any>[]][]) {
      const value = obj[key];
      const validator = this.createFormattedValidator(String(key), rules);
      const result = validator(value);
      
      if (result.errors) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Create a conditional validator
   * 
   * @example
   * const validator = ValidationUtils.conditionalValidator(
   *   (user) => user.role === 'admin',
   *   { validate: (user) => user.permissions.length > 0, message: 'Admin must have permissions' }
   * );
   */
  static conditionalValidator<T>(
    condition: (value: T) => boolean,
    rule: ValidationRule<T>
  ): Validator<T> {
    return (value: T) => {
      if (!condition(value)) {
        return true;
      }
      return rule.validate(value);
    };
  }

  /**
   * Create an async validator
   * 
   * @example
   * const checkUsername = ValidationUtils.createAsyncValidator(async (username: string) => {
   *   const exists = await api.checkUsername(username);
   *   return exists ? 'Username already taken' : true;
   * });
   */
  static createAsyncValidator<T>(
    validator: (value: T) => Promise<boolean | string>
  ): (value: T) => Promise<ValidationResult> {
    return async (value: T): Promise<ValidationResult> => {
      try {
        const result = await validator(value);
        if (result === true) {
          return { valid: true };
        }
        return {
          valid: false,
          errors: [typeof result === 'string' ? result : 'Validation failed']
        };
      } catch (error) {
        return {
          valid: false,
          errors: ['Validation error: ' + (error as Error).message]
        };
      }
    };
  }

  /**
   * Common validators
   */
  static readonly validators = {
    required: <T>(value: T): boolean | string => 
      value !== null && value !== undefined || 'is required',
    
    minLength: (min: number) => (value: string): boolean | string =>
      value.length >= min || `must be at least ${min} characters`,
    
    maxLength: (max: number) => (value: string): boolean | string =>
      value.length <= max || `must be at most ${max} characters`,
    
    min: (min: number) => (value: number): boolean | string =>
      value >= min || `must be at least ${min}`,
    
    max: (max: number) => (value: number): boolean | string =>
      value <= max || `must be at most ${max}`,
    
    pattern: (regex: RegExp, message?: string) => (value: string): boolean | string =>
      regex.test(value) || message || 'invalid format',
    
    oneOf: <T>(options: T[]) => (value: T): boolean | string =>
      options.includes(value) || `must be one of: ${options.join(', ')}`
  };
}