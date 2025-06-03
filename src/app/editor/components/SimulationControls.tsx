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
    <div className="simulation-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ fontSize: '12px', color: theme.text.secondary, marginRight: '8px' }}>
        Simulation:
      </div>
      
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
        {!isSimulating ? 'Start' : isPaused ? 'Resume' : 'Pause'}
      </button>
      
      <button
        onClick={handleResetSimulation}
        disabled={!isSimulating && !isPaused}
        style={!isSimulating && !isPaused ? disabledButtonStyle : buttonStyle}
        title="Reset simulation to initial state"
      >
        Reset
      </button>
      
      <div style={{ width: '1px', height: '20px', backgroundColor: '#ccc', margin: '0 8px' }} />
      
      <button
        onClick={handleToggleDebug}
        style={debugMode ? activeButtonStyle : buttonStyle}
        title="Toggle debug visualization"
      >
        Debug
      </button>
      
      {isSimulating && (
        <div style={{ 
          fontSize: '11px', 
          color: theme.status.success, 
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme.status.success,
            animation: 'pulse 1s infinite',
          }} />
          {isPaused ? 'Paused' : 'Running'}
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};