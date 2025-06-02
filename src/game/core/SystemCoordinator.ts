/**
 * System Coordinator - manages initialization and lifecycle of all event-driven systems
 * Ensures proper startup sequence and system integration
 */

import { BaseSystem } from './BaseSystem';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
import { LayerManager } from '../systems/LayerManager';
import { ScrewManager } from '../systems/ScrewManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { ShapeRegistry } from '../systems/ShapeRegistry';
import { eventBus } from '../events/EventBus';

export class SystemCoordinator {
  private systems: Map<string, BaseSystem> = new Map();
  private isInitialized = false;
  private isDestroyed = false;

  // System instances
  private gameManager: GameManager | null = null;
  private gameState: GameState | null = null;
  private layerManager: LayerManager | null = null;
  private screwManager: ScrewManager | null = null;
  private physicsWorld: PhysicsWorld | null = null;

  constructor() {
    console.log('SystemCoordinator created');
  }

  /**
   * Initialize all systems in the correct order
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.isInitialized) {
      console.warn('SystemCoordinator is already initialized');
      return;
    }

    try {
      console.log('Initializing SystemCoordinator...');

      // Initialize ShapeRegistry first
      console.log('Initializing ShapeRegistry...');
      await ShapeRegistry.getInstance().initialize();
      console.log('ShapeRegistry initialized');

      // Create systems in dependency order
      this.createSystems();

      // Initialize systems in dependency order
      await this.initializeSystems();

      // Configure the game manager with canvas and coordinator reference
      if (this.gameManager) {
        this.gameManager.setSystemCoordinator(this);
        this.gameManager.initializeCanvas(canvas);
      }

      this.isInitialized = true;
      console.log('SystemCoordinator initialized successfully');

      // Emit system ready event
      eventBus.emit({
        type: 'system:ready',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to initialize SystemCoordinator:', error);
      throw error;
    }
  }

  /**
   * Create all system instances
   */
  private createSystems(): void {
    console.log('Creating systems...');

    // Create systems (no initialization yet)
    this.physicsWorld = new PhysicsWorld();
    this.gameState = new GameState();
    this.screwManager = new ScrewManager();
    this.layerManager = new LayerManager();
    this.gameManager = new GameManager();

    // Register systems
    this.systems.set('PhysicsWorld', this.physicsWorld);
    this.systems.set('GameState', this.gameState);
    this.systems.set('ScrewManager', this.screwManager);
    this.systems.set('LayerManager', this.layerManager);
    this.systems.set('GameManager', this.gameManager);

    console.log('All systems created');
  }

  /**
   * Initialize systems in dependency order
   */
  private async initializeSystems(): Promise<void> {
    const initOrder = [
      'PhysicsWorld',   // No dependencies
      'GameState',      // No dependencies  
      'ScrewManager',   // Depends on PhysicsWorld events
      'LayerManager',   // Depends on PhysicsWorld and ScrewManager events
      'GameManager'     // Depends on all other systems
    ];

    for (const systemName of initOrder) {
      const system = this.systems.get(systemName);
      if (system) {
        console.log(`Initializing ${systemName}...`);
        await system.initialize();
        console.log(`${systemName} initialized successfully`);
      } else {
        throw new Error(`System ${systemName} not found`);
      }
    }
  }

  /**
   * Start the game systems
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('SystemCoordinator must be initialized before starting');
    }

    console.log('Starting game systems...');
    
    if (this.gameManager) {
      this.gameManager.start();
    } else {
      throw new Error('GameManager not initialized');
    }
  }

  /**
   * Update all systems (called from game loop)
   * Note: GameManager is excluded as it manages its own update loop
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized || this.isDestroyed) {
      if (Date.now() % 1000 < 50) { // Log once per second
        console.log(`⚠️ SystemCoordinator: NOT updating - initialized: ${this.isInitialized}, destroyed: ${this.isDestroyed}`);
      }
      return;
    }

    // Update systems that need frame updates
    if (this.physicsWorld) {
      this.physicsWorld.update(deltaTime);
    } else {
      console.log('⚠️ SystemCoordinator: PhysicsWorld not available');
    }
    
    // Update GameState for container animations and other state management
    if (this.gameState) {
      this.gameState.update(deltaTime);
    }
    
    // GameManager is NOT updated here to avoid circular calls
    // GameManager drives the update loop and calls this method
    if (this.screwManager) {
      this.screwManager.update(deltaTime);
    }
    if (this.layerManager) {
      this.layerManager.update(deltaTime);
    }
  }

  /**
   * Render all systems (called from game loop)
   */
  public render(context: CanvasRenderingContext2D): void {
    if (!this.isInitialized || this.isDestroyed) return;

    // Only GameManager handles rendering in our architecture
    if (this.gameManager) {
      this.gameManager.render(context);
    }
  }

  /**
   * Get a specific system instance
   */
  public getSystem<T extends BaseSystem>(systemName: string): T | null {
    return (this.systems.get(systemName) as T) || null;
  }

  /**
   * Get the GameManager instance
   */
  public getGameManager(): GameManager | null {
    return this.gameManager;
  }

  public getLayerManager(): LayerManager | null {
    return this.layerManager;
  }

  public getScrewManager(): ScrewManager | null {
    return this.screwManager;
  }

  public getPhysicsWorld(): PhysicsWorld | null {
    return this.physicsWorld;
  }

  public getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Get system status for debugging
   */
  public getSystemsInfo(): Array<{
    name: string;
    initialized: boolean;
    destroyed: boolean;
    subscriptionCount: number;
  }> {
    return Array.from(this.systems.values()).map(system => system.getSystemInfo());
  }

  /**
   * Handle canvas resize
   */
  public updateCanvasSize(width: number, height: number): void {
    if (this.gameManager) {
      this.gameManager.updateCanvasSize(width, height);
    }
  }

  /**
   * Clean up all systems
   */
  public destroy(): void {
    if (this.isDestroyed) {
      console.warn('SystemCoordinator is already destroyed');
      return;
    }

    console.log('Destroying SystemCoordinator...');

    // Destroy systems in reverse order
    const destroyOrder = ['GameManager', 'LayerManager', 'ScrewManager', 'GameState', 'PhysicsWorld'];
    
    for (const systemName of destroyOrder) {
      const system = this.systems.get(systemName);
      if (system) {
        console.log(`Destroying ${systemName}...`);
        system.destroy();
      }
    }

    this.systems.clear();
    this.gameManager = null;
    this.gameState = null;
    this.layerManager = null;
    this.screwManager = null;
    this.physicsWorld = null;

    this.isDestroyed = true;
    console.log('SystemCoordinator destroyed');
  }

  /**
   * Check if coordinator is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if coordinator is destroyed
   */
  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }
}