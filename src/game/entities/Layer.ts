import { Layer as ILayer, Rectangle } from '@/types/game';
import { Shape } from '@/game/entities/Shape';
import { GAME_CONFIG, SHAPE_TINTS } from '@/game/utils/Constants';

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
  public fadeDuration: number = 750; // 0.75 seconds in milliseconds
  public clearingStartTime: number = 0; // When layer clearing started
  public clearingDelay: number = 3000; // 3 seconds delay for shapes to fall

  constructor(id: string, index: number, depthIndex: number, physicsLayerGroup: number, colorIndex: number, startFadeIn: boolean = false) {
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
      y: 158, 
      width: GAME_CONFIG.canvas.width - 20,
      height: GAME_CONFIG.canvas.height - 158 - 10,
    };
    
    if (startFadeIn) {
      this.startFadeIn();
    } else {
      this.fadeOpacity = 1; // Fully visible by default
    }
  }

  public startFadeIn(): void {
    this.fadeOpacity = 0;
    this.fadeStartTime = Date.now();
  }

  public updateFadeAnimation(): void {
    if (this.fadeOpacity >= 1) return;
    
    const elapsed = Date.now() - this.fadeStartTime;
    const progress = Math.min(elapsed / this.fadeDuration, 1);
    
    // Ease-in-out animation
    this.fadeOpacity = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
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
    
    // Update bounds to match new index - all layers share the same playable area
    // Note: Bounds will be updated by GameManager with actual virtual dimensions
    this.bounds = {
      x: 10, // Minimal margin from left
      y: 158, // 5px gap below holding holes (141 + 12 + 5 = 158)
      width: GAME_CONFIG.canvas.width - 20, // Will be updated by GameManager with virtual dimensions
      height: GAME_CONFIG.canvas.height - 158 - 10, // Will be updated by GameManager with virtual dimensions
    };
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

  public isCleared(): boolean {
    // Layer is cleared if it's completely empty
    if (this.isEmpty()) {
      return true;
    }
    
    // If there are no shapes with screws, start the clearing timer
    if (!this.hasShapesWithScrews()) {
      if (this.clearingStartTime === 0) {
        this.clearingStartTime = Date.now();
        console.log(`Layer ${this.id} has no shapes with screws, starting clearing timer`);
        return false; // Not cleared yet, allow shapes to fall
      }
      
      // Check if enough time has passed for shapes to fall out of view
      const elapsed = Date.now() - this.clearingStartTime;
      if (elapsed >= this.clearingDelay) {
        console.log(`Layer ${this.id} clearing delay expired, layer can be cleared`);
        return true;
      }
      
      return false; // Still waiting for shapes to fall
    }
    
    // Reset clearing timer if screws are added back somehow
    this.clearingStartTime = 0;
    return false;
  }

  public updateVisibility(maxVisibleLayers: number, currentLayerIndex: number): void {
    this.isVisible = this.index >= currentLayerIndex && 
                     this.index < currentLayerIndex + maxVisibleLayers;
  }

  public setGenerated(generated: boolean): void {
    this.isGenerated = generated;
  }

  public getBounds(): Rectangle {
    return { ...this.bounds };
  }

  public updateBounds(newBounds: Rectangle): void {
    const oldBounds = { ...this.bounds };
    this.bounds = { ...newBounds };
    console.log(`Layer ${this.id} bounds updated from (${oldBounds.x}, ${oldBounds.y}, ${oldBounds.width.toFixed(0)}, ${oldBounds.height.toFixed(0)}) to (${this.bounds.x}, ${this.bounds.y}, ${this.bounds.width.toFixed(0)}, ${this.bounds.height.toFixed(0)})`);
    
    // If bounds changed significantly, redistribute existing shapes to use the new space
    const heightChanged = Math.abs(newBounds.height - oldBounds.height) > 50;
    const widthChanged = Math.abs(newBounds.width - oldBounds.width) > 50;
    
    if ((heightChanged || widthChanged) && this.shapes.length > 0) {
      console.log(`Layer ${this.id} bounds changed significantly, redistributing ${this.shapes.length} shapes`);
      this.redistributeShapes();
    }
  }

  private redistributeShapes(): void {
    // Redistribute existing shapes to better use the new bounds
    const margin = 50;
    const usableWidth = Math.max(100, this.bounds.width - 2 * margin);
    const usableHeight = Math.max(100, this.bounds.height - 2 * margin);
    
    this.shapes.forEach((shape) => {
      // Generate new random position within the new bounds
      const newPosition = {
        x: this.bounds.x + margin + Math.random() * usableWidth,
        y: this.bounds.y + margin + Math.random() * usableHeight,
      };
      
      console.log(`Redistributing shape ${shape.id} from (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)}) to (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)})`);
      
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

  // Serialization methods for save/load
  public toSerializable(): import('@/types/game').SerializableLayer {
    return {
      id: this.id,
      index: this.index,
      depthIndex: this.depthIndex,
      physicsLayerGroup: this.physicsLayerGroup,
      colorIndex: this.colorIndex,
      shapes: this.shapes.map(shape => shape.toSerializable()),
      tint: this.tint,
      isVisible: this.isVisible,
      isGenerated: this.isGenerated,
      bounds: { ...this.bounds },
      fadeOpacity: this.fadeOpacity,
      fadeDirection: this.fadeOpacity < 1 ? 1 : 0, // Estimate fade direction
      fadeSpeed: 1000 / this.fadeDuration, // Convert duration to speed
    };
  }

  public fromSerializable(
    data: import('@/types/game').SerializableLayer,
    physicsWorld: import('@/game/physics/PhysicsWorld').PhysicsWorld,
    screwManager: import('@/game/systems/ScrewManager').ScrewManager
  ): void {
    // Restore basic properties
    this.fadeOpacity = data.fadeOpacity;
    this.isVisible = data.isVisible;
    this.isGenerated = data.isGenerated;
    
    // Don't restore saved bounds - keep the current bounds that were updated for mobile
    // The bounds should already be correctly set by updateLayerBoundsForScale()
    console.log(`Layer ${this.id} keeping current bounds (${this.bounds.x}, ${this.bounds.y}, ${this.bounds.width.toFixed(0)}, ${this.bounds.height.toFixed(0)}) instead of saved bounds (${data.bounds.x}, ${data.bounds.y}, ${data.bounds.width.toFixed(0)}, ${data.bounds.height.toFixed(0)})`);
    
    // Recreate shapes
    this.shapes = [];
    if (data.shapes) {
      console.log(`Restoring ${data.shapes.length} shapes for layer ${this.id}`);
      data.shapes.forEach((shapeData, index) => {
        console.log(`Restoring shape ${index}:`, {
          id: shapeData?.id,
          type: shapeData?.type,
          hasPosition: !!shapeData?.position,
          hasBodyPosition: !!shapeData?.bodyPosition
        });
        
        if (!shapeData) {
          console.error(`Shape data at index ${index} is undefined`);
          return;
        }
        
        // Create a temporary body that will be replaced in fromSerializable
        const { Bodies } = require('matter-js'); // eslint-disable-line @typescript-eslint/no-require-imports
        const tempPosition = shapeData.position || shapeData.bodyPosition || { x: 0, y: 0 };
        const tempBody = Bodies.rectangle(tempPosition.x, tempPosition.y, 100, 60);
        
        const shape = new Shape(
          shapeData.id || `shape-${index}`,
          shapeData.type || 'rectangle',
          tempPosition,
          tempBody,
          this.id,
          shapeData.color || '#000000',
          shapeData.tint || '#000000',
          {
            width: shapeData.width,
            height: shapeData.height,
            radius: shapeData.radius,
            vertices: shapeData.vertices
          }
        );
        
        // Restore shape from serialized data (this will replace the temp body)
        shape.fromSerializable(shapeData, physicsWorld, screwManager);
        
        // Check if shape is within current layer bounds and reposition if needed
        const shapeBounds = shape.getBounds();
        const shapeOutOfBounds = (
          shapeBounds.x < this.bounds.x ||
          shapeBounds.x + shapeBounds.width > this.bounds.x + this.bounds.width ||
          shapeBounds.y < this.bounds.y ||
          shapeBounds.y + shapeBounds.height > this.bounds.y + this.bounds.height
        );
        
        if (shapeOutOfBounds) {
          // Reposition shape within current bounds
          const margin = 50;
          const newX = Math.max(this.bounds.x + margin, Math.min(this.bounds.x + this.bounds.width - margin, shape.position.x));
          const newY = Math.max(this.bounds.y + margin, Math.min(this.bounds.y + this.bounds.height - margin, shape.position.y));
          
          console.log(`Repositioning shape ${shape.id} from (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)}) to (${newX.toFixed(1)}, ${newY.toFixed(1)}) to fit in current bounds`);
          
          // Update physics body position and sync shape position
          const { Body } = require('matter-js'); // eslint-disable-line @typescript-eslint/no-require-imports
          Body.setPosition(shape.body, { x: newX, y: newY });
          shape.updateFromBody();
        }
        
        // Add to layer
        this.shapes.push(shape);
      });
    }
  }
}