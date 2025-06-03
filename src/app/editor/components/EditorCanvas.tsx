'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { PropertyPanel } from './PropertyPanel';
import { PlaygroundArea } from './PlaygroundArea';
import { FileControls } from './FileControls';
import { SimulationControls } from './SimulationControls';
import { useDarkMode } from '@/editor/utils/useDarkMode';
import { getTheme } from '@/editor/utils/theme';

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
      ref={containerRef}
      className="editor-container"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        maxWidth: '100vw',
        backgroundColor: theme.background.secondary,
        overflow: 'hidden',
      }}
    >
      {/* Main content area */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top toolbar */}
        <div 
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
          <FileControls editorManager={editorManager} theme={theme} />
          <SimulationControls editorManager={editorManager} theme={theme} />
        </div>

        {/* Playground area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
          {isInitialized && (
            <PlaygroundArea 
              editorManager={editorManager}
              canvasRef={canvasRef}
            />
          )}
        </div>
      </div>

      {/* Right sidebar */}
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
  );
};