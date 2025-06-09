import { Layer as ILayer, Rectangle } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import {GAME_CONFIG, SHAPE_TINTS, LAYOUT_CONSTANTS, DEBUG_CONFIG} from '@/shared/utils/Constants';

export class Layer implements ILayer {
  public id: string;
  public index: number;
  public depthIndex: number; // New layers get higher depth (render behind)
  public physicsLayerGroup: number; // Physics separation
  public colorIndex: number; // Fixed color index for this layer
  public shapes: Shape[] = [];
  public tint: string;
  public isVisible: boolean;
  public isGenerated: boolean;
  public bounds: Rectangle;
  public fadeOpacity: number = 0; // For fade-in animation
  public fadeStartTime: number = 0;
  public fadeDuration: number = 1000; // 1 second in milliseconds
  public clearingStartTime: number = 0; // When layer clearing started
  public clearingDelay: number = 3000; // 3 seconds delay for shapes to fall

  constructor(id: string, index: number, depthIndex: number, physicsLayerGroup: number, colorIndex: number, startFadeIn: boolean = false, isRestored: boolean = false) {
    this.id = id;
    this.index = index;
    this.depthIndex = depthIndex;
    this.physicsLayerGroup = physicsLayerGroup;
    this.colorIndex = colorIndex;
    this.tint = SHAPE_TINTS[colorIndex % SHAPE_TINTS.length];
    this.isVisible = index < GAME_CONFIG.layer.maxVisible;
    this.isGenerated = false;
    // Initialize with minimal bounds - will be updated by GameManager immediately
    this.bounds = {
      x: 10, 
      y: LAYOUT_CONSTANTS.shapeArea.startY,
      width: GAME_CONFIG.canvas.width - 20,
      height: GAME_CONFIG.canvas.height - LAYOUT_CONSTANTS.shapeArea.startY - 10
    };

    if (isRestored) {
      // Restored layers are always fully visible and never fade
      this.fadeOpacity = 1.0;
      this.fadeStartTime = 0;
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`Layer ${this.id} created as restored - no fade-in`);
      }
    } else if (startFadeIn) {
      // Layer will fade in when made visible - start with opacity 0
      this.fadeOpacity = 0;
      this.fadeStartTime = 0;
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`Layer ${this.id} created with fade-in capability - fadeOpacity set to 0`);
      }
    } else {
      this.fadeOpacity = 1; // Fully visible by default
    }
  }

  public startFadeIn(): void {
    this.fadeOpacity = 0;
    this.fadeStartTime = Date.now();
  }

  public updateFadeAnimation(): void {
    // Never fade restored layers or layers that are already fully visible
    if (this.fadeOpacity >= 1 || this.fadeStartTime === 0) {
      return;
    }

    const elapsed = Date.now() - this.fadeStartTime;
    const progress = Math.min(elapsed / this.fadeDuration, 1);

    // Ease-in-out animation
    this.fadeOpacity = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`Layer ${this.id} fade animation: opacity=${this.fadeOpacity.toFixed(2)}, progress=${progress.toFixed(2)}`);
    }
  }

  public getFadeOpacity(): number {
    return this.fadeOpacity;
  }

  public updateIndex(newIndex: number, newDepthIndex?: number, newPhysicsLayerGroup?: number): void {
    this.index = newIndex;
    if (newDepthIndex !== undefined) {
      this.depthIndex = newDepthIndex;
    }
    if (newPhysicsLayerGroup !== undefined) {
      this.physicsLayerGroup = newPhysicsLayerGroup;
    }
    // Don't update tint - it should remain fixed based on colorIndex from creation
    this.isVisible = newIndex < GAME_CONFIG.layer.maxVisible;
  }

  public addShape(shape: Shape): void {
    this.shapes.push(shape);
  }

  public removeShape(shapeId: string): boolean {
    const index = this.shapes.findIndex(s => s.id === shapeId);
    if (index !== -1) {
      this.shapes.splice(index, 1);
      return true;
    }
    return false;
  }

  public getShape(shapeId: string): Shape | null {
    return this.shapes.find(s => s.id === shapeId) || null;
  }

  public getAllShapes(): Shape[] {
    return [...this.shapes];
  }

  public getShapeCount(): number {
    return this.shapes.length;
  }

  public isEmpty(): boolean {
    return this.shapes.length === 0;
  }

  public hasShapesWithScrews(): boolean {
    return this.shapes.some(shape => shape.hasAnyScrews());
  }

  /**
   * Make this layer visible with optional fade-in animation
   */
  public makeVisible(withFadeIn: boolean = true): void {
    if (!this.isVisible) {
      console.log(`[Layer ${this.id}] makeVisible called: withFadeIn=${withFadeIn}, current fadeOpacity=${this.fadeOpacity}`);
      this.isVisible = true;
      if (withFadeIn) {
        this.startFadeIn();
        console.log(`[Layer ${this.id}] Made visible with fade-in animation - fadeOpacity set to 0, fadeStartTime=${this.fadeStartTime}`);
      } else {
        this.fadeOpacity = 1.0;
        this.fadeStartTime = 0;
        console.log(`[Layer ${this.id}] Made visible immediately (no fade-in) - fadeOpacity set to 1.0`);
      }
    } else {
      console.log(`[Layer ${this.id}] makeVisible called but layer already visible (fadeOpacity=${this.fadeOpacity})`);
    }
  }

  /**
   * Hide this layer (disable physics and interactions)
   */
  public makeHidden(): void {
    this.isVisible = false;
    this.fadeOpacity = 0;
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`Layer ${this.id} made hidden`);
    }
  }

  public isCleared(): boolean {
    // Layer is cleared if it's completely empty
    if (this.isEmpty()) {
      return true;
    }

    // If there are no shapes with screws, start the clearing timer
    if (!this.hasShapesWithScrews()) {
      if (this.clearingStartTime === 0) {
        this.clearingStartTime = Date.now();
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`Layer ${this.id} has no shapes with screws, starting clearing timer`);
        }
        return false; // Not cleared yet, allow shapes to fall
      }

      // Check if enough time has passed for shapes to fall out of view
      const elapsed = Date.now() - this.clearingStartTime;
      if (elapsed >= this.clearingDelay) {
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`Layer ${this.id} clearing delay expired, layer can be cleared`);
        }
        return true;
      }

      return false; // Still waiting for shapes to fall
    }

    // Reset clearing timer if screws are added back somehow
    this.clearingStartTime = 0;
    return false;
  }

  public updateVisibility(maxVisibleLayers: number, currentLayerIndex: number): void {
    const wasVisible = this.isVisible;
    this.isVisible = this.index >= currentLayerIndex && 
                     this.index < currentLayerIndex + maxVisibleLayers;
    
    // Debug logging for visibility changes
    if (DEBUG_CONFIG.logLayerDebug || this.isVisible !== wasVisible) {
      console.log(`[Layer ${this.id}] updateVisibility: wasVisible=${wasVisible}, isVisible=${this.isVisible}, fadeOpacity=${this.fadeOpacity}, index=${this.index}, maxVisible=${maxVisibleLayers}, currentIndex=${currentLayerIndex}`);
    }
    
    // If layer became visible through updateVisibility AND it was previously set as hidden
    // (i.e., it has fadeOpacity = 0), start fade-in animation
    if (this.isVisible && !wasVisible && this.fadeOpacity === 0) {
      console.log(`[Layer ${this.id}] Starting fade-in animation: wasVisible=${wasVisible} → isVisible=${this.isVisible}, fadeOpacity=${this.fadeOpacity}`);
      this.startFadeIn();
    }
  }

  public setGenerated(generated: boolean): void {
    this.isGenerated = generated;
  }

  public getBounds(): Rectangle {
    return { ...this.bounds };
  }

  public updateBounds(newBounds: Rectangle, skipRedistribution: boolean = false): void {
    const oldBounds = { ...this.bounds };
    this.bounds = { ...newBounds };
    if (DEBUG_CONFIG.logLayerDebug) {
      console.log(`Layer ${this.id} bounds updated from (${oldBounds.x}, ${oldBounds.y}, ${oldBounds.width.toFixed(0)}, ${oldBounds.height.toFixed(0)}) to (${this.bounds.x}, ${this.bounds.y}, ${this.bounds.width.toFixed(0)}, ${this.bounds.height.toFixed(0)})`);
    }

    // If bounds changed significantly, redistribute existing shapes to use the new space
    // Skip redistribution if explicitly requested (e.g., during game restoration)
    if (!skipRedistribution) {
      const heightChanged = Math.abs(newBounds.height - oldBounds.height) > 50;
      const widthChanged = Math.abs(newBounds.width - oldBounds.width) > 50;

      if ((heightChanged || widthChanged) && this.shapes.length > 0) {
        if (DEBUG_CONFIG.logLayerDebug) {
          console.log(`Layer ${this.id} bounds changed significantly, redistributing ${this.shapes.length} shapes`);
        }
        this.redistributeShapes();
      }
    } else {
      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`Layer ${this.id} bounds updated without redistribution (restoration mode)`);
      }
    }
  }

  private redistributeShapes(): void {
    // Instead of randomly redistributing shapes, maintain their relative positions
    // within the bounds to prevent them from jumping around
    const margin = 50;
    const usableWidth = Math.max(100, this.bounds.width - 2 * margin);
    const usableHeight = Math.max(100, this.bounds.height - 2 * margin);

    // Get the bounds of all shapes to determine their current distribution
    const shapeBounds = this.shapes.map(shape => shape.getBounds());

    // Find the min/max coordinates of all shapes to determine their current distribution area
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapeBounds.forEach(bounds => {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    // Calculate the current distribution area
    const currentWidth = Math.max(1, maxX - minX);
    const currentHeight = Math.max(1, maxY - minY);

    this.shapes.forEach((shape, index) => {
      const bounds = shapeBounds[index];

      // Calculate the relative position of the shape within the current distribution area
      const relativeX = (bounds.x - minX) / currentWidth;
      const relativeY = (bounds.y - minY) / currentHeight;

      // Apply the same relative position to the new bounds
      const newPosition = {
        x: this.bounds.x + margin + relativeX * usableWidth,
        y: this.bounds.y + margin + relativeY * usableHeight,
      };

      if (DEBUG_CONFIG.logLayerDebug) {
        console.log(`Redistributing shape ${shape.id} from (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)}) to (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)}) - maintaining relative position`);
      }

      // Update physics body position
      const { Body } = require('matter-js'); // eslint-disable-line @typescript-eslint/no-require-imports
      Body.setPosition(shape.body, newPosition);
      shape.updateFromBody();
    });
  }

  public updateShapePositions(): void {
    this.shapes.forEach(shape => {
      shape.updateFromBody();
    });
  }

  public getShapesInBounds(bounds: Rectangle): Shape[] {
    return this.shapes.filter(shape => {
      const shapeBounds = shape.getBounds();
      return (
        shapeBounds.x < bounds.x + bounds.width &&
        shapeBounds.x + shapeBounds.width > bounds.x &&
        shapeBounds.y < bounds.y + bounds.height &&
        shapeBounds.y + shapeBounds.height > bounds.y
      );
    });
  }

  public getShapeAtPoint(point: { x: number; y: number }): Shape | null {
    // Check shapes in reverse order (front to back)
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      const bounds = shape.getBounds();

      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        return shape;
      }
    }

    return null;
  }

  public dispose(): void {
    this.shapes.forEach(shape => {
      shape.dispose();
    });
    this.shapes = [];
    this.clearingStartTime = 0; // Reset clearing timer
  }
}
