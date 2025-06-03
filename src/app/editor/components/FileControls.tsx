'use client';

import React, { useRef, useState, useCallback } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { EditorTheme } from '@/editor/utils/theme';

interface FileControlsProps {
  editorManager: EditorManager | null;
  theme: EditorTheme;
}

export const FileControls: React.FC<FileControlsProps> = ({ editorManager, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hover, setHover] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !editorManager) return;

    const file = files[0];
    const fileManager = editorManager.getFileManager();
    
    if (!fileManager.isValidFileType(file)) {
      alert('Please select a valid JSON file');
      return;
    }

    try {
      await fileManager.loadFromFile(file);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  }, [editorManager]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input so same file can be selected again
    event.target.value = '';
  }, [handleFileSelect]);

  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveClick = useCallback(async () => {
    if (!editorManager) return;

    const editorState = editorManager.getEditorState();
    const currentShape = editorState.getCurrentShape();
    
    if (!currentShape) {
      alert('No shape to save');
      return;
    }

    const fileManager = editorManager.getFileManager();
    try {
      await fileManager.saveShapeDefinition(currentShape);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }, [editorManager]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);

    const files = event.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  return (
    <div className="file-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      <div
        onClick={handleLoadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: '8px 16px',
          border: dragOver || hover ? `2px dashed ${theme.status.info}` : `1px dashed ${theme.border.secondary}`,
          borderRadius: '4px',
          backgroundColor: dragOver || hover ? theme.background.tertiary : theme.background.secondary,
          cursor: 'pointer',
          fontSize: '14px',
          color: dragOver || hover ? theme.text.primary : theme.text.secondary,
          transition: 'all 0.2s ease',
        }}
      >
        Drop JSON file or click
      </div>
      
      <button
        onClick={handleSaveClick}
        style={{
          padding: '8px 16px',
          border: `1px solid ${theme.button.border}`,
          borderRadius: '4px',
          backgroundColor: theme.button.background,
          color: theme.button.text,
          cursor: 'pointer',
        }}
      >
        Save Shape
      </button>
    </div>
  );
};