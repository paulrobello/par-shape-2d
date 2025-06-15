import { Body, Constraint } from 'matter-js';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ShapeType = 'rectangle' | 'circle' | 'polygon' | 'capsule' | 'arrow' | 'chevron' | 'star' | 'horseshoe';

export type ScrewColor = 'pink' | 'red' | 'green' | 'blue' | 'lightBlue' | 'yellow' | 'purple' | 'orange' | 'brown';

export interface GameState {
  currentLevel: number;
  levelScore: number;
  totalScore: number;
  gameStarted: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  shapesRemovedThisLevel?: number; // Track shapes removed for progress calculation
}

export interface Shape {
  id: string;
  type: ShapeType;
  definitionId: string; // Store the original definition ID for strategy lookup
  position: Vector2;
  rotation: number;
  width?: number;
  height?: number;
  radius?: number;
  sides?: number; // Number of sides for polygon shapes (3-8, including 4 for square/rectangle)
  vertices?: Vector2[];
  body: Body;
  screws: Screw[];
  layerId: string;
  color: string;
  tint: string;
  isComposite?: boolean; // Flag to indicate if shape is made of multiple bodies
  parts?: Body[]; // Additional bodies for composite shapes
}

export interface Screw {
  id: string;
  shapeId: string;
  position: Vector2;
  color: ScrewColor;
  constraint: Constraint | null;
  isRemovable: boolean;
  isCollected: boolean;
  isInContainer: boolean; // Whether screw is placed in container but not yet collected
  isBeingCollected: boolean; // Whether screw is currently animating to target
  collectionProgress: number; // 0-1 for animation
  targetPosition?: Vector2; // For collection animation
  targetContainerId?: string; // Which container this screw is flying to
  
  // Ownership tracking
  owner: string; // ID of current owner
  ownerType: 'shape' | 'container' | 'holding_hole';
  
  // Transfer animation properties (holding hole to container)
  isBeingTransferred: boolean;
  transferProgress: number; // 0-1 for transfer animation
  transferStartPosition?: Vector2; // Position when transfer started
  transferTargetPosition?: Vector2; // Target position for transfer
  transferFromHoleIndex?: number; // Which holding hole index
  transferToContainerIndex?: number; // Which container index
  transferToHoleIndex?: number; // Which hole index in container
  
  // Shake animation properties (for blocked screws)
  isShaking: boolean;
  shakeProgress: number; // 0-1 for shake animation
  shakeOffset: Vector2; // Current shake offset

  // Direct positioning properties
  localOffset?: Vector2; // Local offset from shape center for direct positioning
  anchorBody?: Body; // Physics anchor body for constraint

  // Position synchronization methods
  updateFromAnchorBody(): void;
  updateFromShapeBody(shapeBody: Body): void;
  setLocalOffset(shapeBody: Body): void;
  
  // Ownership methods
  transferOwnership(newOwner: string, newOwnerType: 'shape' | 'container' | 'holding_hole'): void;
  canBeDeletedBy(requesterId: string): boolean;
  getOwnerInfo(): { owner: string; ownerType: 'shape' | 'container' | 'holding_hole' };
  
  // Cleanup method
  dispose(): void;
}

export interface Container {
  id: string;
  color: ScrewColor;
  position: Vector2;
  holes: (string | null)[]; // Screw IDs in holes - get actual screws from ScrewManager
  reservedHoles: (string | null)[]; // Screw IDs that have reserved holes but haven't arrived yet
  maxHoles: number;
  isFull: boolean;
  isMarkedForRemoval?: boolean;
  removalTimer?: number;
  
  // Fade animation properties
  fadeOpacity: number; // 0-1 for fade animation
  fadeStartTime: number; // When fade animation started
  fadeDuration: number; // Duration of fade in milliseconds (500ms)
  isFadingOut: boolean; // Whether container is fading out
  isFadingIn: boolean; // Whether container is fading in
}

export interface HoldingHole {
  id: string;
  position: Vector2;
  screwId: string | null; // ID of screw in this hole - get actual screw from ScrewManager
  screwColor?: ScrewColor; // Color of screw in this hole for container generation
  reservedBy?: string; // Screw ID that has reserved this hole
}

export interface Layer {
  id: string;
  index: number;
  depthIndex: number; // For depth-based rendering
  physicsLayerGroup: number; // For physics separation
  colorIndex: number; // Fixed color index for this layer
  shapes: Shape[];
  tint: string;
  isVisible: boolean;
  isGenerated: boolean;
  bounds: Rectangle;
}

export interface Level {
  number: number;
  totalLayers: number;
  layersGenerated: number;
  layers: Layer[];
}

export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  layer: {
    width: number;
    height: number;
    maxVisible: number;
  };
  shapes: {
    minPerLayer: number;
    maxPerLayer: number;
    minScrews: number;
    maxScrews: number;
  };
  containers: {
    count: number;
    maxHoles: number;
  };
  holdingHoles: {
    count: number;
  };
  physics: {
    gravity: Vector2;
    timestep: number;
  };
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  debugMode: boolean;
  holes?: Array<{ x: number; y: number; radius: number }>;
}

// Serializable versions for save/load (without Matter.js objects)
export interface SerializableShape {
  id: string;
  type: ShapeType;
  position: Vector2;
  rotation: number;
  width?: number;
  height?: number;
  radius?: number;
  sides?: number;
  vertices?: Vector2[];
  screws: SerializableScrew[];
  holes: Vector2[]; // Positions where screws were removed
  layerId: string;
  color: string;
  tint: string;
  // Physics body properties for recreation
  bodyPosition: Vector2;
  bodyAngle: number;
  bodyVelocity: Vector2;
  bodyAngularVelocity: number;
  isStatic: boolean;
  isSleeping: boolean;
  // Physics material properties
  friction: number;
  frictionAir: number;
  restitution: number;
  density: number;
  // Collision filter properties
  collisionGroup: number;
  collisionCategory: number;
  collisionMask: number;
  // Body identification
  bodyLabel: string;
}

export interface SerializableScrew {
  id: string;
  shapeId: string;
  position: Vector2;
  relativeOffset?: Vector2; // Position relative to parent shape center
  color: ScrewColor;
  isRemovable: boolean;
  isCollected: boolean;
  isBeingCollected: boolean;
  targetContainerId?: string;
  // Animation state for recreation
  animationTarget?: Vector2;
  animationProgress?: number;
}

export interface SerializableLayer {
  id: string;
  index: number;
  depthIndex: number;
  physicsLayerGroup: number;
  colorIndex: number;
  shapes: SerializableShape[];
  tint: string;
  isVisible: boolean;
  isGenerated: boolean;
  bounds: Rectangle;
  // Additional state for recreation
  fadeOpacity: number;
  fadeDirection: number;
  fadeSpeed: number;
}

export interface SerializableLayerManagerState {
  layers: SerializableLayer[];
  layerCounter: number;
  depthCounter: number;
  physicsGroupCounter: number;
  colorCounter: number;
  totalLayersForLevel: number;
  layersGeneratedThisLevel: number;
}

export interface FullGameSave {
  gameState: GameState;
  level: Level;
  containers: Container[];
  holdingHoles: HoldingHole[];
  layerManagerState: SerializableLayerManagerState;
  screwManagerState: {
    animatingScrews: SerializableScrew[];
  };
}