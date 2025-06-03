'use client';

import { useState, useEffect } from 'react';
import { GridManager, type GridSettings } from '../systems/GridManager';

interface GridControlsProps {
  gridManager: GridManager;
  className?: string;
}

const GRID_SIZE_OPTIONS = [
  { value: 5, label: '5px' },
  { value: 10, label: '10px' },
  { value: 20, label: '20px' },
  { value: 50, label: '50px' }
];

export function GridControls({ gridManager, className = '' }: GridControlsProps) {
  const [settings, setSettings] = useState<GridSettings>(gridManager.getSettings());

  useEffect(() => {
    const updateSettings = () => {
      setSettings(gridManager.getSettings());
    };

    // Subscribe to grid events to update UI
    const unsubscribeToggled = gridManager.subscribeToEvent('editor:grid:toggled', updateSettings);
    const unsubscribeSizeChanged = gridManager.subscribeToEvent('editor:grid:size:changed', updateSettings);
    const unsubscribeSnapToggled = gridManager.subscribeToEvent('editor:grid:snap:toggled', updateSettings);

    return () => {
      unsubscribeToggled();
      unsubscribeSizeChanged();
      unsubscribeSnapToggled();
    };
  }, [gridManager]);

  const handleGridToggle = (enabled: boolean) => {
    gridManager.updateSettings({ enabled });
  };

  const handleGridSizeChange = (size: number) => {
    gridManager.updateSettings({ size });
  };

  const handleSnapToggle = (snapEnabled: boolean) => {
    gridManager.updateSettings({ snapEnabled });
  };

  return (
    <div className={`grid-controls ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Grid Settings
      </h3>
      
      <div className="space-y-3">
        {/* Grid Enabled Toggle */}
        <div className="flex items-center justify-between">
          <label 
            htmlFor="grid-enabled" 
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Show Grid
          </label>
          <input
            id="grid-enabled"
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleGridToggle(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Grid Size Selector */}
        <div className="flex items-center justify-between">
          <label 
            htmlFor="grid-size" 
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Grid Size
          </label>
          <select
            id="grid-size"
            value={settings.size}
            onChange={(e) => handleGridSizeChange(Number(e.target.value))}
            disabled={!settings.enabled}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {GRID_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Snap to Grid Toggle */}
        <div className="flex items-center justify-between">
          <label 
            htmlFor="grid-snap" 
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Snap to Grid
          </label>
          <input
            id="grid-snap"
            type="checkbox"
            checked={settings.snapEnabled}
            onChange={(e) => handleSnapToggle(e.target.checked)}
            disabled={!settings.enabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Grid Info */}
        {settings.enabled && (
          <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400">
            <div>Grid: {settings.size}px spacing</div>
            <div>Snap: {settings.snapEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        )}
      </div>
    </div>
  );
}