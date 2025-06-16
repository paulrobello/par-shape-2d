'use client';

import { useState, useEffect, useCallback } from 'react';
import { DrawingToolManager } from '../systems/DrawingToolManager';
import { getButtonClasses } from '@/shared/styles/ButtonStyles';

interface ToolPaletteProps {
  drawingToolManager: DrawingToolManager;
  className?: string;
}

interface ToolConfig {
  name: string;
  displayName: string;
  cursor: string;
  icon?: string;
  description?: string;
}

// Tool icons using simple Unicode symbols for now
const TOOL_ICONS: Record<string, string> = {
  circle: '⭕',
  polygon: '⬢',
  rectangle: '▭',
  square: '⬜',
  capsule: '💊',
  path: '✏️'
};

export function ToolPalette({ drawingToolManager, className = '' }: ToolPaletteProps) {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const updateTools = useCallback(() => {
    const toolConfigs = drawingToolManager.getToolConfigs();
    setTools(toolConfigs);
  }, [drawingToolManager]);

  const updateActiveTool = useCallback(() => {
    const activeToolName = drawingToolManager.getActiveToolName();
    setActiveTool(activeToolName);
  }, [drawingToolManager]);

  useEffect(() => {
    // Initialize tools
    updateTools();
    updateActiveTool();

    // Subscribe to tool selection changes
    const unsubscribe = drawingToolManager.subscribeToEvent('editor:tool:selected', () => {
      updateActiveTool();
    });

    return unsubscribe;
  }, [drawingToolManager, updateTools, updateActiveTool]);

  const handleToolSelect = (toolName: string) => {
    drawingToolManager.selectTool(toolName);
  };

  const getToolIcon = (toolName: string): string => {
    return TOOL_ICONS[toolName] || '🔧';
  };

  return (
    <div className={`tool-palette flex flex-col items-center ${className}`}>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Tools
      </div>
      
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 p-1.5">
        <div className="flex items-center space-x-1">
          {tools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => handleToolSelect(tool.name)}
              title={tool.description || tool.displayName}
              className={getButtonClasses({
                variant: activeTool === tool.name ? 'primary' : 'secondary',
                size: 'small',
                active: activeTool === tool.name
              })}
              style={{
                minWidth: '80px',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{getToolIcon(tool.name)}</span>
              <span>{tool.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}