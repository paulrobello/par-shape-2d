import { Constraint } from 'matter-js';
import { Screw as IScrew, ScrewColor, Vector2 } from '@/types/game';

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
  public targetContainerId?: string; // Which container this screw is flying to

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
    this.collectionProgress = 0;
  }

  public updateCollectionAnimation(deltaTime: number): boolean {
    if (!this.isBeingCollected || !this.targetPosition) return false;

    // Animation duration in milliseconds
    const animationDuration = 800;
    const progressIncrement = deltaTime / animationDuration;
    
    this.collectionProgress = Math.min(1, this.collectionProgress + progressIncrement);

    // Update position based on animation progress
    if (this.collectionProgress < 1) {
      // Use easing for smooth animation
      const easedProgress = this.easeInOutCubic(this.collectionProgress);
      
      // Calculate current position between start and target
      const startX = this.position.x;
      const startY = this.position.y;
      const targetX = this.targetPosition.x;
      const targetY = this.targetPosition.y;
      
      this.position.x = startX + (targetX - startX) * easedProgress;
      this.position.y = startY + (targetY - startY) * easedProgress;
      
      return false; // Animation not complete
    } else {
      // Animation complete
      this.position = { ...this.targetPosition };
      this.isBeingCollected = false;
      this.collect();
      return true; // Animation complete
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    const radius = 12; // Screw radius
    return {
      x: this.position.x - radius,
      y: this.position.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }

  public containsPoint(point: Vector2): boolean {
    const radius = 12; // Screw radius
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return (dx * dx + dy * dy) <= (radius * radius);
  }

  public getDistance(point: Vector2): number {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public clone(): Screw {
    const cloned = new Screw(this.id, this.shapeId, this.position, this.color);
    cloned.constraint = this.constraint;
    cloned.isRemovable = this.isRemovable;
    cloned.isCollected = this.isCollected;
    cloned.isBeingCollected = this.isBeingCollected;
    cloned.collectionProgress = this.collectionProgress;
    cloned.targetPosition = this.targetPosition ? { ...this.targetPosition } : undefined;
    return cloned;
  }

  public dispose(): void {
    this.constraint = null;
    this.targetPosition = undefined;
  }
}