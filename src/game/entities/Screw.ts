import { Constraint, Body } from 'matter-js';
import { Screw as IScrew, ScrewColor, Vector2 } from '@/types/game';
import { UI_CONSTANTS } from '@/shared/utils/Constants';

export class Screw implements IScrew {
  public id: string;
  public shapeId: string;
  public position: Vector2;
  public color: ScrewColor;
  public constraint: Constraint | null = null;
  public isRemovable: boolean = true;
  public isCollected: boolean = false;

  // Additional properties for screw management
  public isBeingCollected: boolean = false;
  public collectionProgress: number = 0; // 0-1 for animation
  public targetPosition?: Vector2; // For collection animation
  public animationStartPosition?: Vector2; // Original position when animation started
  public targetContainerId?: string; // Which container this screw is flying to
  public targetHoleIndex?: number; // Which hole index in the container
  public targetType?: 'container' | 'holding_hole'; // Type of destination
  public anchorBody?: Body; // Physics anchor body for constraint

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
  }

  public setConstraint(constraint: Constraint): void {
    this.constraint = constraint;
  }

  public removeConstraint(): void {
    this.constraint = null;
  }

  public hasConstraint(): boolean {
    return this.constraint !== null;
  }

  public setRemovable(removable: boolean): void {
    this.isRemovable = removable;
  }

  public collect(): void {
    if (this.isCollected) return;
    
    this.isCollected = true;
    this.isRemovable = false;
    this.removeConstraint();
  }

  public startCollection(targetPosition: Vector2): void {
    if (this.isBeingCollected || this.isCollected) return;
    
    this.isBeingCollected = true;
    this.targetPosition = { ...targetPosition };
    this.animationStartPosition = { ...this.position }; // Save original position
    this.collectionProgress = 0;
  }

  public updateCollectionAnimation(deltaTime: number): boolean {
    if (!this.isBeingCollected || !this.targetPosition || !this.animationStartPosition) return false;

    // Animation duration in milliseconds
    const animationDuration = 800;
    const progressIncrement = deltaTime / animationDuration;
    
    this.collectionProgress = Math.min(1, this.collectionProgress + progressIncrement);

    // Update position based on animation progress
    if (this.collectionProgress < 1) {
      // Use easing for smooth animation
      const easedProgress = this.easeInOutCubic(this.collectionProgress);
      
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
  }

  public updateTransferAnimation(deltaTime: number): boolean {
    if (!this.isBeingTransferred || !this.transferStartPosition || !this.transferTargetPosition) return false;

    // Animation duration in milliseconds
    const animationDuration = 600; // Slightly faster than collection animation
    const progressIncrement = deltaTime / animationDuration;
    
    this.transferProgress = Math.min(1, this.transferProgress + progressIncrement);

    // Update position based on animation progress
    if (this.transferProgress < 1) {
      // Use easing for smooth animation
      const easedProgress = this.easeInOutCubic(this.transferProgress);
      
      // Calculate current position between start and target
      const startX = this.transferStartPosition.x;
      const startY = this.transferStartPosition.y;
      const targetX = this.transferTargetPosition.x;
      const targetY = this.transferTargetPosition.y;
      
      this.position.x = startX + (targetX - startX) * easedProgress;
      this.position.y = startY + (targetY - startY) * easedProgress;
      
      return false; // Animation not complete
    } else {
      // Animation complete
      this.position = { ...this.transferTargetPosition };
      this.isBeingTransferred = false;
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

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
   * Update screw position from its anchor body (similar to Shape.updateFromBody())
   * This ensures the screw position stays synchronized with its physics constraint
   */
  public updateFromAnchorBody(): void {
    if (this.anchorBody && !this.isBeingCollected && !this.isBeingTransferred) {
      this.position = { x: this.anchorBody.position.x, y: this.anchorBody.position.y };
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
  }
}