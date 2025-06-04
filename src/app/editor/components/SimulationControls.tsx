'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { EditorTheme } from '@/editor/utils/theme';

interface SimulationControlsProps {
  editorManager: EditorManager | null;
  theme: EditorTheme;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ editorManager, theme }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [hasShape, setHasShape] = useState(false);

  useEffect(() => {
    if (!editorManager) return;

    const editorState = editorManager.getEditorState();
    
    const unsubscribe = editorState.onStateChange((state) => {
      setIsSimulating(state.simulationRunning);
      setDebugMode(state.debugMode);
      setHasShape(state.currentShape !== null);
    });

    // Initial state
    const currentState = editorState.getState();
    setIsSimulating(currentState.simulationRunning);
    setDebugMode(currentState.debugMode);
    setHasShape(currentState.currentShape !== null);

    return unsubscribe;
  }, [editorManager]);

  const handleToggleSimulation = useCallback(async () => {
    if (!editorManager || !hasShape) return;

    if (!isSimulating) {
      // Start simulation
      const editorState = editorManager.getEditorState();
      const currentShapeId = editorState.getCurrentShapeId();
      
      if (!currentShapeId) return;

      const physicsSimulator = editorManager.getPhysicsSimulator();
      const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
      await eventBus.emit({
        type: 'editor:physics:start:requested',
        payload: { shapeId: currentShapeId },
      });
    } else {
      // Pause/resume simulation
      const physicsSimulator = editorManager.getPhysicsSimulator();
      const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
      await eventBus.emit({
        type: 'editor:physics:pause:requested',
        payload: {},
      });
      
      setIsPaused(!isPaused);
    }
  }, [editorManager, hasShape, isSimulating, isPaused]);

  const handleResetSimulation = useCallback(async () => {
    if (!editorManager) return;

    const physicsSimulator = editorManager.getPhysicsSimulator();
    const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:physics:reset:requested',
      payload: {},
    });
    
    setIsPaused(false);
  }, [editorManager]);

  const handleToggleDebug = useCallback(async () => {
    if (!editorManager) return;

    const physicsSimulator = editorManager.getPhysicsSimulator();
    const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:physics:debug:toggled',
      payload: { enabled: !debugMode },
    });
  }, [editorManager, debugMode]);

  const buttonStyle = {
    padding: '6px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.button.border,
    borderRadius: '4px',
    backgroundColor: theme.button.background,
    color: theme.button.text,
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.button.backgroundActive,
    color: 'white',
    borderColor: theme.button.backgroundActive,
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.button.backgroundDisabled,
    color: theme.button.textDisabled,
    cursor: 'not-allowed',
  };

  return (
    <div className="simulation-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ 
        fontSize: '12px', 
        color: theme.text.secondary, 
        fontWeight: '500',
        marginBottom: '2px'
      }}>
        Simulation
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        border: `1px solid ${theme.border.secondary}`,
        borderRadius: '4px',
        backgroundColor: theme.background.secondary,
      }}>
        <button
          onClick={handleToggleSimulation}
          disabled={!hasShape}
          style={!hasShape ? disabledButtonStyle : (isSimulating && !isPaused ? activeButtonStyle : buttonStyle)}
          title={
            !hasShape 
              ? 'Load a shape first' 
              : !isSimulating 
                ? 'Start physics simulation' 
                : isPaused 
                  ? 'Resume simulation' 
                  : 'Pause simulation'
          }
        >
          {!isSimulating || isPaused ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
            </svg>
          )}
        </button>
        
        <button
          onClick={handleResetSimulation}
          disabled={!isSimulating && !isPaused}
          style={!isSimulating && !isPaused ? disabledButtonStyle : buttonStyle}
          title="Reset simulation to initial state"
        >
          Reset
        </button>
        
        <div style={{ width: '1px', height: '20px', backgroundColor: theme.border.secondary, margin: '0 4px' }} />
        
        <button
          onClick={handleToggleDebug}
          style={debugMode ? activeButtonStyle : buttonStyle}
          title="Toggle debug visualization"
        >
          Debug
        </button>
      </div>
    </div>
  );
};