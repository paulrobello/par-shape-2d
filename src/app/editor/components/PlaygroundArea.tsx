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

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorManager || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates (logical pixels, not physical)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    editorManager.handleCanvasMouseMove(x, y);
  }, [editorManager, canvasRef]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorManager || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates (logical pixels, not physical)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    editorManager.handleCanvasMouseUp(x, y);
  }, [editorManager, canvasRef]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!editorManager) return;
    
    editorManager.handleCanvasKeyDown(event.key);
  }, [editorManager]);

  const handleCanvasWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!editorManager) return;
    
    // Prevent default scroll behavior
    event.preventDefault();
    
    // Pass the deltaY value to the editor manager
    editorManager.handleCanvasWheel(event.deltaY);
  }, [editorManager]);


  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Add event listeners
    const clickHandler = (e: Event) => handleCanvasClick(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    const mouseMoveHandler = (e: Event) => handleCanvasMouseMove(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    const mouseUpHandler = (e: Event) => handleCanvasMouseUp(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll
      handleCanvasWheel(e as unknown as React.WheelEvent<HTMLCanvasElement>);
    };
    
    canvas.addEventListener('click', clickHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('wheel', wheelHandler, { passive: false }); // passive: false allows preventDefault
    
    // Add keyboard listener to window (canvas can't capture key events)
    window.addEventListener('keydown', handleKeyDown);
    
    // Set cursor style based on current tool
    if (editorManager) {
      const activeTool = editorManager.getDrawingToolManager().getActiveTool();
      canvas.style.cursor = activeTool?.getConfig().cursor || 'default';
    }
    
    return () => {
      canvas.removeEventListener('click', clickHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseup', mouseUpHandler);
      canvas.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCanvasClick, handleCanvasMouseMove, handleCanvasMouseUp, handleKeyDown, handleCanvasWheel, canvasRef, editorManager]);

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
        <div>Select Tool: Click to add/remove screws</div>
        <div>Drawing Tools: Click to create shapes</div>
        <div>ESC to cancel drawing</div>
      </div>
    </div>
  );
};