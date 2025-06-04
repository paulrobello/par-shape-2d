/**
 * ShapeValidator - Comprehensive shape definition validation
 * Consolidates validation logic from ShapeLoader, FileManager, and PropertyManager
 */

import { ShapeDefinition } from '@/types/shapes';
import { TypeUtils, ValidationResult } from './TypeUtils';
import { JsonUtils } from './JsonUtils';

export interface ShapeValidationOptions {
  requireEnabled?: boolean;
  applyDefaults?: boolean;
  strictMode?: boolean;
  allowPartial?: boolean;
}

export interface ShapeValidationResult extends ValidationResult {
  validatedShape?: ShapeDefinition;
  appliedDefaults?: string[];
}

/**
 * Comprehensive shape definition validator
 */
export class ShapeValidator {
  // Valid enum values
  private static readonly VALID_CATEGORIES = ['basic', 'polygon', 'path', 'composite'] as const;
  private static readonly VALID_DIMENSION_TYPES = ['fixed', 'random'] as const;
  private static readonly VALID_PHYSICS_TYPES = ['rectangle', 'circle', 'polygon', 'fromVertices', 'composite'] as const;
  private static readonly VALID_RENDERING_TYPES = ['primitive', 'path', 'composite'] as const;
  private static readonly VALID_STRATEGIES = ['corners', 'perimeter', 'grid', 'custom', 'capsule'] as const;

  // Default values
  private static readonly DEFAULT_VALUES = {
    enabled: true,
    dimensions: {
      reductionFactor: 0.15,
    },
    visual: {
      borderWidth: 3,
      alpha: 0.7,
      supportsHoles: true,
    },
    behavior: {
      allowSingleScrew: true,
      singleScrewDynamic: true,
      rotationalInertiaMultiplier: 3,
    },
    screwPlacement: {
      minSeparation: 48,
    },
  } as const;

  /**
   * Validate shape definition from JSON string
   */
  static validateFromJson(
    jsonString: string,
    options: ShapeValidationOptions = {}
  ): ShapeValidationResult {
    // Parse JSON first
    const parseResult = JsonUtils.validateShapeJson(jsonString);
    if (!parseResult.success) {
      return {
        isValid: false,
        errors: [parseResult.error || 'Failed to parse JSON'],
      };
    }

    return this.validateShapeDefinition(parseResult.data!, options);
  }

  /**
   * Validate shape definition object
   */
  static validateShapeDefinition(
    shape: unknown,
    options: ShapeValidationOptions = {}
  ): ShapeValidationResult {
    const {
      requireEnabled = false,
      applyDefaults = true,
      strictMode = false,
      allowPartial = false,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];
    const appliedDefaults: string[] = [];

    // Basic structure check
    if (!TypeUtils.isObject(shape)) {
      return {
        isValid: false,
        errors: ['Shape definition must be an object'],
      };
    }

    const def = TypeUtils.deepClone(shape) as Record<string, unknown>;

    // Validate required core fields
    const coreResult = this.validateCoreFields(def, requireEnabled);
    if (!coreResult.isValid) {
      errors.push(...coreResult.errors);
      if (!allowPartial) {
        return { isValid: false, errors };
      }
    }

    // Validate dimensions
    const dimensionsResult = this.validateDimensions(def.dimensions, applyDefaults);
    if (!dimensionsResult.isValid) {
      errors.push(...dimensionsResult.errors);
    } else if (dimensionsResult.appliedDefaults) {
      appliedDefaults.push(...dimensionsResult.appliedDefaults);
      def.dimensions = dimensionsResult.validatedData;
    }

    // Validate physics
    const physicsResult = this.validatePhysics(def.physics);
    if (!physicsResult.isValid) {
      errors.push(...physicsResult.errors);
    }

    // Validate rendering
    const renderingResult = this.validateRendering(def.rendering);
    if (!renderingResult.isValid) {
      errors.push(...renderingResult.errors);
    }

    // Validate screw placement
    const screwResult = this.validateScrewPlacement(def.screwPlacement, applyDefaults);
    if (!screwResult.isValid) {
      errors.push(...screwResult.errors);
    } else if (screwResult.appliedDefaults) {
      appliedDefaults.push(...screwResult.appliedDefaults);
      def.screwPlacement = screwResult.validatedData;
    }

    // Validate optional fields with defaults
    if (applyDefaults) {
      const visualResult = this.validateVisual(def.visual);
      if (visualResult.appliedDefaults) {
        appliedDefaults.push(...visualResult.appliedDefaults);
        def.visual = visualResult.validatedData;
      }

      const behaviorResult = this.validateBehavior(def.behavior);
      if (behaviorResult.appliedDefaults) {
        appliedDefaults.push(...behaviorResult.appliedDefaults);
        def.behavior = behaviorResult.validatedData;
      }
    }

    // Check for unexpected fields in strict mode
    if (strictMode) {
      const expectedFields = [
        'id', 'name', 'category', 'enabled', 'dimensions',
        'physics', 'rendering', 'screwPlacement', 'visual', 'behavior'
      ];
      for (const field in def) {
        if (!expectedFields.includes(field)) {
          warnings.push(`Unexpected field: ${field}`);
        }
      }
    }

    const isValid = errors.length === 0 || (allowPartial && errors.length < 3);

    const result: ShapeValidationResult = {
      isValid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    if (isValid && applyDefaults) {
      result.validatedShape = def as unknown as ShapeDefinition;
      if (appliedDefaults.length > 0) {
        result.appliedDefaults = appliedDefaults;
      }
    }

    return result;
  }

  /**
   * Validate core required fields
   */
  private static validateCoreFields(
    def: Record<string, unknown>,
    requireEnabled: boolean
  ): ValidationResult {
    const errors: string[] = [];

    // ID validation
    if (!TypeUtils.isNonEmptyString(def.id)) {
      errors.push('Missing or invalid "id" field - must be a non-empty string');
    }

    // Name validation
    if (!TypeUtils.isNonEmptyString(def.name)) {
      errors.push('Missing or invalid "name" field - must be a non-empty string');
    }

    // Category validation
    if (!TypeUtils.isValidEnum(def.category, this.VALID_CATEGORIES)) {
      errors.push(`Invalid "category" field - must be one of: ${this.VALID_CATEGORIES.join(', ')}`);
    }

    // Enabled validation
    if (requireEnabled && !TypeUtils.isBoolean(def.enabled)) {
      errors.push('Missing or invalid "enabled" field - must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate dimensions configuration
   */
  private static validateDimensions(
    dimensions: unknown,
    applyDefaults: boolean
  ): ValidationResult & { validatedData?: unknown; appliedDefaults?: string[] } {
    const errors: string[] = [];
    const appliedDefaults: string[] = [];

    if (!TypeUtils.isObject(dimensions)) {
      return {
        isValid: false,
        errors: ['Missing or invalid "dimensions" field - must be an object'],
      };
    }

    const dim = { ...dimensions } as Record<string, unknown>;

    // Type validation
    if (!TypeUtils.isValidEnum(dim.type, this.VALID_DIMENSION_TYPES)) {
      errors.push(`Invalid dimensions.type - must be one of: ${this.VALID_DIMENSION_TYPES.join(', ')}`);
    }

    // Apply defaults
    if (applyDefaults) {
      if (dim.reductionFactor === undefined) {
        dim.reductionFactor = this.DEFAULT_VALUES.dimensions.reductionFactor;
        appliedDefaults.push('dimensions.reductionFactor');
      }
    }

    // Validate reductionFactor if present
    if (dim.reductionFactor !== undefined) {
      const rangeResult = TypeUtils.isValidRange(dim.reductionFactor, { min: 0, max: 1 });
      if (!rangeResult.isValid) {
        errors.push(`Invalid dimensions.reductionFactor: ${rangeResult.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: dim,
      appliedDefaults: appliedDefaults.length > 0 ? appliedDefaults : undefined,
    };
  }

  /**
   * Validate physics configuration
   */
  private static validatePhysics(physics: unknown): ValidationResult {
    const errors: string[] = [];

    if (!TypeUtils.isObject(physics)) {
      errors.push('Missing or invalid "physics" field - must be an object');
      return { isValid: false, errors };
    }

    const phys = physics as Record<string, unknown>;

    // Type validation
    if (!TypeUtils.isValidEnum(phys.type, this.VALID_PHYSICS_TYPES)) {
      errors.push(`Invalid physics.type - must be one of: ${this.VALID_PHYSICS_TYPES.join(', ')}`);
    }

    // Validate decomposition for fromVertices
    if (phys.type === 'fromVertices' && phys.decomposition !== undefined) {
      if (!TypeUtils.isBoolean(phys.decomposition)) {
        errors.push('physics.decomposition must be a boolean when specified');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate rendering configuration
   */
  private static validateRendering(rendering: unknown): ValidationResult {
    const errors: string[] = [];

    if (!TypeUtils.isObject(rendering)) {
      errors.push('Missing or invalid "rendering" field - must be an object');
      return { isValid: false, errors };
    }

    const rend = rendering as Record<string, unknown>;

    // Type validation
    if (!TypeUtils.isValidEnum(rend.type, this.VALID_RENDERING_TYPES)) {
      errors.push(`Invalid rendering.type - must be one of: ${this.VALID_RENDERING_TYPES.join(', ')}`);
    }

    // Validate preserveOriginalVertices for path rendering
    if (rend.type === 'path' && rend.preserveOriginalVertices !== undefined) {
      if (!TypeUtils.isBoolean(rend.preserveOriginalVertices)) {
        errors.push('rendering.preserveOriginalVertices must be a boolean when specified');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate screw placement configuration
   */
  private static validateScrewPlacement(
    screwPlacement: unknown,
    applyDefaults: boolean
  ): ValidationResult & { validatedData?: unknown; appliedDefaults?: string[] } {
    const errors: string[] = [];
    const appliedDefaults: string[] = [];

    if (!TypeUtils.isObject(screwPlacement)) {
      return {
        isValid: false,
        errors: ['Missing or invalid "screwPlacement" field - must be an object'],
      };
    }

    const screw = { ...screwPlacement } as Record<string, unknown>;

    // Strategy validation
    if (!TypeUtils.isValidEnum(screw.strategy, this.VALID_STRATEGIES)) {
      errors.push(`Invalid screwPlacement.strategy - must be one of: ${this.VALID_STRATEGIES.join(', ')}`);
    }

    // Apply defaults
    if (applyDefaults) {
      if (screw.minSeparation === undefined) {
        screw.minSeparation = this.DEFAULT_VALUES.screwPlacement.minSeparation;
        appliedDefaults.push('screwPlacement.minSeparation');
      }
    }

    // Validate minSeparation if present
    if (screw.minSeparation !== undefined) {
      if (!TypeUtils.isPositiveNumber(screw.minSeparation)) {
        errors.push('screwPlacement.minSeparation must be a positive number');
      }
    }

    // Strategy-specific validation
    if (TypeUtils.isString(screw.strategy)) {
      const strategyErrors = this.validateStrategySpecificFields(screw.strategy, screw);
      errors.push(...strategyErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: screw,
      appliedDefaults: appliedDefaults.length > 0 ? appliedDefaults : undefined,
    };
  }

  /**
   * Validate strategy-specific fields
   */
  private static validateStrategySpecificFields(
    strategy: string,
    screw: Record<string, unknown>
  ): string[] {
    const errors: string[] = [];

    switch (strategy) {
      case 'corners':
        if (screw.cornerMargin !== undefined && !TypeUtils.isNonNegativeNumber(screw.cornerMargin)) {
          errors.push('screwPlacement.cornerMargin must be a non-negative number');
        }
        break;

      case 'perimeter':
        if (screw.perimeterPoints !== undefined && !TypeUtils.isPositiveNumber(screw.perimeterPoints)) {
          errors.push('screwPlacement.perimeterPoints must be a positive number');
        }
        if (screw.perimeterMargin !== undefined && !TypeUtils.isNonNegativeNumber(screw.perimeterMargin)) {
          errors.push('screwPlacement.perimeterMargin must be a non-negative number');
        }
        break;

      case 'grid':
        if (screw.gridSpacing !== undefined && !TypeUtils.isPositiveNumber(screw.gridSpacing)) {
          errors.push('screwPlacement.gridSpacing must be a positive number');
        }
        break;

      case 'capsule':
        if (screw.capsuleEndMargin !== undefined && !TypeUtils.isNonNegativeNumber(screw.capsuleEndMargin)) {
          errors.push('screwPlacement.capsuleEndMargin must be a non-negative number');
        }
        break;

      case 'custom':
        if (screw.customPositions !== undefined) {
          if (!TypeUtils.isArray(screw.customPositions)) {
            errors.push('screwPlacement.customPositions must be an array');
          } else {
            const positions = screw.customPositions as unknown[];
            for (let i = 0; i < positions.length; i++) {
              const pos = positions[i];
              if (!TypeUtils.isObject(pos)) {
                errors.push(`screwPlacement.customPositions[${i}] must be an object`);
                continue;
              }
              const posObj = pos as Record<string, unknown>;
              if (!TypeUtils.isObject(posObj.position)) {
                errors.push(`screwPlacement.customPositions[${i}].position must be an object with x and y`);
              }
              if (posObj.priority !== undefined && !TypeUtils.isNumber(posObj.priority)) {
                errors.push(`screwPlacement.customPositions[${i}].priority must be a number`);
              }
            }
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Validate visual configuration with defaults
   */
  private static validateVisual(
    visual: unknown
  ): { validatedData: unknown; appliedDefaults?: string[] } {
    const appliedDefaults: string[] = [];
    let vis: Record<string, unknown>;

    if (!TypeUtils.isObject(visual)) {
      vis = {};
      appliedDefaults.push('visual (created missing object)');
    } else {
      vis = { ...visual };
    }

    // Apply defaults
    if (vis.borderWidth === undefined) {
      vis.borderWidth = this.DEFAULT_VALUES.visual.borderWidth;
      appliedDefaults.push('visual.borderWidth');
    }
    if (vis.alpha === undefined) {
      vis.alpha = this.DEFAULT_VALUES.visual.alpha;
      appliedDefaults.push('visual.alpha');
    }
    if (vis.supportsHoles === undefined) {
      vis.supportsHoles = this.DEFAULT_VALUES.visual.supportsHoles;
      appliedDefaults.push('visual.supportsHoles');
    }

    return {
      validatedData: vis,
      appliedDefaults: appliedDefaults.length > 0 ? appliedDefaults : undefined,
    };
  }

  /**
   * Validate behavior configuration with defaults
   */
  private static validateBehavior(
    behavior: unknown
  ): { validatedData: unknown; appliedDefaults?: string[] } {
    const appliedDefaults: string[] = [];
    let beh: Record<string, unknown>;

    if (!TypeUtils.isObject(behavior)) {
      beh = {};
      appliedDefaults.push('behavior (created missing object)');
    } else {
      beh = { ...behavior };
    }

    // Apply defaults
    if (beh.allowSingleScrew === undefined) {
      beh.allowSingleScrew = this.DEFAULT_VALUES.behavior.allowSingleScrew;
      appliedDefaults.push('behavior.allowSingleScrew');
    }
    if (beh.singleScrewDynamic === undefined) {
      beh.singleScrewDynamic = this.DEFAULT_VALUES.behavior.singleScrewDynamic;
      appliedDefaults.push('behavior.singleScrewDynamic');
    }
    if (beh.rotationalInertiaMultiplier === undefined) {
      beh.rotationalInertiaMultiplier = this.DEFAULT_VALUES.behavior.rotationalInertiaMultiplier;
      appliedDefaults.push('behavior.rotationalInertiaMultiplier');
    }

    return {
      validatedData: beh,
      appliedDefaults: appliedDefaults.length > 0 ? appliedDefaults : undefined,
    };
  }

  /**
   * Quick validation for essential fields only
   */
  static validateEssentials(shape: unknown): ValidationResult {
    return this.validateShapeDefinition(shape, {
      requireEnabled: false,
      applyDefaults: false,
      strictMode: false,
      allowPartial: true,
    });
  }

  /**
   * Strict validation with all checks
   */
  static validateStrict(shape: unknown): ShapeValidationResult {
    return this.validateShapeDefinition(shape, {
      requireEnabled: true,
      applyDefaults: true,
      strictMode: true,
      allowPartial: false,
    });
  }

  /**
   * Validate and apply defaults (most common use case)
   */
  static validateWithDefaults(shape: unknown): ShapeValidationResult {
    return this.validateShapeDefinition(shape, {
      requireEnabled: false,
      applyDefaults: true,
      strictMode: false,
      allowPartial: false,
    });
  }
}