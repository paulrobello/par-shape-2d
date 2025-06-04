import { BaseEditorSystem } from '../core/BaseEditorSystem';
import { ShapeDefinition } from '@/types/shapes';
import { EditorEventPriority } from '../core/EditorEventBus';
import { 
  EditorShapeCreatedEvent, 
  EditorShapeUpdatedEvent, 
  EditorPropertyChangedEvent,
  EditorPropertyRandomRequestedEvent,
  EditorPropertyResetRequestedEvent
} from '../events/EditorEventTypes';
import { ShapeValidator } from '@/shared/validation';

interface PropertyValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  enum?: unknown[];
  pattern?: RegExp;
  custom?: (value: unknown) => string | null; // Returns error message or null if valid
}

interface PropertySchema {
  [path: string]: PropertyValidationRule;
}

/**
 * Manages property validation and random value generation
 */
export class PropertyManager extends BaseEditorSystem {
  private currentShape: ShapeDefinition | null = null;
  private validationSchema: PropertySchema = {};

  constructor() {
    super('PropertyManager');
    this.setupValidationSchema();
  }

  protected async onInitialize(): Promise<void> {
    this.setupEventSubscriptions();
  }

  protected onUpdate(deltaTime: number): void {
    // PropertyManager doesn't need frame updates
    void deltaTime;
  }

  protected onRender(context: CanvasRenderingContext2D): void {
    // PropertyManager doesn't render
    void context;
  }

  protected onDestroy(): void {
    this.currentShape = null;
  }

  private setupEventSubscriptions(): void {
    // Track current shape
    this.subscribe('editor:shape:created', async (event: EditorShapeCreatedEvent) => {
      this.currentShape = event.payload.shapeDefinition;
    });

    this.subscribe('editor:shape:updated', async (event: EditorShapeUpdatedEvent) => {
      this.currentShape = event.payload.shapeDefinition;
    });

    this.subscribe('editor:shape:destroyed', async () => {
      this.currentShape = null;
    });

    // Handle property changes
    this.subscribe('editor:property:changed', async (event: EditorPropertyChangedEvent) => {
      const validationResult = this.validateProperty(event.payload.path, event.payload.value);
      
      // Check if this is a strategy change and populate missing defaults
      if (event.payload.path === 'screwPlacement.strategy') {
        await this.populateStrategyDefaults(event.payload.value as string);
      }
      
      await this.emit({
        type: 'editor:property:validated',
        payload: {
          path: event.payload.path,
          isValid: validationResult.isValid,
          error: validationResult.error,
        },
      });
    }, EditorEventPriority.HIGH);

    // Handle random value requests
    this.subscribe('editor:property:random:requested', async (event: EditorPropertyRandomRequestedEvent) => {
      await this.generateRandomValues(event.payload.paths);
    });

    // Handle reset requests
    this.subscribe('editor:property:reset:requested', async (event: EditorPropertyResetRequestedEvent) => {
      await this.resetToDefaults(event.payload.paths);
    });
  }

  private setupValidationSchema(): void {
    this.validationSchema = {
      'id': { required: true, type: 'string', pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/ },
      'name': { required: true, type: 'string' },
      'category': { required: true, type: 'string', enum: ['basic', 'polygon', 'path', 'composite'] },
      'enabled': { required: true, type: 'boolean' },
      
      'dimensions.type': { required: true, type: 'string', enum: ['fixed', 'random'] },
      'dimensions.width.min': { type: 'number', min: 10, max: 1000 },
      'dimensions.width.max': { type: 'number', min: 10, max: 1000 },
      'dimensions.height.min': { type: 'number', min: 10, max: 1000 },
      'dimensions.height.max': { type: 'number', min: 10, max: 1000 },
      'dimensions.radius.min': { type: 'number', min: 5, max: 500 },
      'dimensions.radius.max': { type: 'number', min: 5, max: 500 },
      'dimensions.sides': { type: 'number', min: 3, max: 8 },
      'dimensions.scale.min': { type: 'number', min: 0.1, max: 5.0 },
      'dimensions.scale.max': { type: 'number', min: 0.1, max: 5.0 },
      'dimensions.aspectRatio.min': { type: 'number', min: 0.1, max: 10.0 },
      'dimensions.aspectRatio.max': { type: 'number', min: 0.1, max: 10.0 },
      'dimensions.reductionFactor': { type: 'number', min: 0.05, max: 0.5 },
      
      'physics.type': { required: true, type: 'string', enum: ['rectangle', 'circle', 'polygon', 'fromVertices', 'composite'] },
      'physics.decomposition': { type: 'boolean' },
      
      'rendering.type': { required: true, type: 'string', enum: ['primitive', 'path', 'composite'] },
      'rendering.preserveOriginalVertices': { type: 'boolean' },
      
      'screwPlacement.strategy': { required: true, type: 'string', enum: ['corners', 'perimeter', 'grid', 'custom', 'capsule'] },
      'screwPlacement.cornerMargin': { type: 'number', min: 5, max: 100 },
      'screwPlacement.perimeterPoints': { type: 'number', min: 3, max: 16 },
      'screwPlacement.perimeterMargin': { type: 'number', min: 5, max: 100 },
      'screwPlacement.minSeparation': { type: 'number', min: 20, max: 200 },
      'screwPlacement.gridSpacing': { type: 'number', min: 20, max: 200 },
      'screwPlacement.capsuleEndMargin': { type: 'number', min: 0, max: 50 },
      
      'visual.supportsHoles': { type: 'boolean' },
      'visual.borderWidth': { type: 'number', min: 1, max: 10 },
      'visual.alpha': { type: 'number', min: 0.1, max: 1.0 },
      
      'behavior.allowSingleScrew': { type: 'boolean' },
      'behavior.singleScrewDynamic': { type: 'boolean' },
      'behavior.rotationalInertiaMultiplier': { type: 'number', min: 1, max: 10 },
    };
  }

  private validateProperty(path: string, value: unknown): { isValid: boolean; error?: string } {
    const rule = this.validationSchema[path];
    if (!rule) {
      return { isValid: true }; // No validation rule means it's valid
    }

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Type check
    if (value !== undefined && value !== null && rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        return { isValid: false, error: `Expected ${rule.type}, got ${actualType}` };
      }
    }

    // Number range checks
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return { isValid: false, error: `Value must be at least ${rule.min}` };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { isValid: false, error: `Value must be at most ${rule.max}` };
      }
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      return { isValid: false, error: `Value must be one of: ${rule.enum.join(', ')}` };
    }

    // Pattern check
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return { isValid: false, error: 'Invalid format' };
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true };
  }

  private async populateStrategyDefaults(strategy: string): Promise<void> {
    if (!this.currentShape) return;

    // Define strategy-specific defaults based on existing shape files
    const strategyDefaults: { [strategy: string]: { [path: string]: unknown } } = {
      corners: {
        'screwPlacement.cornerMargin': 30,
      },
      perimeter: {
        'screwPlacement.perimeterPoints': 8,
        'screwPlacement.perimeterMargin': 30, // Based on arrow.json
      },
      grid: {
        'screwPlacement.gridSpacing': 40,
      },
      capsule: {
        'screwPlacement.capsuleEndMargin': 5, // Based on capsule.json
      },
      custom: {
        // Custom strategy doesn't need defaults - positions are set via canvas
      },
    };

    const defaults = strategyDefaults[strategy];
    if (!defaults) return;

    // Populate missing values with defaults
    for (const [path, defaultValue] of Object.entries(defaults)) {
      const currentValue = this.getNestedValue(this.currentShape as unknown as Record<string, unknown>, path);
      
      // Only set default if current value is undefined/null
      if (currentValue === undefined || currentValue === null) {
        await this.emit({
          type: 'editor:property:changed',
          payload: {
            path,
            value: defaultValue,
          },
        });
      }
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  private async generateRandomValues(paths?: string[]): Promise<void> {
    if (!this.currentShape) return;

    const targetPaths = paths || this.getRandomizablePaths();
    
    // Group min/max pairs together
    const processedPaths = new Set<string>();
    
    for (const path of targetPaths) {
      if (processedPaths.has(path)) continue;
      
      // Check if this is a min path with a corresponding max
      if (path.endsWith('.min')) {
        const basePath = path.substring(0, path.length - 4);
        const maxPath = basePath + '.max';
        
        if (targetPaths.includes(maxPath)) {
          // Generate min/max pair together
          const minRule = this.validationSchema[path];
          const maxRule = this.validationSchema[maxPath];
          
          if (minRule && maxRule && minRule.type === 'number' && maxRule.type === 'number') {
            // Generate min value
            const absoluteMin = minRule.min ?? 0;
            const absoluteMax = minRule.max ?? 100;
            const minValue = Math.random() * (absoluteMax - absoluteMin) + absoluteMin;
            
            // Generate max value that's >= min value
            const maxMin = Math.max(minValue, maxRule.min ?? minValue);
            const maxMax = maxRule.max ?? Math.max(maxMin + 100, 200);
            const maxValue = Math.random() * (maxMax - maxMin) + maxMin;
            
            // Emit both values
            await this.emit({
              type: 'editor:property:changed',
              payload: { path, value: minValue },
            });
            await this.emit({
              type: 'editor:property:changed',
              payload: { path: maxPath, value: maxValue },
            });
            
            processedPaths.add(path);
            processedPaths.add(maxPath);
            continue;
          }
        }
      }
      
      // Handle standalone values or max values without min
      const randomValue = this.generateRandomValue(path);
      if (randomValue !== null) {
        await this.emit({
          type: 'editor:property:changed',
          payload: {
            path,
            value: randomValue,
          },
        });
      }
      processedPaths.add(path);
    }
  }

  private async resetToDefaults(paths?: string[]): Promise<void> {
    if (!this.currentShape) return;

    const targetPaths = paths || Object.keys(this.validationSchema);
    
    for (const path of targetPaths) {
      const defaultValue = this.getDefaultValue(path);
      if (defaultValue !== null) {
        await this.emit({
          type: 'editor:property:changed',
          payload: {
            path,
            value: defaultValue,
          },
        });
      }
    }
  }

  private generateRandomValue(path: string): unknown {
    const rule = this.validationSchema[path];
    if (!rule) return null;

    switch (rule.type) {
      case 'string':
        if (rule.enum) {
          return rule.enum[Math.floor(Math.random() * rule.enum.length)];
        }
        return 'generated_' + Math.random().toString(36).substr(2, 8);
      
      case 'number':
        const min = rule.min ?? 0;
        const max = rule.max ?? 100;
        return Math.random() * (max - min) + min;
      
      case 'boolean':
        return Math.random() > 0.5;
      
      default:
        return null;
    }
  }

  private getDefaultValue(path: string): unknown {
    const defaults: { [key: string]: unknown } = {
      'id': 'new_shape',
      'name': 'New Shape',
      'category': 'basic',
      'enabled': true,
      'dimensions.type': 'random',
      'dimensions.reductionFactor': 0.15,
      'physics.type': 'rectangle',
      'rendering.type': 'primitive',
      'screwPlacement.strategy': 'corners',
      'screwPlacement.cornerMargin': 30,
      'screwPlacement.perimeterPoints': 8,
      'screwPlacement.perimeterMargin': 30,
      'screwPlacement.gridSpacing': 40,
      'screwPlacement.capsuleEndMargin': 5,
      'screwPlacement.minSeparation': 48,
      'visual.supportsHoles': true,
      'behavior.allowSingleScrew': true,
      'behavior.singleScrewDynamic': true,
      'behavior.rotationalInertiaMultiplier': 3,
    };

    return defaults[path] ?? null;
  }

  private getRandomizablePaths(): string[] {
    if (!this.currentShape) return [];
    
    const paths: string[] = [];
    
    // Only add width/height paths if the shape doesn't have radius
    if (!this.currentShape.dimensions?.radius) {
      paths.push(
        'dimensions.width.min',
        'dimensions.width.max',
        'dimensions.height.min',
        'dimensions.height.max'
      );
    }
    
    // Only add radius paths if the shape has radius
    if (this.currentShape.dimensions?.radius) {
      paths.push(
        'dimensions.radius.min',
        'dimensions.radius.max'
      );
    }
    
    // Add scale paths if applicable
    if (this.currentShape.dimensions?.scale) {
      paths.push(
        'dimensions.scale.min',
        'dimensions.scale.max'
      );
    }
    
    // Add screw placement paths based on strategy
    const strategy = this.currentShape.screwPlacement?.strategy;
    if (strategy === 'corners') {
      paths.push('screwPlacement.cornerMargin');
    } else if (strategy === 'perimeter') {
      paths.push(
        'screwPlacement.perimeterPoints',
        'screwPlacement.perimeterMargin'
      );
    } else if (strategy === 'grid') {
      paths.push('screwPlacement.gridSpacing');
    } else if (strategy === 'capsule') {
      paths.push('screwPlacement.capsuleEndMargin');
    }
    
    // Always add these paths
    paths.push(
      'screwPlacement.minSeparation',
      'behavior.rotationalInertiaMultiplier'
    );
    
    return paths;
  }

  // Public API
  validateShape(shape: ShapeDefinition, useSharedValidator: boolean = false): { isValid: boolean; errors: string[] } {
    if (useSharedValidator) {
      // Use shared comprehensive validator
      const validationResult = ShapeValidator.validateWithDefaults(shape);
      
      return {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
      };
    }

    // Use local field-by-field validation for real-time form validation
    const errors: string[] = [];
    
    // Validate all paths in the shape
    this.validateObjectRecursively(shape as unknown as Record<string, unknown>, '', errors);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation using shared validator
   * Returns validation result with applied defaults
   */
  validateShapeComprehensive(shape: ShapeDefinition): {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    validatedShape?: ShapeDefinition;
    appliedDefaults?: string[];
  } {
    const validationResult = ShapeValidator.validateWithDefaults(shape);
    
    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      validatedShape: validationResult.validatedShape,
      appliedDefaults: validationResult.appliedDefaults,
    };
  }

  private validateObjectRecursively(obj: Record<string, unknown>, basePath: string, errors: string[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.validateObjectRecursively(value as Record<string, unknown>, fullPath, errors);
      } else {
        const result = this.validateProperty(fullPath, value);
        if (!result.isValid && result.error) {
          errors.push(`${fullPath}: ${result.error}`);
        }
      }
    }
  }

  getValidationRule(path: string): PropertyValidationRule | undefined {
    return this.validationSchema[path];
  }

  getCurrentShape(): ShapeDefinition | null {
    return this.currentShape;
  }
}