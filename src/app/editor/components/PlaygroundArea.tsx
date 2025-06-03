'use client';

import React, { useEffect, useCallback } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';

interface PlaygroundAreaProps {
  editorManager: EditorManager | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const PlaygroundArea: React.FC<PlaygroundAreaProps> = ({ 
  editorManager, 
  canvasRef 
}) => {
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorManager || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates (logical pixels, not physical)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    editorManager.handleCanvasClick(x, y);
  }, [editorManager, canvasRef]);

  const handleCanvasDoubleClick = useCallback(() => {
    if (!editorManager) return;
    
    // Toggle debug mode on double click
    const physicsSimulator = editorManager.getPhysicsSimulator();
    const eventBus = physicsSimulator['eventBus']; // Access protected eventBus
    const editorState = editorManager.getEditorState();
    const currentDebugMode = editorState.isDebugMode();
    
    eventBus.emit({
      type: 'editor:physics:debug:toggled',
      payload: { enabled: !currentDebugMode },
    });
  }, [editorManager]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Add event listeners
    const clickHandler = (e: Event) => handleCanvasClick(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    const doubleClickHandler = () => handleCanvasDoubleClick();
    
    canvas.addEventListener('click', clickHandler);
    canvas.addEventListener('dblclick', doubleClickHandler);
    
    // Set cursor style based on mode
    canvas.style.cursor = 'crosshair';
    
    return () => {
      canvas.removeEventListener('click', clickHandler);
      canvas.removeEventListener('dblclick', doubleClickHandler);
    };
  }, [handleCanvasClick, handleCanvasDoubleClick, canvasRef]);

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none', // Let canvas handle events
      }}
    >
      {/* Overlay UI elements can go here */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'auto',
        }}
      >
        <div>Click to add/remove screws at placement indicators</div>
        <div>Double-click to toggle debug mode</div>
      </div>
    </div>
  );
};