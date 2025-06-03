'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';

interface SimulationControlsProps {
  editorManager: EditorManager | null;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ editorManager }) => {
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

  const handleStartSimulation = useCallback(async () => {
    if (!editorManager || !hasShape) return;

    const editorState = editorManager.getEditorState();
    const currentShapeId = editorState.getCurrentShapeId();
    
    if (!currentShapeId) return;

    const physicsSimulator = editorManager.getPhysicsSimulator();
    const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:physics:start:requested',
      payload: { shapeId: currentShapeId },
    });
  }, [editorManager, hasShape]);

  const handlePauseSimulation = useCallback(async () => {
    if (!editorManager) return;

    const physicsSimulator = editorManager.getPhysicsSimulator();
    const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:physics:pause:requested',
      payload: {},
    });
    
    setIsPaused(!isPaused);
  }, [editorManager, isPaused]);

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
    borderColor: '#ccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#212529',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '4px',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    cursor: 'not-allowed',
  };

  return (
    <div className="simulation-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ fontSize: '12px', color: '#495057', marginRight: '8px' }}>
        Simulation:
      </div>
      
      <button
        onClick={handleStartSimulation}
        disabled={!hasShape || isSimulating}
        style={!hasShape || isSimulating ? disabledButtonStyle : buttonStyle}
        title={!hasShape ? 'Load a shape first' : isSimulating ? 'Simulation already running' : 'Start physics simulation'}
      >
        Start
      </button>
      
      <button
        onClick={handlePauseSimulation}
        disabled={!isSimulating}
        style={!isSimulating ? disabledButtonStyle : (isPaused ? activeButtonStyle : buttonStyle)}
        title={!isSimulating ? 'Start simulation first' : isPaused ? 'Resume simulation' : 'Pause simulation'}
      >
        {isPaused ? 'Resume' : 'Pause'}
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
          color: '#28a745', 
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#28a745',
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