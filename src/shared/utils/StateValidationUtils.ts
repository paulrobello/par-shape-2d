/**
 * Utility functions for common state validation patterns
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface SystemLike {
  getIsInitialized(): boolean;
  getIsDestroyed(): boolean;
  systemName: string;
}

export interface GameStateLike {
  gameStarted: boolean;
  gameOver: boolean;
  levelComplete: boolean;
}

export interface ScrewLike {
  isCollected: boolean;
  isBeingCollected: boolean;
  isRemovable: boolean;
}

export interface ContainerLike {
  isMarkedForRemoval: boolean;
  isFull: boolean;
  holes: (string | null)[];
  maxHoles: number;
}

export class StateValidationUtils {
  /**
   * Validates that a system is in a valid state for operations
   */
  static validateSystemState(system: SystemLike): ValidationResult {
    if (system.getIsDestroyed()) {
      return { 
        isValid: false, 
        reason: `System ${system.systemName} is destroyed` 
      };
    }
    
    if (!system.getIsInitialized()) {
      return { 
        isValid: false, 
        reason: `System ${system.systemName} is not initialized` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validates that the game is in an active state
   */
  static validateGameActive(gameState: GameStateLike): ValidationResult {
    if (!gameState.gameStarted) {
      return { isValid: false, reason: 'Game not started' };
    }
    
    if (gameState.gameOver) {
      return { isValid: false, reason: 'Game over' };
    }
    
    if (gameState.levelComplete) {
      return { isValid: false, reason: 'Level complete' };
    }
    
    return { isValid: true };
  }

  /**
   * Validates that a screw can be collected
   */
  static validateScrewCollection(screw: ScrewLike, forceRemoval = false): ValidationResult {
    if (screw.isCollected) {
      return { isValid: false, reason: 'Already collected' };
    }
    
    if (screw.isBeingCollected) {
      return { isValid: false, reason: 'Already being collected' };
    }
    
    if (!screw.isRemovable && !forceRemoval) {
      return { isValid: false, reason: 'Not removable' };
    }
    
    return { isValid: true };
  }

  /**
   * Validates container state for operations
   */
  static validateContainer(container: ContainerLike): ValidationResult {
    if (container.isMarkedForRemoval) {
      return { isValid: false, reason: 'Container marked for removal' };
    }
    
    if (container.isFull) {
      return { isValid: false, reason: 'Container is full' };
    }
    
    return { isValid: true };
  }

  /**
   * Validates that a hole index is valid and available
   */
  static validateHoleIndex(
    container: ContainerLike, 
    holeIndex: number
  ): ValidationResult {
    if (holeIndex < 0 || holeIndex >= container.maxHoles) {
      return { 
        isValid: false, 
        reason: `Invalid hole index ${holeIndex} (max: ${container.maxHoles})` 
      };
    }
    
    if (container.holes[holeIndex] !== null) {
      return { 
        isValid: false, 
        reason: `Hole ${holeIndex} is already occupied` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validates array bounds
   */
  static validateArrayBounds<T>(
    array: T[], 
    index: number, 
    arrayName = 'array'
  ): ValidationResult {
    if (index < 0 || index >= array.length) {
      return { 
        isValid: false, 
        reason: `Index ${index} out of bounds for ${arrayName} (length: ${array.length})` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validates that required parameters are provided
   */
  static validateRequired<T>(
    value: T | null | undefined, 
    paramName: string
  ): ValidationResult {
    if (value === null || value === undefined) {
      return { 
        isValid: false, 
        reason: `Required parameter '${paramName}' is missing` 
      };
    }
    
    return { isValid: true };
  }

  /**
   * Combines multiple validation results
   */
  static combineValidations(...results: ValidationResult[]): ValidationResult {
    for (const result of results) {
      if (!result.isValid) {
        return result;
      }
    }
    
    return { isValid: true };
  }

  /**
   * Helper to execute code only if validation passes
   */
  static executeIfValid<T>(
    validation: ValidationResult,
    action: () => T,
    onInvalid?: (reason: string) => T
  ): T | undefined {
    if (validation.isValid) {
      return action();
    } else if (onInvalid && validation.reason) {
      return onInvalid(validation.reason);
    }
    
    return undefined;
  }
}