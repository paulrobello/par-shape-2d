'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { PropertyPanel } from './PropertyPanel';
import { PlaygroundArea } from './PlaygroundArea';
import { FileControls } from './FileControls';
import { SimulationControls } from './SimulationControls';

export const EditorCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editorManager, setEditorManager] = useState<EditorManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeEditor = async () => {
      if (!canvasRef.current || !containerRef.current) return;

      try {
        const manager = new EditorManager();
        await manager.initializeEditor(canvasRef.current, containerRef.current);
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
      if (editorManager) {
        editorManager.destroy();
      }
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [editorManager]);

  return (
    <div 
      ref={containerRef}
      className="editor-container"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f5f5f5',
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
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Shape Editor
          </h1>
          <FileControls editorManager={editorManager} />
          <SimulationControls editorManager={editorManager} />
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
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isInitialized && (
          <PropertyPanel editorManager={editorManager} />
        )}
      </div>
    </div>
  );
};