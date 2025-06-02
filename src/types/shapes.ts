import { Vector2 } from './game';

export interface ShapeDefinition {
  // Shape identification
  id: string;
  name: string;
  category: 'basic' | 'polygon' | 'path' | 'composite';
  
  // Shape properties
  dimensions: {
    type: 'fixed' | 'random';
    // For basic shapes
    width?: { min: number; max: number } | number;
    height?: { min: number; max: number } | number;
    radius?: { min: number; max: number } | number;
    aspectRatio?: { min: number; max: number };
    
    // For polygons
    sides?: number;
    
    // For path shapes
    path?: string;
    scale?: { min: number; max: number };
    
    // For size reduction during retries
    reductionFactor?: number;
  };
  
  // Physics configuration
  physics: {
    type: 'rectangle' | 'circle' | 'polygon' | 'fromVertices' | 'composite';
    // Physics-specific properties
    decomposition?: boolean;
    composite?: {
      parts: Array<{
        type: 'rectangle' | 'circle';
        position: { x: number; y: number };
        dimensions: { width?: number; height?: number; radius?: number };
      }>;
    };
  };
  
  // Rendering configuration
  rendering: {
    type: 'primitive' | 'path' | 'composite';
    // For path rendering
    preserveOriginalVertices?: boolean;
    
    // For composite rendering
    compositeParts?: Array<{
      type: 'rectangle' | 'circle' | 'arc';
      position: { x: number; y: number };
      dimensions: Record<string, unknown>;
    }>;
  };
  
  // Screw placement configuration
  screwPlacement: {
    strategy: 'corners' | 'perimeter' | 'grid' | 'custom' | 'capsule';
    
    // For corners strategy
    cornerMargin?: number;
    
    // For perimeter strategy
    perimeterPoints?: number;
    perimeterMargin?: number;
    
    // For grid strategy
    gridSpacing?: number;
    
    // For custom strategy
    customPositions?: Array<{
      position: { x: number; y: number };
      priority: number;
    }>;
    
    // For capsule strategy
    capsuleEndMargin?: number;
    
    // General constraints
    minSeparation?: number;
    maxScrews?: {
      byArea?: Array<{
        maxArea: number;
        screwCount: number;
      }>;
      absolute?: number;
    };
  };
  
  // Visual properties
  visual: {
    borderWidth?: number;
    alpha?: number;
    supportsHoles?: boolean;
  };
  
  // Behavior flags
  behavior: {
    allowSingleScrew?: boolean;
    singleScrewDynamic?: boolean;
    rotationalInertiaMultiplier?: number;
  };
}

export interface LoadedShapeDefinitions {
  [shapeId: string]: ShapeDefinition;
}

export interface ShapeDimensions {
  width?: number;
  height?: number;
  radius?: number;
  sides?: number;
  path?: string;
  scale?: number;
  originalVertices?: Vector2[];
}