'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SystemCoordinator } from '@/game/core/SystemCoordinator';
import { eventFlowValidator } from '@/game/core/EventFlowValidator';
import { GameState } from '@/game/core/GameState';
import { GameEvent } from '@/game/events/EventTypes';
import { GAME_CONFIG, getTotalLayersForLevel } from '@/shared/utils/Constants';
import { DeviceDetection } from '@/game/utils/DeviceDetection';
import { initializePolyDecomp } from '@/game/utils/PhysicsInit';

// Type guard for Visual Viewport API support
function hasVisualViewport(window: Window): window is Window & { visualViewport: VisualViewport } {
  return 'visualViewport' in window && window.visualViewport !== undefined;
}

// Function to get actual visible viewport dimensions, accounting for mobile browser UI
function getActualViewportDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: GAME_CONFIG.canvas.width, height: GAME_CONFIG.canvas.height };
  }

  // On mobile, try to use the Visual Viewport API for more accurate dimensions
  if (hasVisualViewport(window) && DeviceDetection.isMobileDevice()) {
    return { 
      width: window.visualViewport.width, 
      height: window.visualViewport.height 
    };
  }

  return { width: window.innerWidth, height: window.innerHeight};
}

// Responsive canvas sizing function
function getResponsiveCanvasSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: GAME_CONFIG.canvas.width, height: GAME_CONFIG.canvas.height };
  }
  
  const { width: viewportWidth, height: viewportHeight } = getActualViewportDimensions();
  
  // Use proper device detection instead of viewport dimensions
  if (DeviceDetection.isMobileDevice()) {
    // Mobile/Tablet: Use CSS viewport units which CSS will override anyway
    console.log(`Mobile device detected:`, DeviceDetection.getDeviceInfo());
    console.log(`Mobile viewport: ${viewportWidth}x${viewportHeight}`);
    
    // Set canvas internal resolution to match CSS viewport dimensions
    // CSS will override the display size to 100vw/100vh anyway
    return {
      width: Math.floor(viewportWidth),
      height: Math.floor(viewportHeight)
    };
  } else {
    // Desktop: Scale to fit nicely in viewport while maintaining aspect ratio
    console.log(`Desktop device detected:`, DeviceDetection.getDeviceInfo());
    const originalAspectRatio = GAME_CONFIG.canvas.width / GAME_CONFIG.canvas.height;
    const maxWidth = viewportWidth * 0.9;
    const maxHeight = viewportHeight * 0.9;
    
    // Calculate dimensions that maintain aspect ratio and fit within constraints
    let canvasWidth = Math.min(GAME_CONFIG.canvas.width * 1.2, maxWidth);
    let canvasHeight = canvasWidth / originalAspectRatio;
    
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * originalAspectRatio;
    }
    
    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight)
    };
  }
}

interface GameCanvasProps {
  className?: string;
}

interface DebugInfo {
  layersGenerated: number;
  totalLayers: number;
  activeLayers: number;
  visibleLayers: number;
  activeShapes: number;
  activeScrews: number;
  physicsBodies: number;
  gameOverTimer: number | null;
  layerDetails?: Array<{
    id: string;
    index: number;
    depthIndex: number;
    colorIndex: number;
    shapeCount: number;
    isGenerated: boolean;
    tint: string;
    isVisible: boolean;
  }>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordinatorRef = useRef<SystemCoordinator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [gameStarted, setGameStarted] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [eventStats, setEventStats] = useState<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySources: Record<string, number>;
    recentEvents: GameEvent[];
  } | null>(null);

  useEffect(() => {
    // Initialize poly-decomp for Matter.js Bodies.fromVertices support
    initializePolyDecomp();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set responsive canvas size
    const { width, height } = getResponsiveCanvasSize();
    
    // Set canvas internal resolution
    canvas.width = width;
    canvas.height = height;
    
    // On mobile, don't set explicit CSS sizes - let the CSS viewport units handle it
    if (DeviceDetection.isMobileDevice()) {
      console.log(`Mobile: Canvas internal=${width}x${height}, letting CSS handle display size with viewport units`);
    } else {
      // Desktop: Set explicit sizes
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      console.log(`Desktop: Canvas initialized: Internal=${width}x${height}, CSS=${canvas.style.width}x${canvas.style.height}`);
    }
    
    // Initialize system coordinator
    const coordinator = new SystemCoordinator();
    coordinatorRef.current = coordinator;

    const initializeSystems = async () => {
      try {
        // Start event monitoring for debugging
        eventFlowValidator.startMonitoring();
        eventFlowValidator.testEventEmission();

        await coordinator.initialize(canvas);
        coordinator.updateCanvasSize(width, height);
        setIsInitialized(true);
        console.log('Event-driven systems initialized successfully');

        // Start the coordinator
        coordinator.start();

        // Automatically start the game
        setTimeout(() => {
          const gameManager = coordinator.getGameManager();
          if (gameManager) {
            // Emit game started event to begin gameplay
            console.log('Auto-starting game...');
            handleStart();
          }
        }, 500);

        // Validate event flow
        setTimeout(() => {
          const validation = eventFlowValidator.validateEventFlow();
          console.log('Event flow validation:', validation);
          setEventStats(eventFlowValidator.getEventStats());
        }, 1000);

      } catch (error) {
        console.error('Failed to initialize event-driven systems:', error);
      }
    };

    initializeSystems();

    // Cleanup
    return () => {
      eventFlowValidator.stopMonitoring();
      if (coordinatorRef.current) {
        coordinatorRef.current.destroy();
        coordinatorRef.current = null;
      }
    };
  }, []);

  // Handle keyboard shortcuts - simplified since GameManager handles most of them now
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!coordinatorRef.current) return;

      const gameManager = coordinatorRef.current.getGameManager();
      if (!gameManager) return;

      // Only handle debug mode toggle here - GameManager handles the rest
      switch (event.key.toLowerCase()) {
        case 'd':
          // Don't prevent default here - let GameManager handle it
          // Update local debug state after a small delay
          setTimeout(() => {
            setDebugMode(gameManager.getDebugMode());
          }, 50);
          break;
        default:
          // Other keys are handled by GameManager directly
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update debug info regularly when debug mode is enabled
  useEffect(() => {
    if (!debugMode || !coordinatorRef.current) return;

    const updateDebugInfo = () => {
      if (coordinatorRef.current) {
        const gameManager = coordinatorRef.current.getGameManager();
        const layerManager = coordinatorRef.current.getLayerManager();
        const screwManager = coordinatorRef.current.getScrewManager();
        const physicsWorld = coordinatorRef.current.getPhysicsWorld();
        const gameState = coordinatorRef.current.getGameState();
        
        if (gameManager && layerManager && screwManager && physicsWorld && gameState) {
          // Get actual data from systems
          const allLayers = layerManager.getLayers();
          const allScrews = screwManager.getAllScrews();
          const physicsStats = physicsWorld.getStats();
          
          // Calculate shape count across all layers
          const activeShapes = allLayers.reduce((total, layer) => {
            return total + layer.getAllShapes().length;
          }, 0);
          
          // Calculate active (non-collected) screws
          const activeScrews = allScrews.filter(screw => !screw.isCollected).length;
          
          // Get visible layers count and current level
          const visibleLayers = layerManager.getVisibleLayers().length;
          const currentLevel = gameState.getState().currentLevel;
          
          setDebugInfo({
            layersGenerated: allLayers.length,
            totalLayers: getTotalLayersForLevel(currentLevel),
            activeLayers: allLayers.length,
            visibleLayers: visibleLayers,
            activeShapes: activeShapes,
            activeScrews: activeScrews,
            physicsBodies: physicsStats.bodyCount,
            gameOverTimer: null
          });
        }
      }
    };

    // Update immediately
    updateDebugInfo();

    // Update every 100ms when debug mode is on
    const interval = setInterval(updateDebugInfo, 100);

    return () => clearInterval(interval);
  }, [debugMode]);

  // Monitor game state to show/hide instructions
  useEffect(() => {
    if (!coordinatorRef.current) return;

    const updateGameState = () => {
      if (coordinatorRef.current) {
        const gameManager = coordinatorRef.current.getGameManager();
        if (gameManager) {
          const state = gameManager.getState() as { gameStarted?: boolean };
          setGameStarted(state.gameStarted || false);
        }
      }
    };

    // Update immediately
    updateGameState();

    // Update every 200ms to monitor game state
    const interval = setInterval(updateGameState, 200);

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Handle window resize and viewport changes for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (coordinatorRef.current && canvasRef.current) {
        const { width, height } = getResponsiveCanvasSize();
        const canvas = canvasRef.current;
        
        // Set canvas internal resolution
        canvas.width = width;
        canvas.height = height;
        
        // On mobile, don't set explicit CSS sizes - let the CSS viewport units handle it
        if (DeviceDetection.isMobileDevice()) {
          console.log(`Mobile resize: Canvas internal=${width}x${height}, letting CSS handle display size with viewport units`);
        } else {
          // Desktop: Set explicit sizes
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          console.log(`Desktop resize: Canvas resized to: Internal=${width}x${height}, CSS=${canvas.style.width}x${canvas.style.height}`);
        }
        
        coordinatorRef.current.updateCanvasSize(width, height);
      }
    };

    // Handle regular window resize events
    window.addEventListener('resize', handleResize);

    // Handle Visual Viewport API changes (iOS Safari toolbar show/hide)
    if (hasVisualViewport(window)) {
      const handleViewportChange = () => {
        console.log('Visual viewport changed, triggering canvas resize');
        handleResize();
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (hasVisualViewport(window)) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      };
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = () => {
    if (coordinatorRef.current) {
      const gameState = coordinatorRef.current.getSystem('GameState') as GameState | null;
      const gameManager = coordinatorRef.current.getGameManager();
      
      if (gameState && gameManager) {
        const managerState = gameManager.getState();
        
        // If game is over, perform restart instead
        if (managerState.gameOver) {
          console.log('Game is over, performing restart instead of start');
          handleRestart();
        } else {
          // Start the game normally
          gameState.startGame();
          console.log('Game started through event system');
        }
      }
    }
  };

  const handleRestart = () => {
    if (coordinatorRef.current) {
      const gameManager = coordinatorRef.current.getGameManager();
      if (gameManager) {
        // Use the GameManager's comprehensive restart logic
        // This simulates clicking the restart button in the menu which has the full restart logic
        const event = new KeyboardEvent('keydown', {
          key: 'r',
          code: 'KeyR',
          bubbles: true
        });
        window.dispatchEvent(event);
        console.log('Game restarted through GameManager restart logic');
      }
    }
  };

  const toggleDebug = () => {
    if (coordinatorRef.current) {
      const gameManager = coordinatorRef.current.getGameManager();
      if (gameManager) {
        // Simulate pressing the 'D' key by dispatching a keyboard event
        // This ensures the debug button behaves exactly like pressing 'D'
        const event = new KeyboardEvent('keydown', {
          key: 'd',
          code: 'KeyD',
          bubbles: true
        });
        window.dispatchEvent(event);
        
        // Update local state after a small delay to allow the event to process
        setTimeout(() => {
          setDebugMode(gameManager.getDebugMode());
        }, 50);
      }
    }
  };

  return (
    <div className={`game-canvas-container ${className}`} style={{
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        padding: 0, 
        margin: 0 
      }}>
        <canvas
          ref={canvasRef}
          className="md:border-2 md:border-solid md:border-[#34495E] md:rounded-lg"
          style={{
            backgroundColor: '#2C3E50',
            cursor: 'pointer',
            display: 'block',
            margin: '0 auto', // Center horizontally on desktop
            padding: 0,
            touchAction: 'none', // Prevent default touch behaviors
            // Don't set width/height here as we handle it in JavaScript
            // to ensure canvas internal size matches CSS size for accurate touch coordinates
          }}
        />
        
      </div>
      
      {/* Game Controls */}
      <div className="hidden md:flex" style={{ 
        marginTop: '10px',
        textAlign: 'center',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '0 20px'
      }}>
        <button
          onClick={handleStart}
          style={{
            padding: '12px 24px',
            backgroundColor: '#27AE60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            minHeight: '44px',
            minWidth: '80px',
            touchAction: 'manipulation',
          }}
        >
          Start
        </button>
        
        <button
          onClick={handleRestart}
          style={{
            padding: '12px 24px',
            backgroundColor: '#E74C3C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            minHeight: '44px',
            minWidth: '80px',
            touchAction: 'manipulation',
          }}
        >
          Restart
        </button>
        
        <button
          onClick={toggleDebug}
          style={{
            padding: '12px 24px',
            backgroundColor: debugMode ? '#9B59B6' : '#7F8C8D',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            minHeight: '44px',
            minWidth: '100px',
            touchAction: 'manipulation',
          }}
        >
          Debug: {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* System Status Display - Only show when not initialized */}
      {!isInitialized && (
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#7F8C8D',
          fontSize: '14px',
          maxWidth: '600px',
          margin: '20px auto 0',
          padding: '0 20px',
        }}>
          <p>⏳ Initializing game systems...</p>
        </div>
      )}

      {/* Debug Info Panel */}
      {debugMode && debugInfo && (
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          backgroundColor: '#2C3E50',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '20px auto',
        }}>
          <h3 style={{ color: '#FFFFFF', marginBottom: '15px', fontSize: '16px' }}>
            Event-Driven Debug Information
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            textAlign: 'left',
          }}>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Layers Generated:</strong> {debugInfo.layersGenerated}/{debugInfo.totalLayers}
            </div>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Active Layers:</strong> {debugInfo.activeLayers}
            </div>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Visible Layers:</strong> {debugInfo.visibleLayers}
            </div>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Active Shapes:</strong> {debugInfo.activeShapes}
            </div>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Active Screws:</strong> {debugInfo.activeScrews}
            </div>
            <div style={{ color: '#BDC3C7', fontSize: '14px' }}>
              <strong style={{ color: '#FFFFFF' }}>Physics Bodies:</strong> {debugInfo.physicsBodies}
            </div>
            {debugInfo.gameOverTimer !== null && (
              <div style={{ color: '#E74C3C', fontSize: '14px', fontWeight: 'bold' }}>
                <strong style={{ color: '#FFFFFF' }}>Game Over in:</strong> {debugInfo.gameOverTimer}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Flow Debug Info */}
      {debugMode && eventStats && (
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          backgroundColor: '#2C3E50',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '20px auto',
        }}>
          <h3 style={{ color: '#FFFFFF', marginBottom: '15px', fontSize: '16px' }}>
            Event Flow Statistics ({eventStats.totalEvents} total events)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            textAlign: 'left',
          }}>
            <div>
              <h4 style={{ color: '#F39C12', marginBottom: '10px', fontSize: '14px' }}>Events by Type:</h4>
              {Object.entries(eventStats.eventsByType).map(([type, count]: [string, unknown]) => (
                <div key={type} style={{ color: '#BDC3C7', fontSize: '12px' }}>
                  {type}: {String(count)}
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#E67E22', marginBottom: '10px', fontSize: '14px' }}>Events by Source:</h4>
              {Object.entries(eventStats.eventsBySources).map(([source, count]: [string, unknown]) => (
                <div key={source} style={{ color: '#BDC3C7', fontSize: '12px' }}>
                  {source}: {String(count)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E74C3C',
          fontSize: '18px',
          fontWeight: 'bold',
        }}>
          Initializing event-driven systems...
        </div>
      )}
    </div>
  );
};