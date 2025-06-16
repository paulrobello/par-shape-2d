import { Constraint, Body } from 'matter-js';
import { Screw as IScrew, ScrewColor, Vector2 } from '@/types/game';
import { UI_CONSTANTS, DEBUG_CONFIG } from '@/shared/utils/Constants';
import { applyEasing, EasingPresets } from '@/shared/utils/EasingFunctions';

/**
 * Represents a screw entity in the physics puzzle game with ownership tracking and animation management.
 * 
 * Screws are the core interactive elements that players remove from shapes to progress through levels.
 * Each screw has a clear ownership model (shape → container/holding_hole) and supports multiple
 * animation states for smooth gameplay interactions.
 * 
 * Key features:
 * - Ownership transfer system preventing race conditions
 * - Physics constraint management for shape attachment
 * - Collection and transfer animations
 * - Shake animation for blocked interactions
 * - Comprehensive state tracking for game logic
 * 
 * @example
 * ```typescript
 * const screw = new Screw('screw-1', 'shape-1', {x: 100, y: 100}, 'red');
 * screw.setConstraint(physicsConstraint);
 * screw.transferOwnership('container-1', 'container');
 * ```
 */
export class Screw implements IScrew {
  public id: string;
  public shapeId: string;
  public position: Vector2;
  public color: ScrewColor;
  public constraint: Constraint | null = null;
  public isRemovable: boolean = true;
  public isCollected: boolean = false;
  public isInContainer: boolean = false; // True when placed in container but not yet collected

  // Ownership tracking
  public owner: string; // ID of current owner
  public ownerType: 'shape' | 'container' | 'holding_hole';

  // Additional properties for screw management
  public isBeingCollected: boolean = false;
  public collectionProgress: number = 0; // 0-1 for animation
  public targetPosition?: Vector2; // For collection animation
  public animationStartPosition?: Vector2; // Original position when animation started
  public targetContainerId?: string; // Which container this screw is flying to
  public targetHoleIndex?: number; // Which hole index in the container
  public targetType?: 'container' | 'holding_hole'; // Type of destination
  public anchorBody?: Body; // Physics anchor body for constraint
  public localOffset?: Vector2; // Local offset from shape center for direct positioning

  // Transfer animation properties (holding hole to container)
  public isBeingTransferred: boolean = false;
  public transferProgress: number = 0; // 0-1 for transfer animation
  public transferStartPosition?: Vector2; // Position when transfer started
  public transferTargetPosition?: Vector2; // Target position for transfer
  public transferFromHoleIndex?: number; // Which holding hole index
  public transferToContainerIndex?: number; // Which container index
  public transferToHoleIndex?: number; // Which hole index in container

  // Shake animation properties (for blocked screws)
  public isShaking: boolean = false;
  public shakeProgress: number = 0; // 0-1 for shake animation
  public shakeOffset: Vector2 = { x: 0, y: 0 }; // Current shake offset

  // Rotation animation properties (for spinning effects)
  public rotation: number = 0; // Current rotation in radians
  public rotationVelocity: number = 0; // Current rotation velocity in radians/second
  public isSpinning: boolean = false; // Whether the screw is currently spinning

  // Debug throttling for position updates
  private lastPositionLogTime: number = 0;

  constructor(
    id: string,
    shapeId: string,
    position: Vector2,
    color: ScrewColor
  ) {
    this.id = id;
    this.shapeId = shapeId;
    this.position = { ...position };
    this.color = color;
    
    // Set initial ownership to the shape
    this.owner = shapeId;
    this.ownerType = 'shape';
  }

  /**
   * Sets the physics constraint that attaches this screw to a shape.
   * 
   * @param constraint - The Matter.js constraint object for physics attachment
   */
  public setConstraint(constraint: Constraint): void {
    this.constraint = constraint;
  }

  /**
   * Transfers ownership of this screw to a new owner to prevent race conditions.
   * 
   * This is a critical part of the ownership system that ensures data integrity
   * by establishing clear ownership chains: shape → container/holding_hole.
   * Only the current owner can delete or modify the screw's state.
   * 
   * @param newOwner - The ID of the new owner (shape, container, or holding hole ID)
   * @param newOwnerType - The type of the new owner
   */
  public transferOwnership(newOwner: string, newOwnerType: 'shape' | 'container' | 'holding_hole'): void {
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔄 Ownership Transfer: Screw ${this.id} from ${this.ownerType} ${this.owner} to ${newOwnerType} ${newOwner}`);
    }
    this.owner = newOwner;
    this.ownerType = newOwnerType;
  }

  /**
   * Checks if this screw can be deleted by the specified owner.
   * 
   * This is a key part of the ownership system that prevents unauthorized
   * deletion and ensures data integrity during shape destruction.
   * 
   * @param requesterId - The ID of the entity requesting deletion
   * @returns True if the requester is the current owner, false otherwise
   */
  public canBeDeletedBy(requesterId: string): boolean {
    return this.owner === requesterId;
  }

  /**
   * Gets the current owner information for debugging and validation purposes.
   * 
   * @returns Object containing the current owner ID and owner type
   */
  public getOwnerInfo(): { owner: string; ownerType: 'shape' | 'container' | 'holding_hole' } {
    return {
      owner: this.owner,
      ownerType: this.ownerType
    };
  }

  /**
   * Removes the physics constraint, allowing the screw to detach from its shape.
   */
  public removeConstraint(): void {
    this.constraint = null;
  }

  /**
   * Checks if this screw has an active physics constraint.
   * 
   * @returns True if the screw has a constraint, false otherwise
   */
  public hasConstraint(): boolean {
    return this.constraint !== null;
  }

  /**
   * Sets whether this screw can be removed by the player.
   * 
   * @param removable - True if the screw can be removed, false if blocked
   */
  public setRemovable(removable: boolean): void {
    this.isRemovable = removable;
  }

  /**
   * Marks the screw as placed in a container but not yet collected.
   */
  public placeInContainer(): void {
    if (this.isCollected || this.isInContainer) return;
    
    this.isInContainer = true;
    this.isRemovable = false;
    this.isBeingCollected = false; // No longer being collected since it's placed
    this.removeConstraint();
  }

  public collect(): void {
    if (this.isCollected) return;
    
    this.isCollected = true;
    this.isInContainer = false; // No longer in container, now truly collected
    this.isRemovable = false;
    this.removeConstraint();
  }

  public startCollection(targetPosition: Vector2): void {
    if (this.isBeingCollected || this.isCollected) return;
    
    this.isBeingCollected = true;
    this.targetPosition = { ...targetPosition };
    this.animationStartPosition = { ...this.position }; // Save original position
    this.collectionProgress = 0;
    
    // Start spinning animation for collection
    this.isSpinning = true;
    this.rotationVelocity = Math.PI * 4; // 2 full rotations per second
  }

  public updateCollectionAnimation(deltaTime: number): boolean {
    if (!this.isBeingCollected || !this.targetPosition || !this.animationStartPosition) return false;

    // Animation duration in milliseconds
    const animationDuration = 800;
    const progressIncrement = deltaTime / animationDuration;
    
    this.collectionProgress = Math.min(1, this.collectionProgress + progressIncrement);

    // Update rotation animation if spinning - keep constant speed
    if (this.isSpinning) {
      const deltaTimeSeconds = deltaTime / 1000;
      this.rotation += this.rotationVelocity * deltaTimeSeconds;
      // Keep rotation velocity constant - no deceleration
    }

    // Update position based on animation progress
    if (this.collectionProgress < 1) {
      // Use smooth sine easing without overshoot - slow then fast then slow
      const easedProgress = applyEasing(this.collectionProgress, EasingPresets.game.collection);
      
      // Calculate current position between start and target using saved start position
      const startX = this.animationStartPosition.x;
      const startY = this.animationStartPosition.y;
      const targetX = this.targetPosition.x;
      const targetY = this.targetPosition.y;
      
      this.position.x = startX + (targetX - startX) * easedProgress;
      this.position.y = startY + (targetY - startY) * easedProgress;
      
      return false; // Animation not complete
    } else {
      // Animation complete
      this.position = { ...this.targetPosition };
      this.isBeingCollected = false;
      this.isSpinning = false;
      this.rotationVelocity = 0;
      // Don't call collect() here - let the ScrewManager handle final placement
      return true; // Animation complete
    }
  }

  public startTransfer(fromPosition: Vector2, toPosition: Vector2, fromHoleIndex?: number, toContainerIndex?: number, toHoleIndex?: number): void {
    if (this.isBeingTransferred || this.isBeingCollected) return;
    
    this.isBeingTransferred = true;
    this.transferStartPosition = { ...fromPosition };
    this.transferTargetPosition = { ...toPosition };
    this.transferProgress = 0;
    this.position = { ...fromPosition }; // Set current position to start position
    
    // Store transfer destination information
    this.transferFromHoleIndex = fromHoleIndex;
    this.transferToContainerIndex = toContainerIndex;
    this.transferToHoleIndex = toHoleIndex;
    
    // Start spinning animation for transfer (faster than collection)
    this.isSpinning = true;
    this.rotationVelocity = Math.PI * 6; // 3 full rotations per second
  }

  public updateTransferAnimation(deltaTime: number): boolean {
    if (!this.isBeingTransferred || !this.transferStartPosition || !this.transferTargetPosition) return false;

    // Animation duration in milliseconds
    const animationDuration = 600; // Slightly faster than collection animation
    const progressIncrement = deltaTime / animationDuration;
    
    const oldProgress = this.transferProgress;
    this.transferProgress = Math.min(1, this.transferProgress + progressIncrement);

    // Update rotation animation if spinning - keep constant speed
    if (this.isSpinning) {
      const deltaTimeSeconds = deltaTime / 1000;
      this.rotation += this.rotationVelocity * deltaTimeSeconds;
      // Keep rotation velocity constant - no deceleration
    }

    // Debug logging for transfer animation
    if (DEBUG_CONFIG.logScrewDebug && Math.abs(this.transferProgress - oldProgress) > 0.01) {
      console.log(`🎬 Transfer animation update for ${this.id}: progress ${oldProgress.toFixed(3)} → ${this.transferProgress.toFixed(3)}, rotation: ${(this.rotation * 180 / Math.PI).toFixed(1)}°`);
    }

    // Update position based on animation progress
    if (this.transferProgress < 1) {
      // Use smooth sine easing without overshoot - slow then fast then slow
      const easedProgress = applyEasing(this.transferProgress, EasingPresets.game.transfer);
      
      // Calculate current position between start and target
      const startX = this.transferStartPosition.x;
      const startY = this.transferStartPosition.y;
      const targetX = this.transferTargetPosition.x;
      const targetY = this.transferTargetPosition.y;
      
      const oldPosX = this.position.x;
      const oldPosY = this.position.y;
      this.position.x = startX + (targetX - startX) * easedProgress;
      this.position.y = startY + (targetY - startY) * easedProgress;
      
      // Debug position changes
      if (DEBUG_CONFIG.logScrewDebug && (Math.abs(this.position.x - oldPosX) > 1 || Math.abs(this.position.y - oldPosY) > 1)) {
        console.log(`📍 Transfer position update for ${this.id}: (${oldPosX.toFixed(1)}, ${oldPosY.toFixed(1)}) → (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`);
      }
      
      return false; // Animation not complete
    } else {
      // Animation complete
      this.position = { ...this.transferTargetPosition };
      this.isBeingTransferred = false;
      this.isSpinning = false;
      this.rotationVelocity = 0;
      return true; // Animation complete
    }
  }

  public startShake(): void {
    if (this.isShaking || this.isBeingCollected || this.isBeingTransferred) return;
    
    this.isShaking = true;
    this.shakeProgress = 0;
    this.shakeOffset = { x: 0, y: 0 };
  }

  public updateShakeAnimation(deltaTime: number): boolean {
    if (!this.isShaking) return false;

    // Animation duration in milliseconds
    const animationDuration = 300; // Quick shake animation
    const progressIncrement = deltaTime / animationDuration;
    
    this.shakeProgress = Math.min(1, this.shakeProgress + progressIncrement);

    // Calculate shake offset using sine wave for smooth oscillation
    if (this.shakeProgress < 1) {
      const frequency = 8; // How many shakes during the duration
      const amplitude = 3; // Maximum shake distance in pixels
      const fadeOut = 1 - this.shakeProgress; // Fade out the shake over time
      
      const shakeValue = Math.sin(this.shakeProgress * frequency * Math.PI * 2) * amplitude * fadeOut;
      
      // Alternate between horizontal and vertical shake
      if (Math.floor(this.shakeProgress * frequency) % 2 === 0) {
        this.shakeOffset.x = shakeValue;
        this.shakeOffset.y = 0;
      } else {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = shakeValue;
      }
      
      return false; // Animation not complete
    } else {
      // Animation complete
      this.isShaking = false;
      this.shakeOffset = { x: 0, y: 0 };
      return true; // Animation complete
    }
  }


  public getBounds(): { x: number; y: number; width: number; height: number } {
    const radius = UI_CONSTANTS.screws.radius;
    return {
      x: this.position.x - radius,
      y: this.position.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }

  public containsPoint(point: Vector2): boolean {
    const radius = UI_CONSTANTS.screws.radius;
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  public getDistance(point: Vector2): number {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update screw position directly from shape body using stored local offset
   * This is more reliable than anchor body positioning for composite shapes
   */
  public updateFromShapeBody(shapeBody: Body): void {
    if (!this.localOffset || this.isBeingCollected || this.isBeingTransferred) {
      return;
    }

    const oldPosition = { ...this.position };

    // Transform local offset to world coordinates using shape body position and rotation
    const cos = Math.cos(shapeBody.angle);
    const sin = Math.sin(shapeBody.angle);
    
    this.position.x = shapeBody.position.x + (this.localOffset.x * cos - this.localOffset.y * sin);
    this.position.y = shapeBody.position.y + (this.localOffset.x * sin + this.localOffset.y * cos);

    // DEBUG: Log when position updates occur (if debug enabled and throttled)
    if (DEBUG_CONFIG.logScrewPositionUpdates) {
      const moved = Math.abs(oldPosition.x - this.position.x) > 0.1 || Math.abs(oldPosition.y - this.position.y) > 0.1;
      if (moved) {
        const now = Date.now();
        if (now - this.lastPositionLogTime >= DEBUG_CONFIG.screwPositionThrottleMs) {
          console.log(`🔄 SCREW UPDATE: ${this.id} moved from (${oldPosition.x.toFixed(1)}, ${oldPosition.y.toFixed(1)}) to (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`);
          console.log(`   Shape body: (${shapeBody.position.x.toFixed(1)}, ${shapeBody.position.y.toFixed(1)}), angle: ${(shapeBody.angle * 180 / Math.PI).toFixed(1)}°`);
          this.lastPositionLogTime = now;
        }
      }
    }
  }

  /**
   * Set the local offset from shape center (called when screw is first placed)
   */
  public setLocalOffset(shapeBody: Body): void {
    // Calculate and store the local offset from shape center to screw position
    const worldOffsetX = this.position.x - shapeBody.position.x;
    const worldOffsetY = this.position.y - shapeBody.position.y;
    
    // Convert to local coordinates accounting for current rotation
    const angle = shapeBody.angle;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    
    this.localOffset = {
      x: worldOffsetX * cos - worldOffsetY * sin,
      y: worldOffsetX * sin + worldOffsetY * cos
    };
    
    if (DEBUG_CONFIG.logScrewDebug) {
      console.log(`🔩 Screw ${this.id} setLocalOffset:`);
      console.log(`   Screw position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`);
      console.log(`   Shape body: (${shapeBody.position.x.toFixed(1)}, ${shapeBody.position.y.toFixed(1)}), angle: ${(angle * 180 / Math.PI).toFixed(1)}°`);
      console.log(`   World offset: (${worldOffsetX.toFixed(1)}, ${worldOffsetY.toFixed(1)})`);
      console.log(`   Local offset: (${this.localOffset.x.toFixed(1)}, ${this.localOffset.y.toFixed(1)})`);
    }
  }

  /**
   * Legacy method for anchor body positioning (fallback)
   */
  public updateFromAnchorBody(): void {
    if (this.anchorBody && !this.isBeingCollected && !this.isBeingTransferred) {
      this.position.x = this.anchorBody.position.x;
      this.position.y = this.anchorBody.position.y;
    }
  }

  public clone(): Screw {
    const cloned = new Screw(this.id, this.shapeId, this.position, this.color);
    cloned.constraint = this.constraint;
    cloned.isRemovable = this.isRemovable;
    cloned.isCollected = this.isCollected;
    cloned.isBeingCollected = this.isBeingCollected;
    cloned.collectionProgress = this.collectionProgress;
    cloned.targetPosition = this.targetPosition ? { ...this.targetPosition } : undefined;
    cloned.animationStartPosition = this.animationStartPosition ? { ...this.animationStartPosition } : undefined;
    cloned.isBeingTransferred = this.isBeingTransferred;
    cloned.transferProgress = this.transferProgress;
    cloned.transferStartPosition = this.transferStartPosition ? { ...this.transferStartPosition } : undefined;
    cloned.transferTargetPosition = this.transferTargetPosition ? { ...this.transferTargetPosition } : undefined;
    cloned.transferFromHoleIndex = this.transferFromHoleIndex;
    cloned.transferToContainerIndex = this.transferToContainerIndex;
    cloned.transferToHoleIndex = this.transferToHoleIndex;
    cloned.isShaking = this.isShaking;
    cloned.shakeProgress = this.shakeProgress;
    cloned.shakeOffset = { ...this.shakeOffset };
    cloned.rotation = this.rotation;
    cloned.rotationVelocity = this.rotationVelocity;
    cloned.isSpinning = this.isSpinning;
    return cloned;
  }

  public dispose(): void {
    this.constraint = null;
    this.targetPosition = undefined;
    this.animationStartPosition = undefined;
    this.transferStartPosition = undefined;
    this.transferTargetPosition = undefined;
    this.transferFromHoleIndex = undefined;
    this.transferToContainerIndex = undefined;
    this.transferToHoleIndex = undefined;
    this.isShaking = false;
    this.shakeProgress = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.rotation = 0;
    this.rotationVelocity = 0;
    this.isSpinning = false;
  }
}