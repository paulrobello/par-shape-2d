import { GameState as IGameState, Level, Container, HoldingHole, ScrewColor, Screw, Shape } from '@/types/game';
import { GAME_CONFIG, UI_CONSTANTS } from '@/game/utils/Constants';
import { getRandomScrewColors, getRandomColorsFromList } from '@/game/utils/Colors';

export class GameState {
  private state: IGameState;
  private level: Level;
  private containers: Container[] = [];
  private holdingHoles: HoldingHole[] = [];
  private onContainerCreated?: () => void;

  constructor() {
    this.state = this.createInitialState();
    this.level = this.createInitialLevel();
    this.initializeContainers();
    this.initializeHoldingHoles();
  }

  public setOnContainerCreatedCallback(callback: () => void): void {
    this.onContainerCreated = callback;
  }

  private createInitialState(): IGameState {
    return {
      currentLevel: 1,
      levelScore: 0,
      totalScore: 0,
      gameStarted: false,
      gameOver: false,
      levelComplete: false,
    };
  }

  private createInitialLevel(): Level {
    return {
      number: 1,
      totalLayers: 10,
      layersGenerated: 0,
      layers: [],
    };
  }

  private initializeContainers(activeScrewColors?: ScrewColor[], virtualGameWidth?: number, virtualGameHeight?: number): void {
    let colors: ScrewColor[];

    if (activeScrewColors && activeScrewColors.length >= GAME_CONFIG.containers.count) {
      // Use colors from active screws if we have enough
      colors = getRandomColorsFromList(activeScrewColors, GAME_CONFIG.containers.count);
    } else {
      // Fallback to random colors for initial setup
      colors = getRandomScrewColors(GAME_CONFIG.containers.count);
    }

    // Use provided virtual dimensions or fall back to original canvas dimensions
    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;
    const currentHeight = virtualGameHeight || GAME_CONFIG.canvas.height;

    // Calculate container positioning based on current virtual width
    const containerWidth = 120; // Container width
    const containerSpacing = 5; // Gap between containers
    const totalContainersWidth = (GAME_CONFIG.containers.count * containerWidth) + ((GAME_CONFIG.containers.count - 1) * containerSpacing);
    const startX = (currentWidth - totalContainersWidth) / 2;

    this.containers = colors.map((color, index) => ({
      id: `container-${index}`,
      color,
      position: {
        x: startX + (containerWidth / 2) + index * (containerWidth + containerSpacing),
        y: currentHeight * (UI_CONSTANTS.header.height + UI_CONSTANTS.containers.height / 2) / GAME_CONFIG.canvas.height
      },
      holes: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      reservedHoles: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      maxHoles: GAME_CONFIG.containers.maxHoles,
      isFull: false,
    }));
  }

  private initializeHoldingHoles(virtualGameWidth?: number, virtualGameHeight?: number): void {
    // Use provided virtual dimensions or fall back to original canvas dimensions
    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;
    const currentHeight = virtualGameHeight || GAME_CONFIG.canvas.height;

    const scaledHeaderHeight = currentHeight * (UI_CONSTANTS.header.height / GAME_CONFIG.canvas.height);

    const scaledContainerHeight = currentHeight * (UI_CONSTANTS.containers.height / GAME_CONFIG.canvas.height);

    const scaledHoldingHoleHeight = currentHeight * (UI_CONSTANTS.holdingHoles.height / GAME_CONFIG.canvas.height);

    // Calculate holdingY based on the proportion of the original design height
    const holdingY = scaledHeaderHeight + scaledContainerHeight + (scaledHoldingHoleHeight / 2);

    // Calculate holding holes positioning based on current virtual width
    const screwDiameter = 24; // Screw diameter
    const holeSpacing = 5; // Gap between holes
    const totalHolesWidth = (GAME_CONFIG.holdingHoles.count * screwDiameter) + ((GAME_CONFIG.holdingHoles.count - 1) * holeSpacing);
    const startX = (currentWidth - totalHolesWidth) / 2;

    this.holdingHoles = Array.from({ length: GAME_CONFIG.holdingHoles.count }, (_, index) => ({
      id: `holding-${index}`,
      position: { 
        x: startX + (screwDiameter / 2) + index * (screwDiameter + holeSpacing),
        y: holdingY 
      },
      screw: null,
    }));
  }

  public getState(): IGameState {
    return { ...this.state };
  }

  public getLevel(): Level {
    return { ...this.level, layers: [...this.level.layers] };
  }

  public getContainers(): Container[] {
    return this.containers.map(container => ({
      ...container,
      holes: [...container.holes],
      reservedHoles: [...container.reservedHoles],
    }));
  }

  public getHoldingHoles(): HoldingHole[] {
    return this.holdingHoles.map(hole => ({ ...hole }));
  }

  public startGame(): void {
    this.state.gameStarted = true;
    this.state.gameOver = false;
    this.state.levelComplete = false;
  }

  public hasGameInProgress(): boolean {
    // Check if there's a saved game that's started but not finished
    const savedData = localStorage.getItem('par-shape-2d-save');
    console.log('=== CHECKING GAME IN PROGRESS ===');
    console.log('Saved data exists:', !!savedData);

    if (!savedData) return false;

    try {
      const data = JSON.parse(savedData);
      console.log('Parsed save data structure:', {
        hasState: !!data.state,
        hasGameState: !!data.gameState,
        hasLayerManagerState: !!data.layerManagerState
      });

      // Handle both old and new save formats
      const state = data.gameState || data.state;
      console.log('Game state:', {
        gameStarted: state?.gameStarted,
        gameOver: state?.gameOver,
        levelComplete: state?.levelComplete
      });

      const hasGame = state && state.gameStarted && !state.gameOver && !state.levelComplete;
      console.log('Has game in progress:', hasGame);

      return hasGame;
    } catch (error) {
      console.error('Failed to check saved game:', error);
      return false;
    }
  }

  public endGame(): void {
    this.state.gameOver = true;
    this.state.gameStarted = false;
  }

  public completeLevel(): void {
    this.state.levelComplete = true;
    this.state.totalScore += this.state.levelScore;
  }

  public nextLevel(): void {
    this.state.currentLevel++;
    this.state.levelScore = 0;
    this.state.levelComplete = false;
    this.level = {
      number: this.state.currentLevel,
      totalLayers: 10,
      layersGenerated: 0,
      layers: [],
    };
    // Reinitialize containers with new colors
    this.initializeContainers();
    // Clear holding holes
    this.holdingHoles.forEach(hole => hole.screw = null);
  }

  public addScore(points: number): void {
    this.state.levelScore += points;
  }

  public findAvailableContainer(color: ScrewColor): Container | null {
    return this.containers.find(container => {
      if (container.color !== color || container.isFull) return false;
      // Check if there are any unreserved holes available
      return this.getAvailableHoleCount(container.id) > 0;
    }) || null;
  }

  public getFirstEmptyHoleIndex(container: Container): number {
    // Find the first empty and unreserved hole in the container
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        return i;
      }
    }
    return -1;
  }

  public calculateHolePosition(container: Container, holeIndex: number): { x: number; y: number } {
    // Calculate the exact position of a hole within a container
    // Holes are arranged horizontally: x - 36, x, x + 36
    const holeX = container.position.x - 36 + holeIndex * 36;

    return {
      x: holeX,
      y: container.position.y
    };
  }

  public findAvailableHoldingHole(): HoldingHole | null {
    return this.holdingHoles.find(hole => hole.screw === null) || null;
  }

  public addScrewToContainer(containerId: string, screw: Screw): boolean {
    const container = this.containers.find(c => c.id === containerId);
    if (!container || container.isFull) return false;

    // Check if this screw has a reservation
    const reservedIndex = container.reservedHoles.findIndex(id => id === screw.id);

    if (reservedIndex !== -1) {
      // Use the reserved hole
      if (container.holes[reservedIndex] !== null) {
        console.error(`Reserved hole ${reservedIndex} is already occupied!`);
        return false;
      }
      container.holes[reservedIndex] = screw;
      container.reservedHoles[reservedIndex] = null; // Clear reservation
      console.log(`Screw ${screw.id} placed in reserved hole ${reservedIndex}`);
    } else {
      // Find first available unreserved hole
      const emptyHoleIndex = this.getFirstEmptyHoleIndex(container);
      if (emptyHoleIndex === -1) return false;

      container.holes[emptyHoleIndex] = screw;
      console.log(`Screw ${screw.id} placed in unreserved hole ${emptyHoleIndex}`);
    }

    container.isFull = container.holes.every(hole => hole !== null);
    return true;
  }

  public addScrewToHoldingHole(holeId: string, screw: Screw): boolean {
    const hole = this.holdingHoles.find(h => h.id === holeId);
    if (!hole || hole.screw !== null) return false;

    hole.screw = screw;
    return true;
  }

  public markContainerForRemoval(containerId: string): void {
    const container = this.containers.find(c => c.id === containerId);
    if (container && container.isFull && !container.isMarkedForRemoval) {
      container.isMarkedForRemoval = true;
      container.removalTimer = 750; // 0.75 seconds in milliseconds
      console.log(`Container ${containerId} marked for removal in 0.75 seconds`);
    }
  }

  public updateContainerTimers(deltaTime: number, activeShapes?: Shape[]): void {
    this.containers.forEach((container, index) => {
      if (container.isMarkedForRemoval && container.removalTimer !== undefined) {
        container.removalTimer -= deltaTime;

        if (container.removalTimer <= 0) {
          // Time to replace the container - include holding hole screws
          const activeScrewColors = activeShapes ? this.getAllActiveScrewColors(activeShapes) : undefined;
          this.replaceContainer(index, activeScrewColors);
        }
      }
    });
  }

  private replaceContainer(containerIndex: number, activeScrewColors?: ScrewColor[]): void {
    if (containerIndex < 0 || containerIndex >= this.containers.length) return;

    const oldContainer = this.containers[containerIndex];

    // Get existing container colors to avoid duplicates
    const existingColors = this.containers
      .filter((_, index) => index !== containerIndex)
      .map(c => c.color);

    // Get a new random color from active screws (shapes + holding holes) or fallback to any color
    let availableColors: ScrewColor[] = [];
    if (activeScrewColors && activeScrewColors.length > 0) {
      availableColors = getRandomColorsFromList(activeScrewColors, 1, existingColors);
      console.log(`Selecting container color from active screws: [${activeScrewColors.join(', ')}], avoiding [${existingColors.join(', ')}], selected: ${availableColors[0] || 'none'}`);
    }

    // Fallback to any available color if no active shape colors work
    if (availableColors.length === 0) {
      availableColors = getRandomScrewColors(1, existingColors);
    }

    if (availableColors.length === 0) {
      // Fallback: just reset the container
      oldContainer.holes.fill(null);
      oldContainer.isFull = false;
      oldContainer.isMarkedForRemoval = false;
      oldContainer.removalTimer = undefined;
      return;
    }

    // Replace the container with a new one
    this.containers[containerIndex] = {
      id: `container-${Date.now()}`,
      color: availableColors[0],
      position: oldContainer.position,
      holes: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      reservedHoles: new Array(GAME_CONFIG.containers.maxHoles).fill(null),
      maxHoles: GAME_CONFIG.containers.maxHoles,
      isFull: false,
      isMarkedForRemoval: false,
      removalTimer: undefined,
    };

    console.log(`Container replaced with color ${availableColors[0]}`);

    // Trigger save callback when new container is created
    if (this.onContainerCreated) {
      this.onContainerCreated();
    }

    // Note: GameManager will handle moving holding screws to new containers
  }

  public removeContainer(containerIndex: number): void {
    if (containerIndex >= 0 && containerIndex < this.containers.length) {
      const removedContainer = this.containers[containerIndex];
      this.containers.splice(containerIndex, 1);
      console.log(`Container ${removedContainer.id} removed (no replacement available)`);
    }
  }

  public reserveContainerHole(containerId: string, screwId: string): number | null {
    const container = this.containers.find(c => c.id === containerId);
    if (!container) return null;

    // Find first available hole (not occupied and not reserved)
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        container.reservedHoles[i] = screwId;
        console.log(`Reserved hole ${i} in container ${containerId} for screw ${screwId}`);
        return i;
      }
    }
    return null;
  }

  public unreserveContainerHole(containerId: string, screwId: string): void {
    const container = this.containers.find(c => c.id === containerId);
    if (!container) return;

    const holeIndex = container.reservedHoles.findIndex(id => id === screwId);
    if (holeIndex !== -1) {
      container.reservedHoles[holeIndex] = null;
      console.log(`Unreserved hole ${holeIndex} in container ${containerId} for screw ${screwId}`);
    }
  }

  public getAvailableHoleCount(containerId: string): number {
    const container = this.containers.find(c => c.id === containerId);
    if (!container) return 0;

    let available = 0;
    for (let i = 0; i < container.maxHoles; i++) {
      if (!container.holes[i] && !container.reservedHoles[i]) {
        available++;
      }
    }
    return available;
  }

  public getHoldingScrewsReadyForContainers(): { screw: Screw; holeId: string; containerId: string }[] {
    const readyScrews: { screw: Screw; holeId: string; containerId: string }[] = [];

    this.holdingHoles.forEach(hole => {
      if (hole.screw) {
        const availableContainer = this.findAvailableContainer(hole.screw.color);
        if (availableContainer) {
          readyScrews.push({
            screw: hole.screw,
            holeId: hole.id,
            containerId: availableContainer.id
          });
        }
      }
    });

    return readyScrews;
  }

  public removeScrewFromHoldingHole(holeId: string): Screw | null {
    const hole = this.holdingHoles.find(h => h.id === holeId);
    if (hole && hole.screw) {
      const screw = hole.screw;
      hole.screw = null;
      return screw;
    }
    return null;
  }

  public isHoldingAreaFull(): boolean {
    return this.holdingHoles.every(hole => hole.screw !== null);
  }

  public save(layerManagerState?: import('@/types/game').SerializableLayerManagerState, screwManagerState?: { animatingScrews: import('@/types/game').SerializableScrew[] }): void {
    const saveData: import('@/types/game').FullGameSave = {
      gameState: this.state,
      level: this.level,
      containers: this.containers,
      holdingHoles: this.holdingHoles,
      layerManagerState: layerManagerState || {
        layers: [],
        layerCounter: 0,
        depthCounter: 0,
        physicsGroupCounter: 0,
        colorCounter: 0,
        totalLayersForLevel: 10,
        layersGeneratedThisLevel: 0,
      },
      screwManagerState: screwManagerState || {
        animatingScrews: [],
      },
    };
    localStorage.setItem('par-shape-2d-save', JSON.stringify(saveData));
  }

  public load(): boolean {
    try {
      const savedData = localStorage.getItem('par-shape-2d-save');
      if (!savedData) return false;

      const data = JSON.parse(savedData);

      // Support both old and new save formats
      if (data.gameState) {
        // New format with full game save
        this.state = data.gameState || this.createInitialState();
        this.level = data.level || this.createInitialLevel();
        this.containers = data.containers || [];
        this.holdingHoles = data.holdingHoles || [];
      } else {
        // Old format for backward compatibility
        this.state = data.state || this.createInitialState();
        this.level = data.level || this.createInitialLevel();
        this.containers = data.containers || [];
        this.holdingHoles = data.holdingHoles || [];
      }

      // Validate loaded data
      if (this.containers.length === 0) {
        this.initializeContainers();
      }
      if (this.holdingHoles.length === 0) {
        this.initializeHoldingHoles();
      }

      // Recalculate positions to ensure proper centering
      this.recalculatePositions();

      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  public getFullSaveData(): import('@/types/game').FullGameSave | null {
    try {
      const savedData = localStorage.getItem('par-shape-2d-save');
      if (!savedData) return null;

      const data = JSON.parse(savedData);

      // Only return data if it's in the new full format
      if (data.gameState && data.layerManagerState) {
        return data as import('@/types/game').FullGameSave;
      }

      return null;
    } catch (error) {
      console.error('Failed to get full save data:', error);
      return null;
    }
  }

  public getUniqueShapeColors(shapes: Shape[]): Set<ScrewColor> {
    // Add colors from screws in shapes

    const colorSet = new Set<ScrewColor>();
    shapes.forEach(shape => {
      shape.screws.forEach(screw => {
        if (!screw.isCollected) {
          colorSet.add(screw.color);
        }
      });
    });

    return colorSet;
  }

  public getAllActiveScrewColors(shapes: Shape[]): ScrewColor[] {
    const colorSet = this.getUniqueShapeColors(shapes);

    // Add colors from screws in holding holes
    this.holdingHoles.forEach(hole => {
      if (hole.screw) {
        colorSet.add(hole.screw.color);
      }
    });

    return Array.from(colorSet);
  }

  public updateContainersFromActiveScrewColors(activeScrewColors: ScrewColor[], virtualGameWidth?: number, virtualGameHeight?: number): void {
    console.log('Current containers before update:', this.containers.map(c => c.color));

    // Only update if we have enough unique colors
    if (activeScrewColors.length >= GAME_CONFIG.containers.count) {
      console.log(`Updating containers with active screw colors: ${activeScrewColors.join(', ')}`);
      this.initializeContainers(activeScrewColors, virtualGameWidth, virtualGameHeight);
    } else {
      console.log(`Not enough screw colors (${activeScrewColors.length}) to update containers, keeping current colors`);
    }

    console.log('Containers after update:', this.containers.map(c => c.color));
  }

  public recalculatePositions(virtualGameWidth?: number, virtualGameHeight?: number): void {
    // Use provided virtual dimensions or fall back to original canvas dimensions
    const currentWidth = virtualGameWidth || GAME_CONFIG.canvas.width;
    const currentHeight = virtualGameHeight || GAME_CONFIG.canvas.height;

    const scaledHeaderHeight = currentHeight * (UI_CONSTANTS.header.height / GAME_CONFIG.canvas.height);

    const scaledContainerHeight = currentHeight * (UI_CONSTANTS.containers.height / GAME_CONFIG.canvas.height);

    const scaledHoldingHoleHeight = currentHeight * (UI_CONSTANTS.holdingHoles.height / GAME_CONFIG.canvas.height);

    // Calculate holdingY based on the proportion of the original design height
    const holdingY = scaledHeaderHeight + scaledContainerHeight + (scaledHoldingHoleHeight / 2);

    // Recalculate container positions
    if (this.containers.length > 0) {
      const containerWidth = 120;
      const containerSpacing = 5;
      const totalContainersWidth = (this.containers.length * containerWidth) + ((this.containers.length - 1) * containerSpacing);
      const startX = (currentWidth - totalContainersWidth) / 2;

      this.containers.forEach((container, index) => {
        container.position.x = startX + (containerWidth / 2) + index * (containerWidth + containerSpacing);
        container.position.y = currentHeight * (UI_CONSTANTS.header.height + UI_CONSTANTS.containers.height / 2) / GAME_CONFIG.canvas.height;
      });
    }

    // Recalculate holding hole positions
    if (this.holdingHoles.length > 0) {
      const screwDiameter = 24;
      const holeSpacing = 5;
      const totalHolesWidth = (this.holdingHoles.length * screwDiameter) + ((this.holdingHoles.length - 1) * holeSpacing);
      const startX = (currentWidth - totalHolesWidth) / 2;

      this.holdingHoles.forEach((hole, index) => {
        hole.position.x = startX + (screwDiameter / 2) + index * (screwDiameter + holeSpacing);
        hole.position.y = holdingY;
      });
    }
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.level = this.createInitialLevel();
    this.initializeContainers();
    this.initializeHoldingHoles();
    localStorage.removeItem('par-shape-2d-save');
  }
}
