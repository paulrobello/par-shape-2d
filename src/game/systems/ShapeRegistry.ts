import { ShapeDefinition } from '@/types/shapes';
import { ShapeLoader } from './ShapeLoader';
import { SHAPE_CONFIG } from '@/game/utils/Constants';

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
      console.log(`Loaded ${this.definitions.size} shape definitions`);
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
    
    // Map old shape type names to new definition IDs
    const shapeTypeMapping: Record<string, string> = {
      'rectangle': 'rectangle',
      'square': 'square',
      'circle': 'circle',
      'polygon': 'polygon', // This will need special handling
      'capsule': 'capsule',
      'arrow': 'arrow',
      'chevron': 'chevron',
      'star': 'star',
      'horseshoe': 'horseshoe',
    };
    
    // Get enabled shapes based on SHAPE_CONFIG
    for (const [configKey, enabled] of Object.entries(SHAPE_CONFIG.enabledShapes)) {
      if (!enabled) continue;
      
      if (configKey === 'polygon') {
        // For polygon, add all polygon shapes
        const polygonShapes = ['triangle', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
        for (const polygonId of polygonShapes) {
          const definition = this.definitions.get(polygonId);
          if (definition) {
            enabledShapes.push(definition);
          }
        }
      } else {
        // For other shapes, use direct mapping
        const shapeId = shapeTypeMapping[configKey];
        if (shapeId) {
          const definition = this.definitions.get(shapeId);
          if (definition) {
            enabledShapes.push(definition);
          }
        }
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