'use client';

import React, { useRef, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { EditorManager } from '@/editor/core/EditorManager';
import { EditorTheme } from '@/editor/utils/theme';
import { getInlineButtonStyle } from '@/shared/styles/ButtonStyles';

interface FileControlsProps {
  editorManager: EditorManager | null;
  theme: EditorTheme;
}

export const FileControls: React.FC<FileControlsProps> = ({ editorManager, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hover, setHover] = useState(false);
  
  // Button hover states for polished interactions
  const [buttonHoverStates, setButtonHoverStates] = useState({
    save: false,
    copy: false,
    new: false,
  });

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

  const handleCopyToClipboard = useCallback(async () => {
    if (!editorManager) return;

    const editorState = editorManager.getEditorState();
    const currentShape = editorState.getCurrentShape();
    
    if (!currentShape) {
      toast.error('No shape to copy');
      return;
    }

    try {
      const json = JSON.stringify(currentShape, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success('Shape JSON copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
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
    <div className="file-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ 
        fontSize: '12px', 
        color: theme.text.secondary, 
        fontWeight: '500',
        marginBottom: '2px'
      }}>
        File
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        border: `1px solid ${theme.border.secondary}`,
        borderRadius: '4px',
        backgroundColor: theme.background.secondary,
      }}>
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
          Drop file or click
        </div>
        
        <button
          onClick={handleSaveClick}
          title="Save Shape"
          onMouseEnter={() => setButtonHoverStates(prev => ({ ...prev, save: true }))}
          onMouseLeave={() => setButtonHoverStates(prev => ({ ...prev, save: false }))}
          style={getInlineButtonStyle(
            { variant: 'primary', size: 'small' },
            buttonHoverStates.save ? 'hover' : 'normal'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3M19 19H5V5H16.17L19 7.83V19M12 12C13.66 12 15 13.34 15 15S13.66 18 12 18 9 16.66 9 15 10.34 12 12 12M6 6H15V10H6V6Z"/>
          </svg>
        </button>
        
        <button
          onClick={handleCopyToClipboard}
          title="Copy to clipboard"
          onMouseEnter={() => setButtonHoverStates(prev => ({ ...prev, copy: true }))}
          onMouseLeave={() => setButtonHoverStates(prev => ({ ...prev, copy: false }))}
          style={getInlineButtonStyle(
            { variant: 'info', size: 'small' },
            buttonHoverStates.copy ? 'hover' : 'normal'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
          </svg>
        </button>
        
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to start fresh? Any unsaved changes will be lost.')) {
              window.location.reload();
            }
          }}
          title="Start fresh with a new shape"
          onMouseEnter={() => setButtonHoverStates(prev => ({ ...prev, new: true }))}
          onMouseLeave={() => setButtonHoverStates(prev => ({ ...prev, new: false }))}
          style={getInlineButtonStyle(
            { variant: 'secondary', size: 'small' },
            buttonHoverStates.new ? 'hover' : 'normal'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};