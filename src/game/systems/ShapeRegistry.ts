import { ShapeDefinition } from '@/types/shapes';
import { ShapeLoader } from './ShapeLoader';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export class ShapeRegistry {
  private static instance: ShapeRegistry | null = null;
  private definitions: Map<string, ShapeDefinition> = new Map();
  private initialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): ShapeRegistry {
    if (!ShapeRegistry.instance) {
      ShapeRegistry.instance = new ShapeRegistry();
    }
    return ShapeRegistry.instance;
  }
  
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      const loadedDefinitions = await ShapeLoader.loadShapeDefinitions();
      
      // Store all definitions
      for (const [id, definition] of Object.entries(loadedDefinitions)) {
        this.definitions.set(id, definition);
      }
      
      this.initialized = true;
      if (DEBUG_CONFIG.logSystemLifecycle) {
        console.log(`Loaded ${this.definitions.size} shape definitions`);
      }
    } catch (error) {
      console.error('Failed to initialize ShapeRegistry:', error);
      throw error;
    }
  }
  
  public getDefinition(shapeId: string): ShapeDefinition | undefined {
    if (!this.initialized) {
      throw new Error('ShapeRegistry not initialized');
    }
    return this.definitions.get(shapeId);
  }
  
  public getEnabledShapes(): ShapeDefinition[] {
    if (!this.initialized) {
      throw new Error('ShapeRegistry not initialized');
    }
    
    const enabledShapes: ShapeDefinition[] = [];
    
    // Get enabled shapes based on the enabled field in each JSON definition
    for (const definition of this.definitions.values()) {
      if (definition.enabled) {
        enabledShapes.push(definition);
      }
    }
    
    // If no shapes are enabled, default to circle
    if (enabledShapes.length === 0) {
      const circleDefinition = this.definitions.get('circle');
      if (circleDefinition) {
        enabledShapes.push(circleDefinition);
      }
    }
    
    return enabledShapes;
  }
  
  public getAllDefinitions(): ShapeDefinition[] {
    if (!this.initialized) {
      throw new Error('ShapeRegistry not initialized');
    }
    return Array.from(this.definitions.values());
  }
  
  public isInitialized(): boolean {
    return this.initialized;
  }
}