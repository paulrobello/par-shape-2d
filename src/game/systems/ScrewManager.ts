import { Constraint, Bodies, Body, Sleeping } from 'matter-js';
import { Screw } from '@/game/entities/Screw';
import { Shape } from '@/game/entities/Shape';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';
import { Vector2 } from '@/types/game';
import { GAME_CONFIG, PHYSICS_CONSTANTS } from '@/game/utils/Constants';
import { getRandomScrewColor } from '@/game/utils/Colors';
import { randomIntBetween, distance } from '@/game/utils/MathUtils';

export class ScrewManager {
  private physicsWorld: PhysicsWorld;
  private screwCounter = 0;
  private screws: Map<string, Screw> = new Map();
  private constraints: Map<string, Constraint> = new Map();

  constructor(physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  public generateScrewsForShape(shape: Shape): void {
    if (shape.screws.length > 0) return; // Already has screws

    // Determine screw count based on shape size to avoid overcrowding
    const shapeArea = this.getShapeArea(shape);
    const maxScrewsForSize = this.getMaxScrewsForArea(shapeArea);
    const screwCount = randomIntBetween(
      GAME_CONFIG.shapes.minScrews,
      Math.min(GAME_CONFIG.shapes.maxScrews, maxScrewsForSize)
    );

    const screwPositions = this.calculateScrewPositions(shape, screwCount);
    
    // Safety check: ensure at least one screw is placed
    if (screwPositions.length === 0) {
      console.error(`No screws placed for ${shape.type} shape! Force placing one at center.`);
      screwPositions.push({ ...shape.position });
    }
    
    screwPositions.forEach((position) => {
      const screw = this.createScrew(shape.id, position);
      shape.addScrew(screw);
      this.screws.set(screw.id, screw);
      
      // Create constraint to attach screw to shape
      this.createScrewConstraint(screw, shape);
    });
    
    console.log(`Placed ${screwPositions.length} screws on ${shape.type} shape (requested ${screwCount})`);
  }

  private calculateScrewPositions(shape: Shape, count: number): Vector2[] {
    const screwRadius = 12; // Screw visual radius
    const minDistance = screwRadius * 4; // Minimum distance = 4 * screw diameter
    const maxAttempts = 500; // Increased attempts
    const maxRetries = 3; // Try up to 3 times with different initial placements

    // Special case: single screw goes in the center
    if (count === 1) {
      return [{ ...shape.position }];
    }

    // Try multiple times with different initial screw placements
    for (let retry = 0; retry < maxRetries; retry++) {
      console.log(`Attempt ${retry + 1}/${maxRetries} to place ${count} screws on ${shape.type}`);
      
      const positions = this.attemptScrewPlacement(shape, count, minDistance, maxAttempts, screwRadius);
      
      // If we got more than 1 screw or this is our last retry, use this result
      if (positions.length > 1 || retry === maxRetries - 1) {
        console.log(`Successfully placed ${positions.length} screws on attempt ${retry + 1}`);
        return positions;
      }
      
      console.log(`Only placed ${positions.length} screw(s) on attempt ${retry + 1}, retrying...`);
    }

    // Fallback (should not reach here due to logic above, but safety)
    return [{ ...shape.position }];
  }

  private attemptScrewPlacement(
    shape: Shape, 
    count: number, 
    minDistance: number, 
    maxAttempts: number, 
    screwRadius: number
  ): Vector2[] {
    const positions: Vector2[] = [];
    // For multiple screws, place them with careful spacing
    for (let i = 0; i < count; i++) {
      let placed = false;
      
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        // Generate random position within safe shape bounds
        const candidatePoint = this.getRandomPositionInShape(shape);
        
        // Validate the position is actually within shape bounds
        if (!this.isPositionWithinShapeBounds(candidatePoint, shape)) {
          continue;
        }
        
        // Check if it's far enough from existing screws (prevent any visual overlap)
        const tooClose = positions.some(existing => {
          const dist = distance(existing, candidatePoint);
          return dist < minDistance;
        });
        
        if (!tooClose) {
          positions.push({ ...candidatePoint });
          placed = true;
        }
      }
      
      // If we couldn't place the screw, try with reduced spacing requirements
      if (!placed) {
        console.warn(`Could not place screw ${i + 1} on ${shape.type} shape with normal spacing, trying with reduced spacing`);
        
        // Try again with relaxed distance requirements (but still prevent visual overlap)
        const relaxedMinDistance = Math.max(screwRadius * 2.5, minDistance * 0.7); // Still prevent overlap
        
        for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
          const candidatePoint = this.getRandomPositionInShape(shape);
          
          if (!this.isPositionWithinShapeBounds(candidatePoint, shape)) {
            continue;
          }
          
          const tooClose = positions.some(existing => {
            const dist = distance(existing, candidatePoint);
            return dist < relaxedMinDistance;
          });
          
          if (!tooClose) {
            positions.push({ ...candidatePoint });
            placed = true;
            console.log(`Successfully placed screw ${i + 1} with relaxed spacing`);
          }
        }
      }
      
      // If still couldn't place and this is the first screw (mandatory), force placement at center
      if (!placed && i === 0) {
        console.warn(`Forcing placement of mandatory first screw at shape center for ${shape.type}`);
        positions.push({ ...shape.position });
        placed = true;
      }
      
      // If we still couldn't place the screw and it's not the first one, stop trying more
      if (!placed && i > 0) {
        console.warn(`Could not place screw ${i + 1} on ${shape.type} shape even with relaxed spacing, stopping placement`);
        break;
      }
    }

    return positions;
  }

  private getRandomPositionInShape(shape: Shape): Vector2 {
    // Generate random position well within the shape's borders
    let x: number, y: number;
    const screwRadius = 12; // Define screw radius here
    
    switch (shape.type) {
      case 'rectangle':
      case 'square':
        const width = shape.width || 60;
        const height = shape.height || 60;
        // Use very large margins to keep screws well away from borders
        const margin = Math.max(30, screwRadius * 3); // At least 30px or 3x screw radius
        const safeWidth = Math.max(15, width - margin * 2);
        const safeHeight = Math.max(15, height - margin * 2);
        const safeWidthRatio = safeWidth / width;
        const safeHeightRatio = safeHeight / height;
        x = shape.position.x + (Math.random() - 0.5) * width * safeWidthRatio;
        y = shape.position.y + (Math.random() - 0.5) * height * safeHeightRatio;
        break;
        
      case 'circle':
        const circleRadius = shape.radius || 30;
        const angle = Math.random() * Math.PI * 2;
        // Keep screws well within circle bounds with large margin
        const circleMargin = Math.max(30, screwRadius * 3);
        const maxDistance = Math.max(8, circleRadius - circleMargin);
        const distance = Math.random() * maxDistance;
        x = shape.position.x + Math.cos(angle) * distance;
        y = shape.position.y + Math.sin(angle) * distance;
        break;
        
      case 'triangle':
      case 'star':
        const polyRadius = shape.radius || 30;
        const polyAngle = Math.random() * Math.PI * 2;
        // For polygons, be extremely conservative with placement
        const polyMargin = Math.max(35, screwRadius * 3.5); // Large margin for irregular shapes
        const polyMaxDistance = Math.max(6, polyRadius - polyMargin);
        const polyDistance = Math.random() * polyMaxDistance;
        x = shape.position.x + Math.cos(polyAngle) * polyDistance;
        y = shape.position.y + Math.sin(polyAngle) * polyDistance;
        break;
        
      default:
        x = shape.position.x;
        y = shape.position.y;
    }
    
    return { x, y };
  }

  private isPositionWithinShapeBounds(position: Vector2, shape: Shape): boolean {
    const screwRadius = 12;
    
    switch (shape.type) {
      case 'rectangle':
      case 'square':
        const width = shape.width || 60;
        const height = shape.height || 60;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const margin = Math.max(30, screwRadius * 3);
        return (
          position.x >= shape.position.x - halfWidth + margin &&
          position.x <= shape.position.x + halfWidth - margin &&
          position.y >= shape.position.y - halfHeight + margin &&
          position.y <= shape.position.y + halfHeight - margin
        );
        
      case 'circle':
        const radius = shape.radius || 30;
        const dist = distance(position, shape.position);
        const circleMargin = Math.max(30, screwRadius * 3);
        return dist <= radius - circleMargin;
        
      case 'triangle':
      case 'star':
        const polyRadius = shape.radius || 30;
        const polyDist = distance(position, shape.position);
        const polyMargin = Math.max(35, screwRadius * 3.5);
        return polyDist <= polyRadius - polyMargin;
        
      default:
        return true;
    }
  }

  private getShapeArea(shape: Shape): number {
    switch (shape.type) {
      case 'rectangle':
        const width = shape.width || 60;
        const height = shape.height || 60;
        return width * height;
      case 'square':
        const size = shape.width || 60;
        return size * size;
      case 'circle':
        const radius = shape.radius || 30;
        return Math.PI * radius * radius;
      case 'triangle':
        const triRadius = shape.radius || 30;
        // Approximate area for equilateral triangle
        return (Math.sqrt(3) / 4) * Math.pow(triRadius * 2, 2);
      case 'star':
        const starRadius = shape.radius || 30;
        // Approximate area for pentagon
        return 2.5 * starRadius * starRadius * Math.sin(Math.PI * 2 / 5);
      default:
        return 3600; // Default area
    }
  }

  private getMaxScrewsForArea(area: number): number {
    // With retry logic, we can be slightly more aggressive
    if (area < 2500) return 1; // Very small shapes get only 1 screw
    if (area < 4000) return 2; // Small shapes get max 2 screws
    if (area < 6000) return 3; // Medium shapes get max 3 screws
    if (area < 10000) return 4; // Large shapes get max 4 screws
    if (area < 15000) return 5; // Very large shapes get max 5 screws
    return 6; // Largest shapes can have up to 6 screws with retry logic
  }

  private createScrew(shapeId: string, position: Vector2): Screw {
    const id = `screw-${++this.screwCounter}`;
    const color = getRandomScrewColor();
    return new Screw(id, shapeId, position, color);
  }

  private createScrewConstraint(screw: Screw, shape: Shape): void {
    // Calculate offset from shape center to screw position
    const offsetX = screw.position.x - shape.position.x;
    const offsetY = screw.position.y - shape.position.y;

    // Create a static body at the screw position to act as an anchor
    const screwAnchor = Bodies.circle(screw.position.x, screw.position.y, 1, {
      isStatic: true,
      render: { visible: false },
      collisionFilter: { group: -1, category: 0, mask: 0 }, // No collisions
    });

    // Add the anchor to the physics world
    this.physicsWorld.addBodies([screwAnchor]);

    const constraint = Constraint.create({
      bodyA: shape.body,
      bodyB: screwAnchor,
      pointA: { x: offsetX, y: offsetY }, // Attach to specific point on shape
      pointB: { x: 0, y: 0 }, // Center of anchor
      length: 0,
      stiffness: PHYSICS_CONSTANTS.constraint.stiffness,
      damping: PHYSICS_CONSTANTS.constraint.damping,
      render: { visible: false },
    });

    screw.setConstraint(constraint);
    this.constraints.set(screw.id, constraint);
    
    // Store the anchor body reference on the screw for cleanup
    (screw as any).anchorBody = screwAnchor; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    // Add constraint to physics world
    this.physicsWorld.addConstraints([constraint]);
  }

  public removeScrewFromShape(screwId: string, allShapes?: Shape[]): boolean {
    const screw = this.screws.get(screwId);
    if (!screw || !screw.isRemovable || screw.isCollected) {
      return false;
    }

    // Find the shape this screw belongs to and add hole (relative to shape center)
    if (allShapes) {
      const shape = allShapes.find(s => s.id === screw.shapeId);
      if (shape) {
        // Store hole position relative to shape center
        const relativeX = screw.position.x - shape.position.x;
        const relativeY = screw.position.y - shape.position.y;
        shape.holes.push({ x: relativeX, y: relativeY });
      }
    }

    // Remove constraint from physics world
    const constraint = this.constraints.get(screwId);
    if (constraint) {
      this.physicsWorld.removeConstraints([constraint]);
      this.constraints.delete(screwId);
    }

    // Remove anchor body if it exists
    const anchorBody = (screw as any).anchorBody; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (anchorBody) {
      this.physicsWorld.removeBodies([anchorBody]);
      delete (screw as any).anchorBody; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Mark screw as collected (no longer set showHole)
    screw.collect();

    // Check if this is the last screw - if so, enable rotation around remaining screw
    const shapeScrews = this.getScrewsForShape(screw.shapeId).filter(s => !s.isCollected && !s.isBeingCollected);
    if (shapeScrews.length === 1) {
      this.updateShapeConstraints(screw.shapeId);
    } else if (shapeScrews.length === 0) {
      // No screws left - make shape fully dynamic and let it fall
      if (allShapes) {
        const shape = allShapes.find(s => s.id === screw.shapeId);
        if (shape && shape.body) {
          // Ensure the body is dynamic and will fall
          Body.setStatic(shape.body, false);
          // Wake up the body to ensure it responds to physics
          Sleeping.set(shape.body, false);
          
          // Apply a more significant force based on body mass
          const mass = shape.body.mass || 1;
          const gravity = 0.8; // Match game gravity from Constants
          const forceMultiplier = 0.01; // Make it more noticeable
          
          Body.applyForce(shape.body, shape.body.position, { 
            x: 0, 
            y: gravity * mass * forceMultiplier 
          });
          
          // Set a more significant initial velocity
          Body.setVelocity(shape.body, { x: 0, y: 0.1 });
          
          // Ensure collision detection is properly enabled
          shape.body.collisionFilter.mask = 0xFFFFFFFF;
          
          // Debug: Log the shape's physics state
          console.log(`Shape ${shape.id} now has no screws - made dynamic, awakened, and given impulse to fall`, {
            force: gravity * mass * forceMultiplier,
            mass: shape.body.mass,
            isStatic: shape.body.isStatic,
            isSleeping: shape.body.isSleeping,
            position: shape.body.position,
            velocity: shape.body.velocity,
            constraintsConnected: this.getScrewsForShape(shape.id).length
          });
        }
      }
    }

    return true;
  }

  private updateShapeConstraints(shapeId: string): void {
    // Get all remaining screws for this shape
    const shapeScrews = this.getScrewsForShape(shapeId).filter(s => !s.isCollected && !s.isBeingCollected);
    
    if (shapeScrews.length === 1) {
      // If only one screw remains, update its constraint to allow rotation around the screw
      const remainingScrew = shapeScrews[0];
      const oldConstraint = this.constraints.get(remainingScrew.id);
      
      if (oldConstraint && oldConstraint.bodyA) {
        // Remove old constraint
        this.physicsWorld.removeConstraints([oldConstraint]);
        this.constraints.delete(remainingScrew.id);
        
        // Remove old anchor body
        const oldAnchorBody = (remainingScrew as any).anchorBody; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (oldAnchorBody) {
          this.physicsWorld.removeBodies([oldAnchorBody]);
        }
        
        // Calculate the relative position of the screw within the shape
        const shapeBody = oldConstraint.bodyA;
        const screwLocalPosition = {
          x: remainingScrew.position.x - shapeBody.position.x,
          y: remainingScrew.position.y - shapeBody.position.y
        };
        
        // Create new anchor body at screw position
        const newAnchor = Bodies.circle(remainingScrew.position.x, remainingScrew.position.y, 1, {
          isStatic: true,
          render: { visible: false },
          collisionFilter: { group: -1, category: 0, mask: 0 },
        });
        
        this.physicsWorld.addBodies([newAnchor]);
        
        // Create new constraint maintaining the relative screw position (shape pivots around screw)
        const newConstraint = Constraint.create({
          bodyA: oldConstraint.bodyA,
          bodyB: newAnchor,
          pointA: screwLocalPosition, // Maintain original relative position from shape to screw
          pointB: { x: 0, y: 0 }, // Center of anchor
          length: 0,
          stiffness: PHYSICS_CONSTANTS.constraint.stiffness,
          damping: PHYSICS_CONSTANTS.constraint.damping,
          render: { visible: false },
        });
        
        remainingScrew.setConstraint(newConstraint);
        this.constraints.set(remainingScrew.id, newConstraint);
        (remainingScrew as any).anchorBody = newAnchor; // eslint-disable-line @typescript-eslint/no-explicit-any
        this.physicsWorld.addConstraints([newConstraint]);
      }
    }
  }

  public getScrewAtPoint(point: Vector2, allShapes?: Shape[], getLayerIndex?: (layerId: string) => number): Screw | null {
    // Find the closest screw to the point that contains it
    let closestScrew: Screw | null = null;
    let closestDistance = Infinity;

    for (const screw of this.screws.values()) {
      if (!screw.isRemovable || screw.isCollected || screw.isBeingCollected) {
        continue;
      }

      if (screw.containsPoint(point)) {
        // Check if screw is occluded by shapes in front layers at the click point
        if (allShapes && getLayerIndex) {
          const screwShape = allShapes.find(shape => shape.id === screw.shapeId);
          if (screwShape) {
            const screwLayerIndex = getLayerIndex(screwShape.layerId);
            
            // Check if any shape in front layers (lower index = front) blocks the click point
            const isClickBlocked = allShapes.some(shape => {
              if (shape.id === screw.shapeId) return false;
              
              const shapeLayerIndex = getLayerIndex(shape.layerId);
              
              console.log(`Checking blocking shape: ${shape.type} (${shape.color}) in layer ${shape.layerId} (index ${shapeLayerIndex}) vs screw layer index ${screwLayerIndex}`);
              
              // Only shapes in front (lower depthIndex) can block clicks
              if (shapeLayerIndex >= screwLayerIndex) {
                console.log(`  - Shape not in front (${shapeLayerIndex} >= ${screwLayerIndex}), skipping`);
                return false;
              }
              
              // Check if click point is within the actual shape (precise detection for mouse interactions)
              const isBlocking = this.isPointInActualShape(point, shape);
              console.log(`  - Shape is in front (${shapeLayerIndex} < ${screwLayerIndex}), blocking: ${isBlocking}`);
              return isBlocking;
            });
            
            console.log(`Screw ${screw.id} click blocked: ${isClickBlocked}`);
            
            if (isClickBlocked) {
              continue; // Skip this screw - click is blocked by shape in front
            }
          }
        }
        
        const dist = screw.getDistance(point);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestScrew = screw;
        }
      }
    }

    return closestScrew;
  }

  public updateScrewPositions(): void {
    // Update screw positions based on their anchor bodies (which are static and don't move)
    // or calculate from shape if no anchor body exists
    for (const screw of this.screws.values()) {
      if (screw.isCollected || screw.isBeingCollected) continue;

      // Check if screw has an anchor body (new system)
      const anchorBody = (screw as any).anchorBody; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (anchorBody) {
        // Anchor bodies are static, so screw position should match anchor position
        screw.position.x = anchorBody.position.x;
        screw.position.y = anchorBody.position.y;
      } else {
        // Fallback to old calculation method for any screws without anchor bodies
        const constraint = screw.constraint;
        if (constraint && constraint.bodyA) {
          const shape = constraint.bodyA;
          const offsetX = constraint.pointA?.x || 0;
          const offsetY = constraint.pointA?.y || 0;
          
          // Apply shape rotation to the offset
          const cos = Math.cos(shape.angle);
          const sin = Math.sin(shape.angle);
          
          screw.position.x = shape.position.x + (offsetX * cos - offsetY * sin);
          screw.position.y = shape.position.y + (offsetX * sin + offsetY * cos);
        }
      }
    }
  }

  public updateCollectionAnimations(deltaTime: number): { completed: string[]; collected: Screw[] } {
    const completedScrews: string[] = [];
    const collectedScrews: Screw[] = [];
    
    for (const screw of this.screws.values()) {
      if (screw.isBeingCollected) {
        const isComplete = screw.updateCollectionAnimation(deltaTime);
        if (isComplete) {
          completedScrews.push(screw.id);
          collectedScrews.push(screw);
          console.log(`Screw ${screw.id} collection completed`);
        }
      }
    }
    
    return { completed: completedScrews, collected: collectedScrews };
  }

  public getAllScrews(): Screw[] {
    return Array.from(this.screws.values());
  }

  public getActiveScrews(): Screw[] {
    return Array.from(this.screws.values()).filter(
      screw => !screw.isCollected && !screw.isBeingCollected
    );
  }

  public getScrewsForShape(shapeId: string): Screw[] {
    return Array.from(this.screws.values()).filter(
      screw => screw.shapeId === shapeId
    );
  }

  public getScrew(screwId: string): Screw | null {
    return this.screws.get(screwId) || null;
  }

  public checkScrewRemovability(screwId: string, allShapes: Shape[], getLayerIndex?: (layerId: string) => number, precisCheck: boolean = false): boolean {
    const screw = this.screws.get(screwId);
    if (!screw || screw.isCollected) {
      console.log(`Screw ${screwId} not found or already collected`);
      return false;
    }

    // Check if screw is blocked by other shapes
    const screwShape = allShapes.find(shape => shape.id === screw.shapeId);
    if (!screwShape) {
      console.log(`Shape not found for screw ${screwId}`);
      return false;
    }

    // Get the layer index of the screw's shape
    const screwLayerIndex = getLayerIndex ? getLayerIndex(screwShape.layerId) : -1;
    console.log(`Checking removability for screw ${screwId} in layer ${screwShape.layerId} (depthIndex: ${screwLayerIndex})`);

    // Check if the screw area overlaps with shapes in front layers (lower index = front)
    // This is a broader check for general screw removability
    for (const shape of allShapes) {
      if (shape.id === screw.shapeId) continue;
      
      // If we have layer information, only check shapes in front of the screw's layer
      if (getLayerIndex) {
        const shapeLayerIndex = getLayerIndex(shape.layerId);
        // Only shapes in layers in front (lower depthIndex) can block screws
        if (shapeLayerIndex >= screwLayerIndex) {
          continue; // Skip shapes in same layer or behind
        }
        
        // Check if screw area (with small radius) overlaps with shape
        if (this.isScrewAreaBlocked(screw, shape, precisCheck)) {
          console.log(`  Screw ${screwId} blocked by shape ${shape.id} in layer ${shape.layerId} (depthIndex: ${shapeLayerIndex})`);
          return false; // Screw is blocked by shape in front
        }
      } else {
        // Fallback without layer info - check basic bounds overlap
        if (this.isScrewAreaBlocked(screw, shape, precisCheck)) {
          console.log(`  Screw ${screwId} blocked by shape ${shape.id} (no layer info)`);
          return false; // Screw is blocked
        }
      }
    }

    console.log(`  Screw ${screwId} is removable`);
    return true;
  }

  public updateScrewRemovability(allShapes: Shape[], getLayerIndex?: (layerId: string) => number): void {
    console.log('=== UPDATING SCREW REMOVABILITY ===');
    let removableCount = 0;
    let totalCount = 0;
    
    for (const screw of this.screws.values()) {
      if (screw.isCollected) continue;
      
      totalCount++;
      const wasRemovable = screw.isRemovable;
      const isRemovable = this.checkScrewRemovability(screw.id, allShapes, getLayerIndex, true);
      screw.setRemovable(isRemovable);
      
      if (isRemovable) removableCount++;
      
      if (wasRemovable !== isRemovable) {
        console.log(`Screw ${screw.id} removability changed: ${wasRemovable} -> ${isRemovable}`);
      }
    }
    
    console.log(`Screw removability: ${removableCount}/${totalCount} screws are removable`);
  }

  public startScrewCollection(screwId: string, targetPosition: Vector2): boolean {
    const screw = this.screws.get(screwId);
    if (!screw || !screw.isRemovable || screw.isCollected || screw.isBeingCollected) {
      return false;
    }

    screw.startCollection(targetPosition);
    return true;
  }

  public clearAllScrews(): void {
    // Remove all constraints from physics world
    const allConstraints = Array.from(this.constraints.values());
    if (allConstraints.length > 0) {
      this.physicsWorld.removeConstraints(allConstraints);
    }

    // Remove all anchor bodies
    const anchorBodies = [];
    for (const screw of this.screws.values()) {
      const anchorBody = (screw as any).anchorBody; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (anchorBody) {
        anchorBodies.push(anchorBody);
      }
    }
    if (anchorBodies.length > 0) {
      this.physicsWorld.removeBodies(anchorBodies);
    }

    // Dispose all screws
    for (const screw of this.screws.values()) {
      screw.dispose();
    }

    this.screws.clear();
    this.constraints.clear();
    this.screwCounter = 0;
  }

  private isPointInShapeBounds(point: Vector2, shape: Shape): boolean {
    const bounds = shape.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  private isScrewAreaBlocked(screw: Screw, shape: Shape, precisCheck: boolean = false): boolean {
    if (precisCheck) {
      // Use a smaller screw radius for intersection tests to be less aggressive
      return this.isCircleIntersectingShape(screw.position, 8, shape); // 8px instead of 12px
    } else {
      // Use fast bounding box check for general removability updates
      return this.isPointInShapeBoundsWithMargin(screw.position, shape);
    }
  }

  private isPointInShapeBoundsWithMargin(point: Vector2, shape: Shape): boolean {
    const bounds = shape.getBounds();
    // Use an even smaller margin to make bounding box checks less aggressive
    const margin = 2;
    return (
      point.x >= bounds.x + margin &&
      point.x <= bounds.x + bounds.width - margin &&
      point.y >= bounds.y + margin &&
      point.y <= bounds.y + bounds.height - margin
    );
  }

  public isPointInActualShape(point: Vector2, shape: Shape): boolean {
    // Use the shape's actual geometry instead of just bounding box
    const path = shape.getPath2D();
    
    // Create a temporary canvas context for hit testing
    if (typeof document !== 'undefined') {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        return tempCtx.isPointInPath(path, point.x, point.y);
      }
    }
    
    // Fallback to distance-based check for shape center
    const distance = Math.sqrt(
      Math.pow(point.x - shape.position.x, 2) + 
      Math.pow(point.y - shape.position.y, 2)
    );
    
    // Use approximate radius based on shape type
    const maxRadius = this.getShapeApproximateRadius(shape.type);
    return distance < maxRadius * 0.9; // 90% of radius to be more generous
  }

  private getShapeApproximateRadius(type: string): number {
    switch (type) {
      case 'rectangle':
        return 60;
      case 'square':
        return 53;
      case 'circle':
        return 53;
      case 'triangle':
        return 68;
      case 'star':
        return 60;
      default:
        return 50;
    }
  }

  private isCircleIntersectingShape(center: Vector2, radius: number, shape: Shape): boolean {
    // Handle different shape types with proper geometric intersection tests
    switch (shape.type) {
      case 'circle':
        return this.isCircleIntersectingCircle(center, radius, shape);
      case 'rectangle':
      case 'square':
        return this.isCircleIntersectingRectangle(center, radius, shape);
      case 'triangle':
      case 'star':
        return this.isCircleIntersectingPolygon(center, radius, shape);
      default:
        // Fallback to point-in-shape test
        return this.isPointInActualShape(center, shape);
    }
  }

  private isCircleIntersectingCircle(center: Vector2, radius: number, shape: Shape): boolean {
    const shapeRadius = shape.radius || 30;
    const distance = Math.sqrt(
      Math.pow(center.x - shape.position.x, 2) + 
      Math.pow(center.y - shape.position.y, 2)
    );
    return distance < (radius + shapeRadius);
  }

  private isCircleIntersectingRectangle(center: Vector2, radius: number, shape: Shape): boolean {
    const width = shape.width || 60;
    const height = shape.height || 60;
    
    // Transform circle center to rectangle's local coordinate system (accounting for rotation)
    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const dx = center.x - shape.position.x;
    const dy = center.y - shape.position.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Find closest point on rectangle to circle center
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX));
    const closestY = Math.max(-halfHeight, Math.min(halfHeight, localY));
    
    // Check if distance to closest point is less than radius
    const distanceSquared = Math.pow(localX - closestX, 2) + Math.pow(localY - closestY, 2);
    return distanceSquared < (radius * radius);
  }

  private isCircleIntersectingPolygon(center: Vector2, radius: number, shape: Shape): boolean {
    // For polygons, we'll use the Matter.js body vertices if available
    if (shape.body && shape.body.vertices) {
      return this.isCircleIntersectingVertices(center, radius, shape.body.vertices);
    }
    
    // Fallback: approximate as circle
    const shapeRadius = shape.radius || 30;
    const distance = Math.sqrt(
      Math.pow(center.x - shape.position.x, 2) + 
      Math.pow(center.y - shape.position.y, 2)
    );
    return distance < (radius + shapeRadius * 0.8); // Slightly more conservative for complex shapes
  }

  private isCircleIntersectingVertices(center: Vector2, radius: number, vertices: Array<{x: number, y: number}>): boolean {
    // Check if circle intersects with any edge of the polygon
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      if (this.isCircleIntersectingLineSegment(center, radius, v1, v2)) {
        return true;
      }
    }
    
    // Also check if circle center is inside polygon (for small shapes entirely within circle)
    return this.isPointInPolygon(center, vertices);
  }

  private isCircleIntersectingLineSegment(
    center: Vector2, 
    radius: number, 
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}
  ): boolean {
    // Vector from p1 to p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    // Vector from p1 to circle center
    const fx = center.x - p1.x;
    const fy = center.y - p1.y;
    
    // Project circle center onto line segment
    const segmentLengthSquared = dx * dx + dy * dy;
    
    if (segmentLengthSquared === 0) {
      // p1 and p2 are the same point
      const distance = Math.sqrt(fx * fx + fy * fy);
      return distance <= radius;
    }
    
    const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / segmentLengthSquared));
    
    // Closest point on line segment
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;
    
    // Distance from circle center to closest point
    const distanceSquared = Math.pow(center.x - closestX, 2) + Math.pow(center.y - closestY, 2);
    return distanceSquared <= (radius * radius);
  }

  private isPointInPolygon(point: Vector2, vertices: Array<{x: number, y: number}>): boolean {
    let inside = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
          (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  public dispose(): void {
    this.clearAllScrews();
  }

  // Serialization methods for save/load
  public toSerializable(): { animatingScrews: import('@/types/game').SerializableScrew[] } {
    const animatingScrews: import('@/types/game').SerializableScrew[] = [];
    
    this.screws.forEach(screw => {
      if (screw.isBeingCollected) {
        animatingScrews.push({
          id: screw.id,
          shapeId: screw.shapeId,
          position: { ...screw.position },
          color: screw.color,
          isRemovable: screw.isRemovable,
          isCollected: screw.isCollected,
          isBeingCollected: screw.isBeingCollected,
          targetContainerId: screw.targetContainerId,
          // Animation state for recreation
          animationTarget: screw.targetPosition ? { ...screw.targetPosition } : undefined,
          animationProgress: screw.collectionProgress || 0,
        });
      }
    });
    
    return { animatingScrews };
  }

  public fromSerializable(data: { animatingScrews: import('@/types/game').SerializableScrew[] }): void {
    // Restore animating screws that aren't part of any shape
    if (data.animatingScrews) {
      data.animatingScrews.forEach(screwData => {
        // Import Screw class
        const { Screw: ScrewClass } = require('@/game/entities/Screw'); // eslint-disable-line @typescript-eslint/no-require-imports
        
        const screw = new ScrewClass(
          screwData.id,
          screwData.shapeId,
          screwData.position,
          screwData.color
        );
        
        screw.isRemovable = screwData.isRemovable;
        screw.isCollected = screwData.isCollected;
        screw.isBeingCollected = screwData.isBeingCollected;
        screw.targetContainerId = screwData.targetContainerId;
        
        // Restore animation state if available
        if (screwData.animationTarget) {
          screw.targetPosition = { ...screwData.animationTarget };
          screw.collectionProgress = screwData.animationProgress || 0;
        }
        
        this.screws.set(screw.id, screw);
      });
    }
  }

  public addScrew(screw: Screw): void {
    this.screws.set(screw.id, screw);
  }

  public attachScrewToShape(screw: Screw, shape: Shape): void {
    if (!screw.constraint) {
      this.createScrewConstraint(screw, shape);
    }
  }
}