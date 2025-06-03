'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { PropertyPanel } from './PropertyPanel';
import { PlaygroundArea } from './PlaygroundArea';
import { FileControls } from './FileControls';
import { SimulationControls } from './SimulationControls';
import { useDarkMode } from '@/editor/utils/useDarkMode';
import { getTheme } from '@/editor/utils/theme';
import { ToolPalette } from '@/editor/components/ToolPalette';
import { DrawingOverlay } from '@/editor/components/DrawingOverlay';

export const EditorCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editorManager, setEditorManager] = useState<EditorManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDarkMode = useDarkMode();
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    let manager: EditorManager | null = null;
    
    const initializeEditor = async () => {
      if (!canvasRef.current || !containerRef.current) return;

      try {
        manager = new EditorManager();
        await manager.initializeEditor(canvasRef.current, containerRef.current);
        // Set theme immediately after initialization
        manager.setTheme(theme);
        setEditorManager(manager);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize editor:', error);
      }
    };

    // Prevent default drag & drop behavior for the entire window
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    initializeEditor();

    return () => {
      if (manager) {
        manager.destroy();
      }
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []); // Empty dependency array - only run once on mount

  // Update theme when it changes
  useEffect(() => {
    if (editorManager) {
      editorManager.setTheme(theme);
    }
  }, [editorManager, theme]);

  return (
    <div 
      className="editor-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        backgroundColor: theme.background.secondary,
        overflow: 'hidden',
      }}
    >
      {/* Top toolbar - full width */}
      <div 
        className="editor-toolbar"
        style={{
          padding: '16px',
          backgroundColor: theme.background.primary,
          borderBottom: `1px solid ${theme.border.primary}`,
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: theme.text.primary }}>
          Shape Editor
        </h1>
        {isInitialized && (
          <ToolPalette 
            drawingToolManager={editorManager!.getDrawingToolManager()} 
            className="mx-4"
          />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: `1px solid ${theme.button.border}`,
              borderRadius: '4px',
              backgroundColor: theme.button.background,
              color: theme.button.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            title="Start fresh with a new shape"
          >
            New
          </button>
          <FileControls editorManager={editorManager} theme={theme} />
          <SimulationControls editorManager={editorManager} theme={theme} />
        </div>
      </div>

      {/* Main content area - canvas and property panel side by side */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Canvas area */}
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            position: 'relative',
            padding: '8px',
            backgroundColor: theme.background.secondary,
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: theme.canvas.background || '#e9ecef',
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
            {isInitialized && (
              <>
                <PlaygroundArea 
                  editorManager={editorManager}
                  canvasRef={canvasRef}
                />
                <DrawingOverlay
                  drawingStateManager={editorManager!.getDrawingStateManager()}
                  drawingToolManager={editorManager!.getDrawingToolManager()}
                />
              </>
            )}
          </div>
        </div>

        {/* Right sidebar - property panel */}
        <div 
          style={{
            width: '300px',
            minWidth: '300px',
            backgroundColor: theme.background.primary,
            borderLeft: `1px solid ${theme.border.primary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {isInitialized && (
            <PropertyPanel editorManager={editorManager} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
};