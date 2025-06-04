/**
 * JsonUtils - Shared JSON validation and parsing utilities
 * Consolidates JSON operations used across game and editor
 */

import { ValidationResult } from './TypeUtils';

export interface JsonParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JsonValidationOptions {
  allowComments?: boolean;
  maxDepth?: number;
  maxSize?: number; // in bytes
}

/**
 * JSON parsing and validation utilities
 */
export class JsonUtils {
  /**
   * Safely parse JSON with error handling
   */
  static safeParse<T = unknown>(jsonString: string): JsonParseResult<T> {
    try {
      if (typeof jsonString !== 'string') {
        return {
          success: false,
          error: 'Input must be a string',
        };
      }

      if (jsonString.trim().length === 0) {
        return {
          success: false,
          error: 'Empty JSON string',
        };
      }

      const data = JSON.parse(jsonString) as T;
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Parse JSON from file content with validation
   */
  static parseFileContent<T = unknown>(
    content: string,
    options: JsonValidationOptions = {}
  ): JsonParseResult<T> {
    const { maxSize = 1024 * 1024 } = options; // 1MB default

    // Check file size
    if (content.length > maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size: ${maxSize} bytes, actual: ${content.length} bytes`,
      };
    }

    // Strip BOM if present
    const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

    return this.safeParse<T>(cleanContent);
  }

  /**
   * Validate JSON structure matches expected schema
   */
  static validateJsonStructure(
    data: unknown,
    requiredFields: string[],
    optionalFields: string[] = []
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return {
        isValid: false,
        errors: ['Root must be an object'],
      };
    }

    const obj = data as Record<string, unknown>;
    const allValidFields = [...requiredFields, ...optionalFields];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check for unexpected fields
    for (const field in obj) {
      if (!allValidFields.includes(field)) {
        warnings.push(`Unexpected field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Convert object to formatted JSON string
   */
  static stringify(data: unknown, indent: number = 2): string {
    try {
      return JSON.stringify(data, null, indent);
    } catch (error) {
      throw new Error(`Failed to stringify object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pretty print JSON with error handling
   */
  static prettyPrint(data: unknown): string {
    try {
      return this.stringify(data, 2);
    } catch (error) {
      return `[Error formatting object: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  /**
   * Validate and sanitize JSON for shape definitions
   */
  static validateShapeJson(jsonString: string): JsonParseResult<Record<string, unknown>> {
    const parseResult = this.safeParse<Record<string, unknown>>(jsonString);

    if (!parseResult.success) {
      return parseResult;
    }

    const data = parseResult.data!;

    // Basic structure validation
    const structureResult = this.validateJsonStructure(
      data,
      ['id', 'name', 'category'],
      [
        'enabled', 'dimensions', 'physics', 'rendering', 
        'screwPlacement', 'visual', 'behavior'
      ]
    );

    if (!structureResult.isValid) {
      return {
        success: false,
        error: `Invalid shape JSON structure: ${structureResult.errors.join(', ')}`,
      };
    }

    return {
      success: true,
      data,
    };
  }

  /**
   * Compare two JSON objects for equality
   */
  static deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => 
      key in bObj && this.deepEqual(aObj[key], bObj[key])
    );
  }

  /**
   * Extract error location from JSON parse error
   */
  static extractErrorLocation(error: string): { line?: number; column?: number; context?: string } {
    const result: { line?: number; column?: number; context?: string } = {};

    // Try to parse line/column from common JSON error patterns
    const lineMatch = error.match(/line (\d+)/i);
    const columnMatch = error.match(/column (\d+)/i);

    if (lineMatch) {
      result.line = parseInt(lineMatch[1], 10);
    }

    if (columnMatch) {
      result.column = parseInt(columnMatch[1], 10);
    }

    // Extract context from error message
    const contextMatch = error.match(/near ['"]([^'"]{0,20})['"]/i);
    if (contextMatch) {
      result.context = contextMatch[1];
    }

    return result;
  }

  /**
   * Format JSON error with helpful context
   */
  static formatJsonError(error: string, jsonString?: string): string {
    const location = this.extractErrorLocation(error);
    let formatted = `JSON Parse Error: ${error}`;

    if (location.line !== undefined) {
      formatted += `\n  at line ${location.line}`;
      
      if (location.column !== undefined) {
        formatted += `, column ${location.column}`;
      }
    }

    if (location.context) {
      formatted += `\n  near: "${location.context}"`;
    }

    // If we have the original JSON, try to show the problematic line
    if (jsonString && location.line !== undefined) {
      const lines = jsonString.split('\n');
      const problemLine = lines[location.line - 1];
      if (problemLine) {
        formatted += `\n  line content: ${problemLine.trim()}`;
      }
    }

    return formatted;
  }
}