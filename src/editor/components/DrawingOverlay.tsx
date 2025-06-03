'use client';

import { useState, useEffect } from 'react';
import { DrawingStateManager } from '../systems/DrawingStateManager';
import { DrawingToolManager } from '../systems/DrawingToolManager';

interface DrawingOverlayProps {
  drawingStateManager: DrawingStateManager;
  drawingToolManager: DrawingToolManager;
  className?: string;
}

export function DrawingOverlay({ 
  drawingStateManager, 
  drawingToolManager, 
  className = '' 
}: DrawingOverlayProps) {
  const [instruction, setInstruction] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  useEffect(() => {
    const updateState = () => {
      const instruction = drawingStateManager.getCurrentInstruction();
      const hasActiveSession = drawingStateManager.hasActiveSession();
      const toolName = drawingToolManager.getActiveToolName();
      const isDrawing = drawingToolManager.isDrawing();
      
      setInstruction(instruction);
      setCurrentTool(toolName);
      setIsVisible(hasActiveSession || isDrawing || (toolName !== 'select' && toolName !== null));
    };

    // Initial update
    updateState();

    // Subscribe to relevant events
    const unsubscribeDrawingStarted = drawingStateManager.subscribeToEvent('editor:drawing:started', updateState);
    const unsubscribeDrawingState = drawingStateManager.subscribeToEvent('editor:drawing:state:changed', updateState);
    const unsubscribeDrawingCompleted = drawingStateManager.subscribeToEvent('editor:drawing:completed', updateState);
    const unsubscribeDrawingCancelled = drawingStateManager.subscribeToEvent('editor:drawing:cancelled', updateState);
    const unsubscribeToolSelected = drawingToolManager.subscribeToEvent('editor:tool:selected', updateState);

    return () => {
      unsubscribeDrawingStarted();
      unsubscribeDrawingState();
      unsubscribeDrawingCompleted();
      unsubscribeDrawingCancelled();
      unsubscribeToolSelected();
    };
  }, [drawingStateManager, drawingToolManager]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`drawing-overlay ${className}`}>
      {/* Instruction banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border border-blue-700">
          <div className="flex items-center space-x-3">
            {/* Tool indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                {currentTool && currentTool !== 'select' ? `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Tool` : 'Drawing'}
              </span>
            </div>
            
            {/* Instruction text */}
            <div className="text-sm">
              {instruction}
            </div>
          </div>
          
          {/* ESC hint */}
          {drawingStateManager.hasActiveSession() && (
            <div className="text-xs text-blue-200 mt-1 text-center">
              Press ESC to cancel
            </div>
          )}
        </div>
      </div>

      {/* Drawing statistics (bottom corner) */}
      {drawingStateManager.hasActiveSession() && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-xs">
            <div>Step: {drawingStateManager.getCurrentStepCount()}</div>
            <div>Tool: {currentTool}</div>
          </div>
        </div>
      )}
    </div>
  );
}