/**
 * ParameterValidator - Shared parameter validation utilities
 * Consolidates parameter validation patterns used in geometric and utility functions
 */

import { TypeUtils, ValidationResult } from './TypeUtils';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Parameter validation utilities for geometric operations
 */
export class ParameterValidator {
  /**
   * Validate a point/vector parameter
   */
  static validatePoint(point: unknown, paramName: string = 'point'): ValidationResult {
    const errors: string[] = [];

    if (!TypeUtils.isObject(point)) {
      return {
        isValid: false,
        errors: [`${paramName} must be an object with x and y properties`],
      };
    }

    const p = point as Record<string, unknown>;

    if (!('x' in p) || !TypeUtils.isNumber(p.x)) {
      errors.push(`${paramName}.x must be a number`);
    }

    if (!('y' in p) || !TypeUtils.isNumber(p.y)) {
      errors.push(`${paramName}.y must be a number`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate an array of points
   */
  static validatePoints(points: unknown, paramName: string = 'points'): ValidationResult {
    if (!TypeUtils.isArray(points)) {
      return {
        isValid: false,
        errors: [`${paramName} must be an array`],
      };
    }

    if (points.length === 0) {
      return {
        isValid: false,
        errors: [`${paramName} must not be empty`],
      };
    }

    const errors: string[] = [];

    for (let i = 0; i < points.length; i++) {
      const pointResult = this.validatePoint(points[i], `${paramName}[${i}]`);
      if (!pointResult.isValid) {
        errors.push(...pointResult.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate bounds rectangle
   */
  static validateBounds(bounds: unknown, paramName: string = 'bounds'): ValidationResult {
    const errors: string[] = [];

    if (!TypeUtils.isObject(bounds)) {
      return {
        isValid: false,
        errors: [`${paramName} must be an object with x, y, width, and height properties`],
      };
    }

    const b = bounds as Record<string, unknown>;

    if (!('x' in b) || !TypeUtils.isNumber(b.x)) {
      errors.push(`${paramName}.x must be a number`);
    }

    if (!('y' in b) || !TypeUtils.isNumber(b.y)) {
      errors.push(`${paramName}.y must be a number`);
    }

    if (!('width' in b) || !TypeUtils.isPositiveNumber(b.width)) {
      errors.push(`${paramName}.width must be a positive number`);
    }

    if (!('height' in b) || !TypeUtils.isPositiveNumber(b.height)) {
      errors.push(`${paramName}.height must be a positive number`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate circle parameters
   */
  static validateCircle(circle: unknown, paramName: string = 'circle'): ValidationResult {
    const errors: string[] = [];

    if (!TypeUtils.isObject(circle)) {
      return {
        isValid: false,
        errors: [`${paramName} must be an object with x, y, and radius properties`],
      };
    }

    const c = circle as Record<string, unknown>;

    if (!('x' in c) || !TypeUtils.isNumber(c.x)) {
      errors.push(`${paramName}.x must be a number`);
    }

    if (!('y' in c) || !TypeUtils.isNumber(c.y)) {
      errors.push(`${paramName}.y must be a number`);
    }

    if (!('radius' in c) || !TypeUtils.isPositiveNumber(c.radius)) {
      errors.push(`${paramName}.radius must be a positive number`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate angle in radians
   */
  static validateAngle(angle: unknown, paramName: string = 'angle'): ValidationResult {
    if (!TypeUtils.isNumber(angle)) {
      return {
        isValid: false,
        errors: [`${paramName} must be a number`],
      };
    }

    // Allow any angle value, including negative and > 2π
    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate distance (positive number)
   */
  static validateDistance(distance: unknown, paramName: string = 'distance'): ValidationResult {
    if (!TypeUtils.isNonNegativeNumber(distance)) {
      return {
        isValid: false,
        errors: [`${paramName} must be a non-negative number`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate polygon vertices (at least 3 points)
   */
  static validatePolygonVertices(vertices: unknown, paramName: string = 'vertices'): ValidationResult {
    const pointsResult = this.validatePoints(vertices, paramName);
    
    if (!pointsResult.isValid) {
      return pointsResult;
    }

    const points = vertices as unknown[];
    
    if (points.length < 3) {
      return {
        isValid: false,
        errors: [`${paramName} must have at least 3 points for a valid polygon`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate scale factor
   */
  static validateScale(scale: unknown, paramName: string = 'scale'): ValidationResult {
    if (!TypeUtils.isPositiveNumber(scale)) {
      return {
        isValid: false,
        errors: [`${paramName} must be a positive number`],
      };
    }

    if (scale === 0) {
      return {
        isValid: false,
        errors: [`${paramName} cannot be zero`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate margin/padding value
   */
  static validateMargin(margin: unknown, paramName: string = 'margin'): ValidationResult {
    if (!TypeUtils.isNonNegativeNumber(margin)) {
      return {
        isValid: false,
        errors: [`${paramName} must be a non-negative number`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate count/quantity (positive integer)
   */
  static validateCount(count: unknown, paramName: string = 'count'): ValidationResult {
    if (!TypeUtils.isNumber(count)) {
      return {
        isValid: false,
        errors: [`${paramName} must be a number`],
      };
    }

    if (!Number.isInteger(count) || count < 0) {
      return {
        isValid: false,
        errors: [`${paramName} must be a non-negative integer`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate separation distance between points
   */
  static validateSeparation(
    point1: Vector2,
    point2: Vector2,
    minSeparation: number,
    paramName: string = 'points'
  ): ValidationResult {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minSeparation) {
      return {
        isValid: false,
        errors: [`${paramName} are too close together. Minimum separation: ${minSeparation}, actual: ${distance.toFixed(2)}`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate that a point is within bounds
   */
  static validatePointInBounds(
    point: Vector2,
    bounds: Bounds,
    paramName: string = 'point'
  ): ValidationResult {
    const errors: string[] = [];

    if (point.x < bounds.x || point.x > bounds.x + bounds.width) {
      errors.push(`${paramName}.x (${point.x}) is outside bounds [${bounds.x}, ${bounds.x + bounds.width}]`);
    }

    if (point.y < bounds.y || point.y > bounds.y + bounds.height) {
      errors.push(`${paramName}.y (${point.y}) is outside bounds [${bounds.y}, ${bounds.y + bounds.height}]`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate array has minimum length
   */
  static validateMinLength<T>(
    array: T[],
    minLength: number,
    paramName: string = 'array'
  ): ValidationResult {
    if (array.length < minLength) {
      return {
        isValid: false,
        errors: [`${paramName} must have at least ${minLength} items, got ${array.length}`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate array has maximum length
   */
  static validateMaxLength<T>(
    array: T[],
    maxLength: number,
    paramName: string = 'array'
  ): ValidationResult {
    if (array.length > maxLength) {
      return {
        isValid: false,
        errors: [`${paramName} must have at most ${maxLength} items, got ${array.length}`],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Create a validation function that throws on invalid input
   */
  static createValidator<T>(
    validator: (value: unknown, paramName?: string) => ValidationResult,
    paramName: string = 'parameter'
  ): (value: unknown) => T {
    return (value: unknown): T => {
      const result = validator(value, paramName);
      if (!result.isValid) {
        throw new Error(`Validation failed for ${paramName}: ${result.errors.join(', ')}`);
      }
      return value as T;
    };
  }
}