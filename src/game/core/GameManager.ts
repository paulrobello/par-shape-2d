import {PhysicsWorld} from '@/game/physics/PhysicsWorld';
import {GameState} from '@/game/core/GameState';
import {GameLoop} from '@/game/core/GameLoop';
import {LayerManager} from '@/game/systems/LayerManager';
import {Layer} from '@/game/entities/Layer';
import {Screw} from '@/game/entities/Screw';
import {Shape} from '@/game/entities/Shape';
import {ShapeRenderer} from '@/game/rendering/ShapeRenderer';
import {ScrewRenderer} from '@/game/rendering/ScrewRenderer';
import {SCREW_COLORS, UI_CONSTANTS, GAME_CONFIG} from '@/game/utils/Constants';
import {Vector2, RenderContext} from '@/types/game';
import {Body} from 'matter-js';

export class GameManager {
    private physicsWorld: PhysicsWorld;
    private gameState: GameState;
    private gameLoop: GameLoop;
    private layerManager: LayerManager;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private debugMode: boolean = false;

    // Canvas scaling properties
    private canvasScale: number = 1;
    private canvasOffset: Vector2 = {x: 0, y: 0};

    // Virtual game dimensions that fill the actual screen
    private virtualGameWidth: number = GAME_CONFIG.canvas.width;
    private virtualGameHeight: number = GAME_CONFIG.canvas.height;

    // Game over delay timer
    private gameOverTimer: number | null = null;
    private gameOverDelay: number = 5000; // 5 seconds in milliseconds
    private justRestarted: boolean = false;

    // Menu overlay state
    private showMenuOverlay: boolean = false;

    // Event callbacks
    private onScrewCollected: ((screwId: string) => void) | null = null;
    private onShapeCleared: ((shapeId: string) => void) | null = null;
    private onLevelComplete: (() => void) | null = null;
    private onGameOver: (() => void) | null = null;

    constructor() {
        this.physicsWorld = new PhysicsWorld();
        this.gameState = new GameState();
        this.layerManager = new LayerManager(this.physicsWorld);
        this.gameLoop = new GameLoop(60, this.update.bind(this), this.render.bind(this));

        // Set up save callbacks for specific game events
        this.setupSaveCallbacks();
    }

    private setupSaveCallbacks(): void {
        // Save when new layers are created
        this.layerManager.setOnLayerCreatedCallback(() => {
            this.saveFullGameState();
        });

        // Save when layers are cleared
        this.layerManager.setOnLayerClearedCallback(() => {
            this.saveFullGameState();
        });

        // Save when new containers are created
        this.gameState.setOnContainerCreatedCallback(() => {
            this.saveFullGameState();
        });

        // Set bounds callback for new layer creation
        this.layerManager.setGetCurrentBoundsCallback(() => {
            return this.getCurrentPlayableBounds();
        });
    }

    public initialize(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        if (!this.ctx) {
            throw new Error('Unable to get 2D rendering context');
        }

        console.log(`INITIALIZE: Canvas dimensions at initialization: ${canvas.width}x${canvas.height}`);

        // Apply initial canvas scaling
        this.updateCanvasScaling();

        // Try to load saved game with error handling
        try {
            this.gameState.load();
        } catch (error) {
            console.error('Failed to load saved game, clearing save data:', error);
            localStorage.removeItem('par-shape-2d-save');
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.canvas) return;

        // Mouse events (desktop)
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Touch events (mobile)
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {passive: false});
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), {passive: false});
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {passive: false});
    }

    private handleClick(event: MouseEvent): void {
        console.log('=== CLICK DETECTED ===');
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickPoint: Vector2 = this.transformCanvasCoordinates(event.clientX - rect.left, event.clientY - rect.top);

        // Check for menu button clicks first
        if (this.checkMenuButtonClick(clickPoint)) {
            console.log('Menu button clicked - toggling overlay');
            this.showMenuOverlay = !this.showMenuOverlay;
            return;
        }

        // Check for menu overlay button clicks
        if (this.showMenuOverlay && this.checkMenuOverlayClick(clickPoint)) {
            console.log('Menu overlay button clicked');
            return; // Menu overlay click handled, don't process game input
        }

        // If menu overlay is showing but click was outside menu area, close it
        if (this.showMenuOverlay) {
            console.log('Click outside menu - closing overlay');
            this.showMenuOverlay = false;
            return;
        }

        // Process normal game input
        this.handleInput(clickPoint, 'mouse');
    }

    private checkMenuButtonClick(point: Vector2): boolean {
        // Menu button dimensions and position (same as in renderMenuButton)
        const buttonSize = 35;
        const margin = 15;
        const x = this.virtualGameWidth - buttonSize - margin;
        const y = margin;

        return point.x >= x && point.x <= x + buttonSize &&
            point.y >= y && point.y <= y + buttonSize;
    }

    private checkMenuOverlayClick(point: Vector2): boolean {
        // Menu overlay panel dimensions (same as in renderMenuOverlay)
        const panelWidth = 300;
        const panelHeight = 250;
        const panelX = (this.virtualGameWidth - panelWidth) / 2;
        const panelY = (this.virtualGameHeight - panelHeight) / 2;

        // Check if click is within the menu panel
        const withinPanel = point.x >= panelX && point.x <= panelX + panelWidth &&
            point.y >= panelY && point.y <= panelY + panelHeight;

        if (withinPanel) {
            // Check which button was clicked
            const buttonWidth = 200;
            const buttonHeight = 40;
            const buttonX = panelX + (panelWidth - buttonWidth) / 2;
            const buttonSpacing = 50;

            const buttons = [
                {text: 'Start Game', y: panelY + 80, action: () => this.handleMenuAction('start')},
                {text: 'Restart', y: panelY + 80 + buttonSpacing, action: () => this.handleMenuAction('restart')},
                {text: 'Debug Mode', y: panelY + 80 + (buttonSpacing * 2), action: () => this.handleMenuAction('debug')}
            ];

            for (const button of buttons) {
                if (point.x >= buttonX && point.x <= buttonX + buttonWidth &&
                    point.y >= button.y && point.y <= button.y + buttonHeight) {
                    console.log(`Menu button clicked: ${button.text}`);
                    button.action();
                    this.showMenuOverlay = false; // Close menu after action
                    return true;
                }
            }
        }

        return withinPanel; // Return true if within panel (even if no button clicked) to prevent game input
    }

    private handleMenuAction(action: string): void {
        switch (action) {
            case 'start':
                console.log('Menu action: Start Game');
                this.start();
                break;
            case 'restart':
                console.log('Menu action: Restart');
                this.restart();
                break;
            case 'debug':
                console.log('Menu action: Toggle Debug Mode');
                this.toggleDebugMode();
                break;
            default:
                console.log(`Unknown menu action: ${action}`);
        }
    }

    private handleTouchStart(event: TouchEvent): void {
        console.log('=== TOUCH START DETECTED ===');
        event.preventDefault(); // Prevent zoom/scroll on mobile

        if (!this.canvas || event.touches.length === 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const touchPoint: Vector2 = this.transformCanvasCoordinates(
            event.touches[0].clientX - rect.left,
            event.touches[0].clientY - rect.top
        );

        // Check for menu button touches first
        if (this.checkMenuButtonClick(touchPoint)) {
            console.log('Menu button touched - toggling overlay');
            this.showMenuOverlay = !this.showMenuOverlay;
            return;
        }

        // Check for menu overlay button touches
        if (this.showMenuOverlay && this.checkMenuOverlayClick(touchPoint)) {
            console.log('Menu overlay button touched');
            return; // Menu overlay touch handled, don't process game input
        }

        // If menu overlay is showing but touch was outside menu area, close it
        if (this.showMenuOverlay) {
            console.log('Touch outside menu - closing overlay');
            this.showMenuOverlay = false;
            return;
        }

        // Process normal game input
        this.handleInput(touchPoint, 'touch');
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault(); // Prevent click events from firing after touch
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault(); // Prevent scrolling while touching canvas
    }

    private handleInput(point: Vector2, inputType: 'mouse' | 'touch'): void {
        if (!this.canvas) return;

        const state = this.gameState.getState();
        console.log(`${inputType} input - Full game state:`, JSON.stringify(state, null, 2));
        console.log(`${inputType} input - gameOver:`, state.gameOver);
        console.log(`${inputType} input - gameStarted:`, state.gameStarted);
        console.log(`${inputType} input - levelComplete:`, state.levelComplete);

        // Handle different game states
        // Check game over FIRST before checking gameStarted
        if (state.gameOver) {
            // Game over - restart the game
            console.log(`Game over ${inputType} input detected - calling restart()`);
            this.restart();
            return;
        }

        if (!state.gameStarted) {
            // Game hasn't started yet
            this.start();
            return;
        }

        if (state.levelComplete) {
            // Level complete - go to next level
            this.nextLevel();
            return;
        }

        // Handle screw removal logic here
        this.handleScrewInput(point, inputType);
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const mousePoint: Vector2 = this.transformCanvasCoordinates(event.clientX - rect.left, event.clientY - rect.top);

        // Handle hover effects here
        this.handleMouseHover(mousePoint);
    }

    private handleScrewInput(point: Vector2, inputType: 'mouse' | 'touch'): void {
        console.log(`
=== SCREW ${inputType.toUpperCase()} INPUT DEBUG ===`);
        console.log(`${inputType} point:`, point);
        console.log(`Canvas dimensions:`, this.canvas?.width, this.canvas?.height);

        const screwManager = this.layerManager.getScrewManager();
        const allShapes = this.layerManager.getAllShapes();

        // Debug: Log all shapes and their layers
        console.log('All shapes and their layers:');
        allShapes.forEach(shape => {
            const layer = this.layerManager.getLayer(shape.layerId);
            console.log(`  Shape ${shape.id} (${shape.color}) - Layer ${shape.layerId} (index: ${layer?.index ?? 'unknown'}, depthIndex: ${layer?.depthIndex ?? 'unknown'})`);
        });

        let screw: Screw | null = null;

        // Use smart screw selection for both mouse and touch input
        screw = this.getSmartScrewSelection(point, allShapes, inputType);

        console.log('Selected screw result:', screw ? {
            id: screw.id,
            color: screw.color,
            isRemovable: screw.isRemovable,
            isCollected: screw.isCollected,
            isBeingCollected: screw.isBeingCollected,
            shapeId: screw.shapeId
        } : 'null');

        if (screw && screw.isRemovable && !screw.isCollected && !screw.isBeingCollected) {
            console.log(`Removing screw ${screw.id} with color ${screw.color}`);

            // Trigger haptic feedback for mobile
            if (inputType === 'touch') {
                this.triggerHapticFeedback('light');
            }

            // Try to find an available container for this screw color
            const availableContainer = this.gameState.findAvailableContainer(screw.color);

            if (availableContainer) {
                // Reserve a hole for this screw
                const reservedHoleIndex = this.gameState.reserveContainerHole(availableContainer.id, screw.id);
                if (reservedHoleIndex !== null) {
                    const targetPosition = this.gameState.calculateHolePosition(availableContainer, reservedHoleIndex);

                    // Set the target container for this screw
                    screw.targetContainerId = availableContainer.id;

                    // Start screw collection animation to exact hole position
                    const success = screwManager.startScrewCollection(screw.id, targetPosition);
                    if (success) {
                        // Remove the screw constraint
                        screwManager.removeScrewFromShape(screw.id, this.layerManager.getAllShapes());
                        // Add score
                        this.gameState.addScore(10);
                        console.log(`Screw ${screw.id} flying to container ${availableContainer.id} hole ${reservedHoleIndex} (reserved)`);
                    } else {
                        // Failed to start animation, unreserve the hole and clear target
                        this.gameState.unreserveContainerHole(availableContainer.id, screw.id);
                        screw.targetContainerId = undefined;
                    }
                } else {
                    console.log(`No holes available in container ${availableContainer.id} after reservation check`);
                }
            } else {
                // Try to place in holding hole
                const availableHole = this.gameState.findAvailableHoldingHole();
                if (availableHole) {
                    // Clear any container target since this is going to holding hole
                    screw.targetContainerId = undefined;

                    const success = screwManager.startScrewCollection(screw.id, availableHole.position);
                    if (success) {
                        screwManager.removeScrewFromShape(screw.id, this.layerManager.getAllShapes());
                        this.gameState.addScore(5); // Less points for holding hole
                        console.log(`Screw ${screw.id} flying to holding hole ${availableHole.id}`);
                    }
                } else {
                    console.log('No available containers or holding holes!');
                    // Could show a visual indication that the screw can't be removed
                }
            }
        } else if (screw && !screw.isRemovable) {
            console.log('Screw is blocked by another shape');
        } else {
            console.log(`No screw found at ${inputType} point`);
        }
    }

    private getSmartScrewSelection(point: Vector2, allShapes: Shape[], inputType: 'mouse' | 'touch' = 'touch'): Screw | null {
        const screwManager = this.layerManager.getScrewManager();
        // Use different radii for different input types
        const touchRadius = inputType === 'touch' ? 30 : 15; // Smaller radius for precise mouse clicks

        // Find all screws within touch radius that are removable
        const candidateScrews: Screw[] = [];
        const allScrews = screwManager.getAllScrews();

        console.log(`Total screws in game: ${allScrews.length}, using ${inputType} radius: ${touchRadius}px`);

        for (const screw of allScrews) {
            const distance = screw.getDistance(point);
            console.log(`Screw ${screw.id} distance: ${distance.toFixed(2)}px, removable: ${screw.isRemovable}, collected: ${screw.isCollected}, beingCollected: ${screw.isBeingCollected}`);

            if (!screw.isRemovable || screw.isCollected || screw.isBeingCollected) {
                console.log(`  Skipping screw ${screw.id}: not removable or already processed`);
                continue;
            }

            if (distance <= touchRadius) {
                console.log(`  Screw ${screw.id} within touch radius (${touchRadius}px)`);
                // Check if screw is actually removable (not blocked)
                const screwShape = allShapes.find(shape => shape.id === screw.shapeId);
                if (screwShape) {
                    const screwLayerIndex = this.layerManager.getLayer(screwShape.layerId)?.depthIndex ?? -1;
                    console.log(`    Screw ${screw.id} in layer ${screwShape.layerId} (depthIndex: ${screwLayerIndex})`);

                    // Check if screw is blocked by shapes in front layers
                    const isBlocked = allShapes.some(shape => {
                        if (shape.id === screw.shapeId) return false;

                        const shapeLayerIndex = this.layerManager.getLayer(shape.layerId)?.depthIndex ?? -1;
                        if (shapeLayerIndex >= screwLayerIndex) return false;

                        const blocking = screwManager.isPointInActualShape(screw.position, shape);
                        if (blocking) {
                            console.log(`      Blocked by shape ${shape.id} in layer ${shape.layerId} (depthIndex: ${shapeLayerIndex})`);
                        }
                        return blocking;
                    });

                    if (!isBlocked) {
                        console.log(`    Adding screw ${screw.id} to candidates`);
                        candidateScrews.push(screw);
                    } else {
                        console.log(`    Screw ${screw.id} is blocked by shapes in front`);
                    }
                } else {
                    console.log(`    No shape found for screw ${screw.id}`);
                }
            } else {
                console.log(`  Screw ${screw.id} outside touch radius (${distance.toFixed(2)} > ${touchRadius})`);
            }
        }

        console.log(`Found ${candidateScrews.length} candidate screws within touch radius`);

        if (candidateScrews.length === 0) {
            return null;
        }

        if (candidateScrews.length === 1) {
            return candidateScrews[0];
        }

        // Multiple screws in touch area - apply smart selection
        // Priority 1: Screw that matches a container with available holes
        const availableContainers = this.gameState.getContainers().filter(c => !c.isFull);
        for (const container of availableContainers) {
            const matchingScrew = candidateScrews.find(screw => screw.color === container.color);
            if (matchingScrew) {
                console.log(`Smart selection: chose screw ${matchingScrew.id} (${matchingScrew.color}) matching available container`);
                return matchingScrew;
            }
        }

        // Priority 2: Closest screw to the center of the touch point
        const closestScrew = candidateScrews.reduce((closest, current) => {
            const closestDist = closest.getDistance(point);
            const currentDist = current.getDistance(point);
            return currentDist < closestDist ? current : closest;
        });

        console.log(`Smart selection: chose screw ${closestScrew.id} (${closestScrew.color}) closest to touch center`);
        return closestScrew;
    }

    private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
        if ('vibrate' in navigator) {
            // Standard vibration API
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30]
            };
            navigator.vibrate(patterns[type]);
        } else if ('hapticFeedback' in navigator) {
            // iOS Safari haptic feedback (if available)
            try {
                (navigator as any).hapticFeedback?.selection(); // eslint-disable-line @typescript-eslint/no-explicit-any
            } catch {
                console.log('Haptic feedback not available');
            }
        }
    }

    private handleScrewCollectionComplete(screw: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
        // If screw has a target container, try that first
        if (screw.targetContainerId) {
            const success = this.gameState.addScrewToContainer(screw.targetContainerId, screw);
            if (success) {
                console.log(`Screw ${screw.id} added to reserved container ${screw.targetContainerId}`);

                // Get the container to check if it's full
                const container = this.gameState.getContainers().find(c => c.id === screw.targetContainerId);
                if (container && container.isFull) {
                    this.gameState.markContainerForRemoval(screw.targetContainerId);
                    console.log(`Container ${screw.targetContainerId} is full and will be removed in 0.75 seconds`);
                    // Trigger haptic feedback for container being filled
                    this.triggerHapticFeedback('medium');
                }

                // Clear the target container since screw is now placed
                screw.targetContainerId = undefined;

                // Save state after screw is successfully placed in container
                this.saveFullGameState();
                return;
            } else {
                console.error(`Failed to add screw ${screw.id} to reserved container ${screw.targetContainerId}`);
                // Clear the target and try fallback logic
                screw.targetContainerId = undefined;
            }
        }

        // Fallback: try to find any available container
        const availableContainer = this.gameState.findAvailableContainer(screw.color);
        if (availableContainer) {
            const success = this.gameState.addScrewToContainer(availableContainer.id, screw);
            if (success) {
                console.log(`Screw ${screw.id} added to fallback container ${availableContainer.id}`);

                // Check if container is full and mark for removal
                if (availableContainer.isFull) {
                    this.gameState.markContainerForRemoval(availableContainer.id);
                    console.log(`Container ${availableContainer.id} is full and will be removed in 0.75 seconds`);
                }

                // Save state after screw is successfully placed in fallback container
                this.saveFullGameState();
                return;
            }
        }

        // Try to add to holding hole
        const availableHole = this.gameState.findAvailableHoldingHole();
        if (availableHole) {
            const success = this.gameState.addScrewToHoldingHole(availableHole.id, screw);
            if (success) {
                console.log(`Screw ${screw.id} added to holding hole ${availableHole.id}`);
                // Clear target container since screw is now in holding hole
                screw.targetContainerId = undefined;

                // Save state after screw is successfully placed in holding hole
                this.saveFullGameState();
                return;
            }
        }

        console.warn('Could not place collected screw anywhere!');
        // Clear target container as fallback
        screw.targetContainerId = undefined;
    }

    private checkHoldingScrewsForContainers(): void {
        const readyScrews = this.gameState.getHoldingScrewsReadyForContainers();

        // Only process if there are screws ready to move
        if (readyScrews.length === 0) return;

        readyScrews.forEach(({screw, holeId, containerId}) => {
            // Reserve a hole for this holding screw
            const reservedHoleIndex = this.gameState.reserveContainerHole(containerId, screw.id);
            if (reservedHoleIndex !== null) {
                // Calculate target position for the reserved hole
                const container = this.gameState.getContainers().find(c => c.id === containerId);
                if (container) {
                    const targetPosition = this.gameState.calculateHolePosition(container, reservedHoleIndex);

                    // Remove screw from holding hole
                    const removedScrew = this.gameState.removeScrewFromHoldingHole(holeId);
                    if (removedScrew) {
                        // Set the target container for this screw
                        removedScrew.targetContainerId = containerId;

                        // Start animation from holding hole to container
                        const screwManager = this.layerManager.getScrewManager();

                        // Check if screw exists in manager and update its state
                        const screwFromManager = screwManager.getScrew(removedScrew.id);
                        if (screwFromManager) {
                            // Reset screw state for animation from holding hole to container
                            screwFromManager.isCollected = false;
                            screwFromManager.isRemovable = true;
                            screwFromManager.isBeingCollected = false;
                            screwFromManager.targetContainerId = containerId;

                            const success = screwManager.startScrewCollection(removedScrew.id, targetPosition);
                            if (success) {
                                console.log(`Holding screw ${removedScrew.id} flying to container ${containerId} hole ${reservedHoleIndex}`);
                            } else {
                                // Failed to start animation, put screw back and unreserve hole
                                this.gameState.addScrewToHoldingHole(holeId, removedScrew);
                                this.gameState.unreserveContainerHole(containerId, removedScrew.id);
                                removedScrew.targetContainerId = undefined;
                                console.error(`Failed to start holding screw animation for ${removedScrew.id}`);
                            }
                        } else {
                            // Screw doesn't exist in manager, directly place in container
                            console.log(`Screw ${removedScrew.id} not in manager, placing directly in container`);
                            const success = this.gameState.addScrewToContainer(containerId, removedScrew);
                            if (success) {
                                console.log(`Holding screw ${removedScrew.id} directly placed in container ${containerId} hole ${reservedHoleIndex}`);

                                // Check if container is full and mark for removal
                                const containers = this.gameState.getContainers();
                                const container = containers.find(c => c.id === containerId);
                                if (container && container.isFull) {
                                    this.gameState.markContainerForRemoval(containerId);
                                }
                            } else {
                                // Failed to place in container, put screw back and unreserve hole
                                this.gameState.addScrewToHoldingHole(holeId, removedScrew);
                                this.gameState.unreserveContainerHole(containerId, removedScrew.id);
                                removedScrew.targetContainerId = undefined;
                                console.error(`Failed to place holding screw ${removedScrew.id} in container`);
                            }
                        }
                    } else {
                        // Failed to remove from holding hole, unreserve the container hole
                        this.gameState.unreserveContainerHole(containerId, screw.id);
                    }
                }
            }
        });
    }

    private transformCanvasCoordinates(clientX: number, clientY: number): Vector2 {
        if (!this.canvas) return {x: clientX, y: clientY};

        // Get the actual canvas dimensions and the displayed dimensions
        const canvasRect = this.canvas.getBoundingClientRect();
        const displayScaleX = this.canvas.width / canvasRect.width;
        const displayScaleY = this.canvas.height / canvasRect.height;

        // Transform from display coordinates to canvas pixel coordinates
        const canvasX = clientX * displayScaleX;
        const canvasY = clientY * displayScaleY;

        // Transform from canvas pixel coordinates to virtual game world coordinates
        // Account for the uniform scaling and offset applied to the drawing context
        const gameX = (canvasX / this.canvasScale) - this.canvasOffset.x;
        const gameY = (canvasY / this.canvasScale) - this.canvasOffset.y;

        console.log(`Coordinate transformation: client(${clientX.toFixed(2)}, ${clientY.toFixed(2)}) -> canvas(${canvasX.toFixed(2)}, ${canvasY.toFixed(2)}) -> game(${gameX.toFixed(2)}, ${gameY.toFixed(2)}) | scale=${this.canvasScale.toFixed(3)}, offset=(${this.canvasOffset.x.toFixed(1)}, ${this.canvasOffset.y.toFixed(1)})`);

        return {
            x: gameX,
            y: gameY
        };
    }

    private handleMouseHover(_point: Vector2): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        // This will be implemented for hover effects
    }

    private update(deltaTime: number): void {
        const state = this.gameState.getState();

        if (!state.gameStarted || state.gameOver) {
            return;
        }

        // Update physics
        this.physicsWorld.update(deltaTime);

        // Update game logic
        this.updateGameLogic();
    }

    private updateGameLogic(): void {
        // Update shape positions from physics
        this.layerManager.updateShapePositions();

        // Update screw collection animations
        const collectionResult = this.layerManager.getScrewManager().updateCollectionAnimations(this.gameLoop.getTargetDelta());

        // Handle completed screw collections
        collectionResult.collected.forEach(screw => {
            this.handleScrewCollectionComplete(screw);
        });

        // Update container timers for delayed removal, passing active shapes for color selection
        const activeShapes = this.layerManager.getAllShapes();
        this.gameState.updateContainerTimers(this.gameLoop.getTargetDelta(), activeShapes);

        // Check for holding screws that can move to new containers
        this.checkHoldingScrewsForContainers();

        // Update game over timer
        this.updateGameOverTimer(this.gameLoop.getTargetDelta());

        // Check win/lose conditions
        this.checkGameConditions();
    }

    private updateGameOverTimer(deltaTime: number): void {
        if (this.gameOverTimer !== null) {
            this.gameOverTimer -= deltaTime;

            if (this.gameOverTimer <= 0) {
                // Timer expired, end the game
                this.gameOverTimer = null;
                console.log('About to call gameState.endGame()');
                this.gameState.endGame();
                console.log('Called gameState.endGame() - new state:', this.gameState.getState());
                this.onGameOver?.();
                console.log('Game over timer expired - ending game');
            }
        }
    }

    private checkGameConditions(): void {
        const state = this.gameState.getState();

        if (state.gameOver || state.levelComplete) {
            console.log('Skipping game conditions - game over or level complete');
            return;
        }

        // Skip game condition checks immediately after restart
        if (this.justRestarted) {
            console.log('Skipping game conditions - just restarted');
            return;
        }

        // Check if holding area is full (start game over timer)
        const holdingAreaFull = this.gameState.isHoldingAreaFull();
        // console.log('Checking holding area - full:', holdingAreaFull, 'timer:', this.gameOverTimer);

        if (holdingAreaFull) {
            if (this.gameOverTimer === null) {
                // Start the 3-second countdown
                this.gameOverTimer = this.gameOverDelay;
                console.log('Holding area full! Game over in 5 seconds...');
            }
            return;
        } else {
            // Reset timer if holding area is no longer full
            if (this.gameOverTimer !== null) {
                this.gameOverTimer = null;
                console.log('Holding area freed up, game over timer cancelled.');
            }
        }

        // Check if level is complete (all layers cleared and all layers generated)
        if (this.layerManager.isLevelComplete()) {
            this.gameState.completeLevel();
            this.onLevelComplete?.();
        }
    }

    private render(): void {
        if (!this.ctx || !this.canvas) return;

        // Save the current transform
        this.ctx.save();

        // Reset transform for clearing
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set background
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Restore the transform
        this.ctx.restore();

        // Reapply scaling for rendering game content
        this.updateCanvasScaling();

        const state = this.gameState.getState();

        if (state.gameOver) {
            this.renderGameOver();
            return;
        }

        // Note: Game over timer countdown is now integrated into HUD, not an overlay

        if (!state.gameStarted) {
            this.renderStartScreen();
            return;
        }

        if (state.levelComplete) {
            this.renderLevelComplete();
            return;
        }

        // Render game elements
        this.renderGame();

        // Render debug info if enabled
        if (this.debugMode) {
            this.renderDebugInfo();
        }

        // Render menu overlay on top of everything
        this.renderMenuOverlay();
    }

    private renderStartScreen(): void {
        if (!this.ctx || !this.canvas) return;

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAR Shape 2D', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '18px Arial';
        this.ctx.fillText('Click to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    private renderGameOverCountdown(): void {
        if (!this.ctx || !this.canvas) return;

        // Render the game normally first
        this.renderGame();

        // Add countdown overlay
        const countdown = Math.ceil((this.gameOverTimer || 0) / 1000);

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Countdown text
        this.ctx.fillStyle = '#FF4444';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Holding holes full!', this.canvas.width / 2, this.canvas.height / 2 - 80);
    }

    private renderGameOver(): void {
        if (!this.ctx || !this.canvas) return;

        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL FAILED...', this.canvas.width / 2, this.canvas.height / 2 - 50);

        const state = this.gameState.getState();
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Final Score: ${state.totalScore}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private renderLevelComplete(): void {
        if (!this.ctx || !this.canvas) return;

        this.ctx.fillStyle = '#44FF44';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Level Complete!', this.canvas.width / 2, this.canvas.height / 2 - 50);

        const state = this.gameState.getState();
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Level Score: ${state.levelScore}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Click anywhere to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private renderGame(): void {
        // Ensure UI element positions are current for the virtual dimensions
        this.gameState.recalculatePositions(this.virtualGameWidth, this.virtualGameHeight);

        // This will be expanded when we implement the rendering system
        this.renderHUD();
        this.renderContainerBoxesBackground();
        this.renderContainerBoxes();
        this.renderHoldingHolesBackground();
        this.renderHoldingHoles();
        this.renderGameArea();
    }

    private renderHUD(): void {
        if (!this.ctx || !this.canvas) return;

        const state = this.gameState.getState();

        // Detect mobile using the same logic as elsewhere in the codebase
        // const isMobile = this.virtualGameHeight > this.virtualGameWidth;
        const isMobile = false;

        // Calculate header dimensions based on canvas scale, not virtual dimensions
        // This ensures proper sizing regardless of virtual dimension inflation on mobile
        const baseHeaderHeight = 80;
        const scaledHeaderHeight = isMobile
            ? Math.max(baseHeaderHeight, (this.canvas?.height || GAME_CONFIG.canvas.height) * 0.1) // 10% of actual screen height on mobile
            : baseHeaderHeight * (this.virtualGameHeight / GAME_CONFIG.canvas.height); // Scale proportionally on desktop

        // Header background - fill width
        this.ctx.fillStyle = '#34495E';
        // this.ctx.fillStyle = '#AA0000'; // debug color
        this.ctx.fillRect(0, 0, this.virtualGameWidth, scaledHeaderHeight);

        // Calculate layers remaining
        const totalLayers = this.layerManager.getTotalLayersForLevel();
        const layersGenerated = this.layerManager.getLayersGeneratedThisLevel();
        const activeLayers = this.layerManager.getRemainingLayerCount();
        const layersRemaining = totalLayers - (layersGenerated - activeLayers);

        // Calculate font sizes based on canvas scale for proper mobile sizing
        const canvasScale = this.canvasScale;
        const baseFontSize = isMobile ? 22 : 18; // Larger base font for mobile readability
        const fontSize = Math.max(16, baseFontSize * Math.max(0.8, canvasScale)); // Scale with canvas but ensure minimum size
        const margin = Math.max(15, 20 * Math.max(0.8, canvasScale));

        // Calculate line spacing based on actual header height
        const lineSpacing = scaledHeaderHeight / (isMobile ? 4 : 3); // More lines on mobile
        const lineHeight1 = lineSpacing;
        const lineHeight2 = lineSpacing * 2;
        const lineHeight3 = lineSpacing * 3; // Third line for mobile

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Grand Total: ${state.totalScore}`, margin, lineHeight1);

        // Level and score text - handle mobile layout differently
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'left';

        if (isMobile) {
            // On mobile, split into separate lines for better readability
            const line1 = `Level ${state.currentLevel}  Score ${state.levelScore}`;
            const line2 = `Layers Remaining ${layersRemaining}`;

            this.ctx.fillText(line1, margin, lineHeight2);
            this.ctx.fillText(line2, margin, lineHeight3);
        } else {
            // Desktop: keep single line
            this.ctx.fillText(`Level ${state.currentLevel}  Score ${state.levelScore}   Layers Remaining ${layersRemaining}`, margin, lineHeight2);
        }

        // Game over countdown - center area
        if (this.gameOverTimer !== null) {
            const countdown = Math.ceil(this.gameOverTimer / 1000);

            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF4444';
            this.ctx.font = `bold ${Math.min(fontSize + 4, isMobile ? 20 : 20)}px Arial`;
            const countdownY = isMobile ? lineHeight1 + lineSpacing * 0.3 : lineHeight1;
            this.ctx.fillText(`HOLES FULL! ${countdown}s`, this.virtualGameWidth / 2, countdownY);
        }

        // Menu button in top right corner
        this.renderMenuButton();
    }

    private renderMenuButton(): void {
        if (!this.ctx) return;

        const buttonSize = 35;
        const margin = 15;
        const x = this.virtualGameWidth - buttonSize - margin;
        const y = margin;

        // Button background
        this.ctx.fillStyle = this.showMenuOverlay ? '#555' : '#333';
        this.ctx.fillRect(x, y, buttonSize, buttonSize);

        // Button border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, buttonSize, buttonSize);

        // Hamburger menu icon (three lines)
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        const lineLength = 20;
        const lineSpacing = 6;
        const startX = x + (buttonSize - lineLength) / 2;
        const centerY = y + buttonSize / 2;

        for (let i = 0; i < 3; i++) {
            const lineY = centerY - lineSpacing + (i * lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(startX, lineY);
            this.ctx.lineTo(startX + lineLength, lineY);
            this.ctx.stroke();
        }
    }

    private renderMenuOverlay(): void {
        if (!this.ctx || !this.showMenuOverlay) return;

        // Semi-transparent backdrop
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.virtualGameWidth, this.virtualGameHeight);

        // Menu panel
        const panelWidth = 300;
        const panelHeight = 250;
        const panelX = (this.virtualGameWidth - panelWidth) / 2;
        const panelY = (this.virtualGameHeight - panelHeight) / 2;

        // Panel background
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Title
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Menu', panelX + panelWidth / 2, panelY + 40);

        // Buttons
        const buttonWidth = 200;
        const buttonHeight = 40;
        const buttonX = panelX + (panelWidth - buttonWidth) / 2;
        const buttonSpacing = 50;

        const buttons = [
            {text: 'Start Game', y: panelY + 80},
            {text: 'Restart', y: panelY + 80 + buttonSpacing},
            {text: 'Debug Mode', y: panelY + 80 + (buttonSpacing * 2)}
        ];

        buttons.forEach(button => {
            if (!this.ctx) return;

            // Button background
            this.ctx.fillStyle = '#34495E';
            this.ctx.fillRect(buttonX, button.y, buttonWidth, buttonHeight);

            // Button border
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(buttonX, button.y, buttonWidth, buttonHeight);

            // Button text
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(button.text, buttonX + buttonWidth / 2, button.y + buttonHeight / 2 + 6);
        });
    }

    private renderContainerBoxesBackground(): void {
        if (!this.ctx || !this.canvas) return;

        // Background area for containers and holding holes
        this.ctx.fillStyle = '#34495E'; // Same as HUD background
        // this.ctx.fillStyle = '#00AA00'; // Debug

        // Calculate the scaled header height based on the virtual game dimensions
        const scaledHeaderHeight = this.virtualGameHeight * (UI_CONSTANTS.header.height / GAME_CONFIG.canvas.height);

        const scaledContainerHeight = this.virtualGameHeight * (UI_CONSTANTS.containers.height / GAME_CONFIG.canvas.height);

        this.ctx.fillRect(0, scaledHeaderHeight, this.virtualGameWidth, scaledContainerHeight);
    }

    private renderContainerBoxes(): void {
        if (!this.ctx) return;

        const containers = this.gameState.getContainers();

        containers.forEach(container => {
            const {position, color} = container;
            const containerColor = SCREW_COLORS[color];

            // Container background with rounded corners (sized for 3 full screws)
            this.ctx!.fillStyle = '#ECF0F1';
            this.ctx!.beginPath();
            this.ctx!.roundRect(position.x - UI_CONSTANTS.containers.width/2, position.y-UI_CONSTANTS.containers.height/2+1, UI_CONSTANTS.containers.width, UI_CONSTANTS.containers.height-2, 8);
            this.ctx!.fill();

            // Colored border with rounded corners
            this.ctx!.strokeStyle = containerColor;
            this.ctx!.lineWidth = 4;
            this.ctx!.beginPath();
            this.ctx!.roundRect(position.x - UI_CONSTANTS.containers.width/2, position.y-UI_CONSTANTS.containers.height/2+1, UI_CONSTANTS.containers.width, UI_CONSTANTS.containers.height-2, 8);
            this.ctx!.stroke();

            // Remove color label

            // Visual indication for removal (pulsing border, no timer number)
            if (container.isMarkedForRemoval && container.removalTimer !== undefined) {
                // Add a pulsing effect
                const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
                this.ctx!.strokeStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
                this.ctx!.lineWidth = 6;
                this.ctx!.beginPath();
                this.ctx!.roundRect(position.x - UI_CONSTANTS.containers.width/2, position.y-UI_CONSTANTS.containers.height/2+1, UI_CONSTANTS.containers.width, UI_CONSTANTS.containers.height-2, 10);
                this.ctx!.stroke();
            }

            // Container holes with screws (proper spacing for full-size screws)
            for (let i = 0; i < 3; i++) {
                const holeX = position.x - 36 + i * 36; // 36px spacing for 12px radius screws
                const holeY = position.y;

                if (container.holes[i]) {
                    // Draw collected screw using consistent rendering
                    ScrewRenderer.renderScrewPreview(
                        {x: holeX, y: holeY},
                        containerColor,
                        UI_CONSTANTS.screws.radius,
                        {ctx: this.ctx!, canvas: this.canvas!, debugMode: this.debugMode}
                    );
                } else {
                    // Draw empty hole (slightly smaller than screw radius)
                    this.ctx!.fillStyle = '#4A4A4A'; // Dark grey
                    this.ctx!.beginPath();
                    this.ctx!.arc(holeX, holeY, UI_CONSTANTS.screws.radius * 0.65, 0, Math.PI * 2);
                    this.ctx!.fill();

                    // Hole border
                    this.ctx!.strokeStyle = '#7F8C8D';
                    this.ctx!.lineWidth = 1;
                    this.ctx!.stroke();
                }
            }
        });
    }

    private renderHoldingHolesBackground(): void {
        if (!this.ctx || !this.canvas) return;

        // Background area for containers and holding holes
        this.ctx.fillStyle = '#34495E'; // Same as HUD background
        // this.ctx.fillStyle = '#0000AA'; // Debug

        // Calculate the scaled header height based on the virtual game dimensions
        const scaledHeaderHeight = this.virtualGameHeight * (UI_CONSTANTS.header.height / GAME_CONFIG.canvas.height);

        const scaledContainerHeight = this.virtualGameHeight * (UI_CONSTANTS.containers.height / GAME_CONFIG.canvas.height);

        const scaledHoldingHoleHeight = this.virtualGameHeight * (UI_CONSTANTS.holdingHoles.height / GAME_CONFIG.canvas.height);

        this.ctx.fillRect(0, scaledHeaderHeight+scaledContainerHeight, this.virtualGameWidth, scaledHoldingHoleHeight);
    }

    private renderHoldingHoles(): void {
        if (!this.ctx) return;

        const holes = this.gameState.getHoldingHoles();

        holes.forEach(hole => {
            const {position} = hole;

            // Black center fill
            this.ctx!.fillStyle = '#000000';
            this.ctx!.beginPath();
            this.ctx!.arc(position.x, position.y, UI_CONSTANTS.screws.radius *0.6, 0, Math.PI * 2);
            this.ctx!.fill();

            // Hole outline (slightly smaller than screw radius)
            this.ctx!.strokeStyle = '#BDC3C7';
            this.ctx!.lineWidth = 2;
            this.ctx!.beginPath();
            this.ctx!.arc(position.x, position.y, UI_CONSTANTS.screws.radius *0.6, 0, Math.PI * 2);
            this.ctx!.stroke();

            if (hole.screw) {
                // Draw collected screw using consistent rendering
                const screwColor = SCREW_COLORS[hole.screw.color];
                ScrewRenderer.renderScrewPreview(
                    position,
                    screwColor,
                    UI_CONSTANTS.screws.radius,
                    {ctx: this.ctx!, canvas: this.canvas!, debugMode: this.debugMode}
                );
            }
        });
    }

    private renderGameArea(): void {
        if (!this.ctx || !this.canvas) return;
        // Game area background (starts at play area)
        this.ctx.fillStyle = '#1A252F';
        const top_area = this.getFullHeaderHeight();
        this.ctx.fillRect(0, top_area, this.virtualGameWidth, this.virtualGameHeight - top_area);

        // Render shapes
        const renderContext: RenderContext = {
            ctx: this.ctx,
            canvas: this.canvas,
            debugMode: this.debugMode,
        };

        // Render layers back-to-front using depth ordering (higher depth renders first/behind)
        const sortedLayers = this.layerManager.getVisibleLayersSortedByDepth();

        sortedLayers.forEach(layer => {
            if (!this.ctx) return;

            // Apply layer fade opacity
            this.ctx.globalAlpha = layer.getFadeOpacity();

            // Render shapes in this layer first
            const layerShapes = layer.getAllShapes();
            ShapeRenderer.renderShapes(layerShapes, renderContext);

            // Then render screws for shapes in this layer
            const layerScrews = this.getScrewsForLayer(layer);
            ScrewRenderer.renderScrews(layerScrews, renderContext);

            // Then render debug info for this layer if enabled
            if (this.debugMode) {
                this.renderLayerDebugInfo(layer);
            }

            // Restore global alpha
            this.ctx.globalAlpha = 1.0;
        });

        // Render any orphaned animating screws (e.g., from holding holes to containers)
        this.renderOrphanedAnimatingScrews(renderContext, sortedLayers);

        // Show instruction text if no shapes (but only if game is active)
        const state = this.gameState.getState();
        const allShapes = this.layerManager.getAllShapes();
        if (allShapes.length === 0 && state.gameStarted && !state.gameOver && !state.levelComplete) {
            this.ctx.fillStyle = '#7F8C8D';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading new level...', this.canvas.width / 2, 400);
        }
    }

    private renderDebugInfo(): void {
        if (!this.ctx || !this.canvas) return;

        // Render non-shape physics bodies (like constraints, anchors, etc.)
        const bodies = this.physicsWorld.getAllBodies();
        const allShapes = this.layerManager.getAllShapes();
        const shapeBodies = new Set(allShapes.map(shape => shape.body));

        this.ctx!.strokeStyle = '#00FFFF'; // Different color for non-shape bodies
        this.ctx!.lineWidth = 1;

        bodies.forEach(body => {
            // Skip shape bodies (already rendered per-layer) and invisible bodies
            if (shapeBodies.has(body) || body.render?.visible === false) return;

            this.ctx!.beginPath();
            body.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    this.ctx!.moveTo(vertex.x, vertex.y);
                } else {
                    this.ctx!.lineTo(vertex.x, vertex.y);
                }
            });
            this.ctx!.closePath();
            this.ctx!.stroke();
        });
    }

    public getDebugInfo() {
        // Return debug info for external rendering
        const layersGenerated = this.layerManager.getLayersGeneratedThisLevel();
        const totalLayers = this.layerManager.getTotalLayersForLevel();
        const activeLayers = this.layerManager.getLayers().length;
        const visibleLayers = this.layerManager.getVisibleLayers().length;
        const allShapes = this.layerManager.getAllShapes();
        const allScrews = this.layerManager.getScrewManager().getAllScrews();
        const bodies = this.physicsWorld.getAllBodies();

        // Get detailed layer information
        const layerDetails = this.layerManager.getVisibleLayers()
            .sort((a, b) => a.depthIndex - b.depthIndex) // Front to back for display
            .map(layer => ({
                id: layer.id,
                index: layer.index,
                depthIndex: layer.depthIndex,
                colorIndex: layer.colorIndex,
                shapeCount: layer.getShapeCount(),
                isGenerated: layer.isGenerated,
                tint: layer.tint,
                isVisible: layer.isVisible
            }));

        return {
            layersGenerated,
            totalLayers,
            activeLayers,
            visibleLayers,
            activeShapes: allShapes.length,
            activeScrews: allScrews.length,
            physicsBodies: bodies.length,
            gameOverTimer: this.gameOverTimer !== null ? Math.ceil(this.gameOverTimer / 1000) : null,
            layerDetails
        };
    }

    private getScrewsForLayer(layer: Layer): Screw[] {
        // Get all screws for shapes in this layer
        const layerShapes = layer.getAllShapes();
        const allScrews = this.layerManager.getScrewManager().getAllScrews();

        return allScrews.filter(screw =>
            layerShapes.some(shape => shape.id === screw.shapeId)
        );
    }

    private renderOrphanedAnimatingScrews(renderContext: RenderContext, sortedLayers: Layer[]): void {
        // Find screws that are animating but not associated with any visible shape
        const allScrews = this.layerManager.getScrewManager().getAllScrews();
        const orphanedAnimatingScrews = allScrews.filter(screw => {
            // Only consider screws that are currently being collected (animating)
            if (!screw.isBeingCollected) return false;

            // Check if this screw's shape exists in any visible layer
            const hasVisibleShape = sortedLayers.some(layer =>
                layer.getAllShapes().some(shape => shape.id === screw.shapeId)
            );

            // If no visible shape, it's orphaned and should be rendered separately
            return !hasVisibleShape;
        });

        if (orphanedAnimatingScrews.length > 0) {
            console.log(`Rendering ${orphanedAnimatingScrews.length} orphaned animating screws`);
            ScrewRenderer.renderScrews(orphanedAnimatingScrews, renderContext);
        }
    }

    private renderLayerDebugInfo(layer: Layer): void {
        // Render debug outlines for shapes in this layer only
        if (!this.ctx) return;

        const layerShapes = layer.getAllShapes();

        this.ctx.strokeStyle = '#FF00FF';
        this.ctx.lineWidth = 1;

        layerShapes.forEach(shape => {
            const body = shape.body;
            if (body.render?.visible === false) return;

            this.ctx!.beginPath();
            body.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    this.ctx!.moveTo(vertex.x, vertex.y);
                } else {
                    this.ctx!.lineTo(vertex.x, vertex.y);
                }
            });
            this.ctx!.closePath();
            this.ctx!.stroke();
        });
        this.ctx.beginPath();
        this.ctx.fillStyle = 'none';
        this.ctx.strokeStyle='#FF0000';
        this.ctx.rect(layer.bounds.x, layer.bounds.y, layer.bounds.width, layer.bounds.height);
        this.ctx.stroke();
    }

    // Public API methods
    public start(): void {
        console.log('=== START METHOD CALLED ===');

        // Check if there's a game in progress to resume
        const hasGameInProgress = this.gameState.hasGameInProgress();
        console.log('Has game in progress:', hasGameInProgress);

        if (hasGameInProgress) {
            console.log('Resuming game from saved state');

            // Try to load full game state first
            const fullSaveData = this.gameState.getFullSaveData();
            
            if (fullSaveData) {
                // Use completely new simple restoration approach
                this.simpleRestore(fullSaveData);
            } else {
                console.log('No full save data found, starting fresh level');
                this.start();
                return;
            }

            this.gameLoop.start();
            return;
        }

        // Start a new game
        console.log('Starting new game');
        this.gameState.startGame();

        // Initialize the level with shapes if not already done
        if (this.layerManager.getAllShapes().length === 0) {
            // Update layer bounds BEFORE creating shapes to ensure they use the full area
            this.updateLayerBoundsForScale();

            this.layerManager.initializeLevel(this.gameState.getState().currentLevel);

            // Update containers to match actual screw colors from generated shapes
            const allShapes = this.layerManager.getAllShapes();
            const activeScrewColors = this.gameState.getAllActiveScrewColors(allShapes);
            this.gameState.updateContainersFromActiveScrewColors(activeScrewColors, this.virtualGameWidth, this.virtualGameHeight);
        }

        this.gameLoop.start();
    }

    public restart(): void {
        console.log('=== RESTART CALLED ===');
        console.log('Current game state before restart:', this.gameState.getState());

        this.gameLoop.stop();
        console.log('Game loop stopped');

        // Set restart flag to prevent immediate game over checks
        this.justRestarted = true;
        console.log('Restart flag set');

        // Clear everything first
        this.layerManager.clearAllLayers();
        console.log('Layers cleared');

        this.gameOverTimer = null; // Reset game over timer
        console.log('Game over timer reset');

        // Reset game state
        this.gameState.reset();
        console.log('Game state reset completed');
        console.log('Game state after reset:', this.gameState.getState());

        this.gameState.startGame(); // Make sure the game is marked as started
        console.log('Game started');
        console.log('Game state after start:', this.gameState.getState());
        console.log('Holding area full after reset:', this.gameState.isHoldingAreaFull());

        // Update layer bounds for current canvas scaling BEFORE creating level
        this.updateLayerBoundsForScale();
        console.log('Layer bounds updated for mobile scaling');

        // Initialize new level
        this.layerManager.initializeLevel(this.gameState.getState().currentLevel);
        console.log('Level initialized');

        // Update containers to match actual screw colors from generated shapes
        const allShapes = this.layerManager.getAllShapes();
        const activeScrewColors = this.gameState.getAllActiveScrewColors(allShapes);
        this.gameState.updateContainersFromActiveScrewColors(activeScrewColors, this.virtualGameWidth, this.virtualGameHeight);
        console.log('Containers updated with active screw colors');

        // Start the game loop
        this.gameLoop.start();
        console.log('Game loop restarted');

        // Clear the restart flag after a short delay
        setTimeout(() => {
            this.justRestarted = false;
            console.log('Restart flag cleared');
            console.log('Final game state:', this.gameState.getState());
            console.log('Final holding area full:', this.gameState.isHoldingAreaFull());
        }, 100); // 100ms delay

        console.log('=== RESTART COMPLETE ===');
    }

    public nextLevel(): void {
        this.gameState.nextLevel();
        this.layerManager.clearAllLayers();
        this.layerManager.initializeLevel(this.gameState.getState().currentLevel);
    }

    public toggleDebugMode(): void {
        this.debugMode = !this.debugMode;
    }

    public isDebugMode(): boolean {
        return this.debugMode;
    }

    // Event handlers
    public onScrewCollectedCallback(callback: (screwId: string) => void): void {
        this.onScrewCollected = callback;
    }

    public onShapeClearedCallback(callback: (shapeId: string) => void): void {
        this.onShapeCleared = callback;
    }

    public onLevelCompleteCallback(callback: () => void): void {
        this.onLevelComplete = callback;
    }

    public onGameOverCallback(callback: () => void): void {
        this.onGameOver = callback;
    }

    public getGameState(): GameState {
        return this.gameState;
    }

    public updateCanvasSize(width: number, height: number): void {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;

            // Apply scaling to the drawing context to fit the content
            this.updateCanvasScaling();

            // Update GameState positions with new virtual dimensions
            this.gameState.recalculatePositions(this.virtualGameWidth, this.virtualGameHeight);

            // Force bounds update for any existing layers
            this.updateLayerBoundsForScale();
        }
    }

    private updateCanvasScaling(): void {
        if (!this.canvas || !this.ctx) return;

        // Calculate uniform scaling to prevent distortion
        const originalWidth = GAME_CONFIG.canvas.width;
        const originalHeight = GAME_CONFIG.canvas.height;

        const scaleX = this.canvas.width / originalWidth;
        const scaleY = this.canvas.height / originalHeight;

        // Use uniform scaling to maintain aspect ratio
        const scale = Math.min(scaleX, scaleY);

        // Calculate virtual game dimensions that will fill the actual screen
        this.virtualGameWidth = this.canvas.width / scale;
        this.virtualGameHeight = this.canvas.height / scale;

        // console.log(`VIRTUAL DIMENSIONS CALCULATION: canvas=${this.canvas.width}x${this.canvas.height}, scale=${scale.toFixed(3)}, virtual=${this.virtualGameWidth.toFixed(0)}x${this.virtualGameHeight.toFixed(0)}`);

        // Reset any existing transforms
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply uniform scaling to prevent distortion
        this.ctx.scale(scale, scale);

        // Center the content if there's extra space
        const scaledWidth = this.virtualGameWidth * scale;
        const scaledHeight = this.virtualGameHeight * scale;
        const offsetX = (this.canvas.width - scaledWidth) / (2 * scale);
        const offsetY = (this.canvas.height - scaledHeight) / (2 * scale);

        this.ctx.translate(offsetX, offsetY);

        // console.log(`Canvas scaling: scale=${scale.toFixed(3)}, canvas=${this.canvas.width}x${this.canvas.height}, virtual=${this.virtualGameWidth.toFixed(0)}x${this.virtualGameHeight.toFixed(0)}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);

        // Store scaling info for coordinate transformation
        this.canvasScale = scale;
        this.canvasOffset = {x: offsetX, y: offsetY};

        // Note: We don't call updateLayerBoundsForScale() here anymore
        // to avoid duplicate calls, as it's already called by updateCanvasSize()
    }

    public getFullHeaderHeight(): number {
        // Calculate the scaled header height based on the virtual game dimensions

        const scaledHeaderHeight = this.virtualGameHeight * (UI_CONSTANTS.header.height / GAME_CONFIG.canvas.height);
        const scaledContainerHeight = this.virtualGameHeight * (UI_CONSTANTS.containers.height / GAME_CONFIG.canvas.height);
        const scaledHoldingHoleHeight = this.virtualGameHeight * (UI_CONSTANTS.holdingHoles.height / GAME_CONFIG.canvas.height);

        return scaledHeaderHeight + scaledContainerHeight + scaledHoldingHoleHeight;
    }

    private getCurrentPlayableBounds(): { x: number; y: number; width: number; height: number } {
        // Use virtual game dimensions to maximize space usage
        // Calculate header height dynamically based on the proportion of the original design height

        const fullHeaderHeight = this.getFullHeaderHeight();
        const minMargin = 10; // Minimal margin to prevent edge spawning

        // Check if we're in mobile mode (portrait orientation)
        const isMobile = this.virtualGameHeight > this.virtualGameWidth;

        // For mobile devices, we need to ensure shapes are distributed across the full height
        // The issue was that shapes were only appearing in the top half of the available area
        const bounds = {
            x: minMargin,
            y: fullHeaderHeight,
            width: this.virtualGameWidth - (2 * minMargin),
            height: this.virtualGameHeight - (fullHeaderHeight + (2 * minMargin)),
        };

        console.log(`GET_CURRENT_PLAYABLE_BOUNDS: isMobile=${isMobile}, virtual=${this.virtualGameWidth.toFixed(0)}x${this.virtualGameHeight.toFixed(0)}, playable=(${bounds.x}, ${bounds.y}, ${bounds.width.toFixed(0)}, ${bounds.height.toFixed(0)}) Y_RANGE=${bounds.y} to ${bounds.y + bounds.height}`);

        return bounds;
    }

    private updateLayerBoundsForScale(skipRedistribution: boolean = false): void {
        if (!this.canvas) return;

        // Get current playable bounds
        const playableBounds = this.getCurrentPlayableBounds();

        console.log(`LAYER BOUNDS UPDATE: playable=(${playableBounds.x}, ${playableBounds.y}, ${playableBounds.width.toFixed(0)}, ${playableBounds.height.toFixed(0)}) | virtual=${this.virtualGameWidth.toFixed(0)}x${this.virtualGameHeight.toFixed(0)} | canvas=${this.canvas.width}x${this.canvas.height} | original=${GAME_CONFIG.canvas.width}x${GAME_CONFIG.canvas.height}`);
        console.log(`BOUNDS CALCULATION: playableY=${playableBounds.y}, playableHeight=${playableBounds.height}, playableYEnd=${playableBounds.y + playableBounds.height}`);

        // Update all existing layers with new bounds
        this.layerManager.getLayers().forEach(layer => {
            console.log(`Updating layer ${layer.id} bounds from (${layer.bounds.x}, ${layer.bounds.y}, ${layer.bounds.width.toFixed(0)}, ${layer.bounds.height.toFixed(0)}) to new bounds`);
            layer.updateBounds(playableBounds, skipRedistribution);
        });
    }

    private validateAndAdjustShapePositions(): void {
        const playableBounds = this.getCurrentPlayableBounds();
        const margin = 20; // Safety margin from edges
        let adjustedShapes = 0;

        console.log('Validating shape positions for current screen bounds');

        this.layerManager.getAllShapes().forEach(shape => {
            const body = shape.body;
            const currentPos = {x: body.position.x, y: body.position.y};
            let needsAdjustment = false;
            const newPos = {...currentPos};

            // Check if shape is outside horizontal bounds
            if (currentPos.x < playableBounds.x + margin) {
                newPos.x = playableBounds.x + margin;
                needsAdjustment = true;
            } else if (currentPos.x > playableBounds.x + playableBounds.width - margin) {
                newPos.x = playableBounds.x + playableBounds.width - margin;
                needsAdjustment = true;
            }

            // Check if shape is outside vertical bounds
            if (currentPos.y < playableBounds.y + margin) {
                newPos.y = playableBounds.y + margin;
                needsAdjustment = true;
            } else if (currentPos.y > playableBounds.y + playableBounds.height - margin) {
                newPos.y = playableBounds.y + playableBounds.height - margin;
                needsAdjustment = true;
            }

            if (needsAdjustment) {
                console.log(`Adjusting shape ${shape.id} position from (${currentPos.x.toFixed(0)}, ${currentPos.y.toFixed(0)}) to (${newPos.x.toFixed(0)}, ${newPos.y.toFixed(0)})`);

                // Use Matter.js Body.setPosition to properly update the physics body
                Body.setPosition(body, newPos);
                shape.position = newPos;
                adjustedShapes++;
            }
        });

        if (adjustedShapes > 0) {
            console.log(`Adjusted ${adjustedShapes} shapes to fit within current playable bounds`);

            // Update screw positions after shape adjustments
            this.layerManager.getScrewManager().updateScrewPositions();
        }
    }

    public dispose(): void {
        this.gameLoop.stop();
        this.layerManager.dispose();
        this.physicsWorld.dispose();

        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick.bind(this));
            this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
            this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        }
    }

    // Save complete game state including all game objects
    private saveFullGameState(): void {
        const layerManagerState = this.layerManager.toSerializable();
        const screwManagerState = this.layerManager.getScrewManager().toSerializable(
            (shapeId: string) => {
                const shape = this.layerManager.getShapeById(shapeId);
                return shape ? shape.position : null;
            }
        );

        console.log('=== SAVING FULL GAME STATE ===');
        console.log('Layer Manager State:', {
            layerCount: layerManagerState.layers.length,
            totalShapes: layerManagerState.layers.reduce((sum, layer) => sum + layer.shapes.length, 0),
            layersGenerated: layerManagerState.layersGeneratedThisLevel,
            totalLayers: layerManagerState.totalLayersForLevel
        });

        this.gameState.save(layerManagerState, screwManagerState);
        console.log('=== GAME STATE SAVED ===');
    }

    // Force save for important moments (level transitions, major actions)
    public forceSave(): void {
        this.saveFullGameState();
    }

    // Debug utilities
    public clearSaveData(): void {
        localStorage.removeItem('par-shape-2d-save');
        console.log('Save data cleared');
    }

    private simpleRestore(saveData: import('@/types/game').FullGameSave): void {
        console.log('=== SIMPLE RESTORATION APPROACH ===');
        
        // Step 1: Use existing restart logic to clear everything cleanly
        console.log('Step 1: Clearing everything using restart logic');
        this.gameLoop.stop();
        this.layerManager.clearAllLayers();
        this.physicsWorld.clear();
        
        // Step 2: Restore basic game state
        console.log('Step 2: Restoring basic game state');
        this.gameState.load(); // This restores containers, holding holes, etc.
        
        // Step 3: Update canvas and positions
        this.updateCanvasScaling();
        this.gameState.recalculatePositions(this.virtualGameWidth, this.virtualGameHeight);
        this.updateLayerBoundsForScale();
        
        // Step 4: Recreate layers using existing game systems but with saved positions
        console.log('Step 3: Recreating layers and shapes using game systems');
        
        if (saveData.layerManagerState && saveData.layerManagerState.layers) {
            // Restore layer manager counters
            this.layerManager['layersGeneratedThisLevel'] = saveData.layerManagerState.layersGeneratedThisLevel;
            this.layerManager['totalLayersForLevel'] = saveData.layerManagerState.totalLayersForLevel;
            this.layerManager['layerCounter'] = saveData.layerManagerState.layerCounter;
            this.layerManager['depthCounter'] = saveData.layerManagerState.depthCounter;
            
            // Recreate each layer
            saveData.layerManagerState.layers.forEach(layerData => {
                console.log(`Recreating layer ${layerData.id} with ${layerData.shapes.length} shapes`);
                
                // Create layer using existing method but mark as restored (no fade)
                const layer = this.layerManager.createLayer(false, true); // no fade, is restored
                layer['id'] = layerData.id;
                layer['depthIndex'] = layerData.depthIndex;
                layer['colorIndex'] = layerData.colorIndex;
                layer['isGenerated'] = true;
                
                // Recreate shapes in this layer
                layerData.shapes.forEach(shapeData => {
                    const savedPosition = shapeData.bodyPosition || shapeData.position || { x: 400, y: 400 };
                    
                    // Use existing ShapeFactory to create shape at saved position
                    const shape = this.createShapeAtPosition(
                        shapeData.type,
                        savedPosition,
                        layer.id,
                        layer.index,
                        layer.physicsLayerGroup,
                        layer.colorIndex,
                        shapeData
                    );
                    
                    if (shape) {
                        layer.addShape(shape);
                        console.log(`Created shape ${shape.id} at position (${shape.position.x}, ${shape.position.y})`);
                        
                        // Don't generate new screws - they will be recreated from save data
                        // Recreate screws from save data if available
                        if (shapeData.screws) {
                            this.recreateScrewsFromSaveData(shape, shapeData.screws);
                        }
                    }
                });
            });
        }
        
        // Step 5: Add all bodies to physics world and create constraints
        console.log('Step 5: Adding bodies to physics and creating constraints');
        const allShapes = this.layerManager.getAllShapes();
        const allBodies = allShapes.map(shape => shape.body);
        this.physicsWorld.addBodies(allBodies);
        
        // Create constraints for all screws
        console.log('Step 6: Creating screw constraints');
        allShapes.forEach(shape => {
            shape.screws.forEach(screw => {
                if (!screw.isCollected && !screw.isBeingCollected) {
                    // Cast to the actual Screw class
                    const screwInstance = screw as import('@/game/entities/Screw').Screw;
                    this.layerManager.getScrewManager().attachScrewToShape(screwInstance, shape);
                }
            });
        });
        
        // Update screw state
        this.layerManager.getScrewManager().updateScrewPositions();
        this.layerManager.getScrewManager().updateScrewRemovability(
            allShapes,
            (layerId: string) => this.layerManager.getLayer(layerId)?.depthIndex ?? -1
        );
        
        console.log(`=== Simple Restoration Complete: ${allShapes.length} shapes restored ===`);
    }

    public inspectSaveData(): void {
        const savedData = localStorage.getItem('par-shape-2d-save');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                console.log('=== SAVE DATA INSPECTION ===');
                console.log('Save data structure:', {
                    hasState: !!data.state,
                    hasGameState: !!data.gameState,
                    hasLevel: !!data.level,
                    hasContainers: !!data.containers,
                    hasHoldingHoles: !!data.holdingHoles,
                    hasLayerManagerState: !!data.layerManagerState,
                    hasScrewManagerState: !!data.screwManagerState,
                });

                if (data.layerManagerState) {
                    console.log('Layer manager state:', {
                        layerCount: data.layerManagerState.layers?.length || 0,
                        totalShapes: data.layerManagerState.layers?.reduce((sum: number, layer: any) => sum + (layer.shapes?.length || 0), 0) || 0, // eslint-disable-line @typescript-eslint/no-explicit-any
                        layersGenerated: data.layerManagerState.layersGeneratedThisLevel,
                        totalLayers: data.layerManagerState.totalLayersForLevel
                    });
                }

                console.log('Full save data:', data);
            } catch (error) {
                console.error('Failed to parse save data:', error);
            }
        } else {
            console.log('No save data found');
        }
    }

    private createShapeAtPosition(
        type: import('@/types/game').ShapeType,
        position: import('@/types/game').Vector2,
        layerId: string,
        layerIndex: number,
        physicsLayerGroup: number,
        colorIndex: number,
        savedData?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    ): import('@/game/entities/Shape').Shape | null {
        const ShapeFactory = require('@/game/systems/ShapeFactory'); // eslint-disable-line @typescript-eslint/no-require-imports
        
        try {
            // Use existing ShapeFactory but override position
            const shape = ShapeFactory.ShapeFactory.createRandomShape(
                position, // Use saved position instead of random
                layerId,
                layerIndex,
                physicsLayerGroup,
                colorIndex,
                [], // existing shapes
                this.getCurrentPlayableBounds(),
                type // force specific type
            );
            
            if (!shape) {
                console.error(`ShapeFactory failed to create shape of type ${type}`);
                return null;
            }
            
            // Restore additional properties from save data
            if (savedData) {
                shape.holes = savedData.holes || [];
                if (savedData.id) {
                    shape.id = savedData.id; // Restore original ID
                }
            }
            
            return shape;
        } catch (error) {
            console.error('Failed to create shape at position:', error);
            return null;
        }
    }
    
    private recreateScrewsFromSaveData(shape: import('@/game/entities/Shape').Shape, savedScrews: any[]): void { // eslint-disable-line @typescript-eslint/no-explicit-any
        const { Screw: ScrewClass } = require('@/game/entities/Screw'); // eslint-disable-line @typescript-eslint/no-require-imports
        const screwManager = this.layerManager.getScrewManager();
        
        // Clear any existing screws on this shape
        shape.screws = [];
        
        // Recreate screws from saved data
        savedScrews.forEach((savedScrew) => {
            try {
                const screw = new ScrewClass(
                    savedScrew.id,
                    shape.id,
                    savedScrew.position,
                    savedScrew.color
                );
                
                // Restore screw properties
                screw.isRemovable = savedScrew.isRemovable;
                screw.isCollected = savedScrew.isCollected;
                screw.isBeingCollected = savedScrew.isBeingCollected;
                screw.targetContainerId = savedScrew.targetContainerId;
                
                // Add screw to shape and screw manager
                shape.addScrew(screw);
                screwManager.addScrew(screw);
                
                console.log(`Recreated screw ${screw.id} for shape ${shape.id} at position (${screw.position.x}, ${screw.position.y})`);
            } catch (error) {
                console.error(`Failed to recreate screw ${savedScrew.id}:`, error);
            }
        });
    }
}
