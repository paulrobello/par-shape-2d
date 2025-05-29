'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GameManager } from '@/game/core/GameManager';
import { GAME_CONFIG } from '@/game/utils/Constants';

// Responsive canvas sizing function
function getResponsiveCanvasSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: GAME_CONFIG.canvas.width, height: GAME_CONFIG.canvas.height };
  }
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportHeight > viewportWidth || viewportWidth < 1200; // Portrait orientation or narrow width
  
  if (isMobile) {
    // Mobile: Use full screen dimensions for maximum screen usage
    return {
      width: viewportWidth,
      height: viewportHeight
    };
  } else {
    // Desktop: Scale to fit nicely in viewport while maintaining aspect ratio
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
  const gameManagerRef = useRef<GameManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set responsive canvas size
    const { width, height } = getResponsiveCanvasSize();
    canvas.width = width;
    canvas.height = height;
    
    // Initialize game manager
    const gameManager = new GameManager();
    gameManagerRef.current = gameManager;

    try {
      gameManager.initialize(canvas);
      // Update canvas size AFTER initialization to ensure virtual dimensions are recalculated
      gameManager.updateCanvasSize(width, height);
      setIsInitialized(true);

      // Set up event callbacks
      gameManager.onScrewCollectedCallback((screwId) => {
        console.log('Screw collected:', screwId);
      });

      gameManager.onShapeClearedCallback((shapeId) => {
        console.log('Shape cleared:', shapeId);
      });

      gameManager.onLevelCompleteCallback(() => {
        console.log('Level complete!');
      });

      gameManager.onGameOverCallback(() => {
        console.log('Game over!');
      });

      // Check if there's a saved game to resume automatically
      const hasGameInProgress = gameManager.getGameState().hasGameInProgress();
      if (hasGameInProgress) {
        console.log('Found saved game, automatically resuming...');
        gameManager.start();
      }

    } catch (error) {
      console.error('Failed to initialize game:', error);
    }

    // Cleanup
    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.dispose();
        gameManagerRef.current = null;
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameManagerRef.current) return;

      switch (event.key.toLowerCase()) {
        case 'd':
          event.preventDefault();
          gameManagerRef.current.toggleDebugMode();
          setDebugMode(gameManagerRef.current.isDebugMode());
          break;
        case 'r':
          event.preventDefault();
          gameManagerRef.current.restart();
          break;
        case 'g':
          event.preventDefault();
          // Test game over (for debugging)
          if (gameManagerRef.current) {
            (gameManagerRef.current as any).gameState.endGame(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          break;
        case 's':
          event.preventDefault();
          // Force save (for debugging)
          if (gameManagerRef.current) {
            (gameManagerRef.current as any).forceSave(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          break;
        case 'i':
          event.preventDefault();
          // Inspect save data (for debugging)
          if (gameManagerRef.current) {
            (gameManagerRef.current as any).inspectSaveData(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          break;
        case 'c':
          event.preventDefault();
          // Clear save data (for debugging)
          if (gameManagerRef.current) {
            (gameManagerRef.current as any).clearSaveData(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          break;
        default:
          // Reserved for future debug commands
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update debug info regularly when debug mode is enabled
  useEffect(() => {
    if (!debugMode || !gameManagerRef.current) return;

    const updateDebugInfo = () => {
      if (gameManagerRef.current) {
        setDebugInfo(gameManagerRef.current.getDebugInfo());
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
    if (!gameManagerRef.current) return;

    const updateGameState = () => {
      if (gameManagerRef.current) {
        const state = gameManagerRef.current.getGameState().getState();
        setGameStarted(state.gameStarted);
      }
    };

    // Update immediately
    updateGameState();

    // Update every 200ms to monitor game state
    const interval = setInterval(updateGameState, 200);

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (gameManagerRef.current && canvasRef.current) {
        const { width, height } = getResponsiveCanvasSize();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        gameManagerRef.current.updateCanvasSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleStart = () => {
    if (gameManagerRef.current) {
      // If game is over, restart instead of just starting
      const gameState = gameManagerRef.current.getGameState().getState();
      if (gameState.gameOver) {
        gameManagerRef.current.restart();
      } else {
        gameManagerRef.current.start();
      }
    }
  };


  const handleRestart = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.restart();
    }
  };

  const toggleDebug = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.toggleDebugMode();
      setDebugMode(gameManagerRef.current.isDebugMode());
    }
  };

  return (
    <div className={`game-canvas-container ${className}`} style={{
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      overflow: 'hidden'
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
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            touchAction: 'none', // Prevent default touch behaviors
          }}
        />
        
        {/* Gameplay Instructions Overlay */}
        {isInitialized && !gameStarted && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(44, 62, 80, 0.95)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            color: '#ECF0F1',
            textAlign: 'center',
          }}>
            <h2 style={{ 
              color: '#3498DB', 
              marginBottom: '20px', 
              fontSize: '28px',
              fontWeight: 'bold' 
            }}>
              PAR Shape 2D
            </h2>
            
            <div style={{ 
              maxWidth: '400px', 
              lineHeight: '1.6',
              fontSize: '16px',
              marginBottom: '25px'
            }}>
              <h3 style={{ color: '#E67E22', marginBottom: '15px', fontSize: '20px' }}>
                How to Play
              </h3>
              
              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <p style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#F39C12' }}>Objective:</strong> Clear all layers of shapes by removing screws.
                </p>
                
                <p style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#F39C12' }}>Gameplay:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>
                  <li>Click on screws to remove them from shapes</li>
                  <li>When all screws are removed, shapes fall and disappear</li>
                  <li>Screws fly to matching colored containers</li>
                  <li>If no container matches, screws go to holding holes</li>
                </ul>
                
                <p style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#E74C3C' }}>Warning:</strong> If all 5 holding holes fill up, you have 5 seconds to free one up or you lose!
                </p>
                
                <p style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#F39C12' }}>Strategy:</strong> You can only remove screws that aren&apos;t blocked by shapes in front layers.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleStart}
              style={{
                padding: '12px 30px',
                backgroundColor: '#27AE60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2ECC71';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#27AE60';
              }}
            >
              Start Game
            </button>
          </div>
        )}
      </div>
      
      {/* Game Controls */}
      <div className="hidden md:flex" style={{ 
        marginTop: '10px',
        textAlign: 'center',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '0 20px' // Add padding for mobile
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
            minHeight: '44px', // iOS recommended touch target size
            minWidth: '80px',
            touchAction: 'manipulation', // Prevent zoom on double-tap
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

      {/* Instructions */}
      <div className="hidden md:block" style={{
        marginTop: '20px',
        textAlign: 'center',
        color: '#7F8C8D',
        fontSize: '14px',
        maxWidth: '600px',
        margin: '20px auto 0',
        padding: '0 20px',
        lineHeight: '1.5'
      }}>
        <p><strong>Controls:</strong></p>
        <p>Tap/Click on screws to remove them • Smart touch selection for mobile</p>
        <p>Desktop: D: Toggle Debug • R: Restart • G: Test Game Over</p>
        <p>Debug: S: Force Save • I: Inspect Save Data • C: Clear Save Data</p>
        <p>Remove screws to drop shapes and clear levels!</p>
        <p style={{ fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>
          Mobile: Touch area optimized, haptic feedback enabled
        </p>
      </div>

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
            Debug Information
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

      {/* Active Layers Debug Info */}
      {debugMode && debugInfo && debugInfo.layerDetails && (
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          backgroundColor: '#34495E',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '20px auto',
        }}>
          <h3 style={{ color: '#FFFFFF', marginBottom: '15px', fontSize: '16px' }}>
            Active Layers ({debugInfo.layerDetails.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            justifyItems: 'center',
          }}>
            {debugInfo.layerDetails.map((layer) => (
              <div 
                key={layer.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px',
                  backgroundColor: '#2C3E50',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: `2px solid ${layer.tint}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <div 
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: layer.tint,
                      borderRadius: '3px',
                      border: '1px solid #FFFFFF',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ 
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}>
                    {layer.id}
                  </span>
                </div>
                <div style={{ color: '#BDC3C7', fontSize: '11px', textAlign: 'center' }}>
                  <div>Shapes: <span style={{ color: '#F39C12', fontWeight: 'bold' }}>{layer.shapeCount}</span></div>
                  <div>Depth: {layer.depthIndex} | Index: {layer.index}</div>
                  <div>Color: {layer.colorIndex} | {layer.isGenerated ? 'Generated' : 'Loading'}</div>
                </div>
              </div>
            ))}
          </div>
          {debugInfo.layerDetails.length === 0 && (
            <div style={{ color: '#BDC3C7', fontStyle: 'italic' }}>
              No active layers
            </div>
          )}
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
          Initializing game...
        </div>
      )}
    </div>
  );
};