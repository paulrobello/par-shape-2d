'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EditorManager } from '@/editor/core/EditorManager';
import { ShapeDefinition } from '@/types/shapes';
import { EditorTheme } from '@/editor/utils/theme';
import { GridControls } from '@/editor/components/GridControls';

interface PropertyPanelProps {
  editorManager: EditorManager | null;
  theme: EditorTheme;
}

interface FormFieldProps {
  label: string;
  path: string;
  value: unknown;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  onChange: (path: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  theme: EditorTheme;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  path,
  value,
  type,
  options,
  min,
  max,
  step,
  onChange,
  error,
  disabled,
  theme
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let newValue: unknown = event.target.value;
    
    if (type === 'number') {
      newValue = parseFloat(newValue as string);
      if (isNaN(newValue as number)) newValue = 0;
    } else if (type === 'boolean') {
      newValue = (event.target as HTMLInputElement).checked;
    }
    
    onChange(path, newValue);
  }, [path, type, onChange]);

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '12px', 
        fontWeight: 'bold', 
        marginBottom: '4px',
        color: error ? theme.status.error : theme.text.secondary
      }}>
        {label}
      </label>
      
      {type === 'select' ? (
        <select
          value={String(value || '')}
          onChange={handleChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '6px',
            border: `1px solid ${error ? theme.status.error : theme.input.border}`,
            borderRadius: '4px',
            fontSize: '12px',
            color: disabled ? theme.text.disabled : theme.input.text,
            backgroundColor: disabled ? theme.background.secondary : theme.input.background,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {options?.map(option => (
            <option key={String(option)} value={String(option)}>{String(option)}</option>
          ))}
        </select>
      ) : type === 'boolean' ? (
        <input
          type="checkbox"
          checked={Boolean(value) || false}
          onChange={handleChange}
          disabled={disabled}
          style={{ 
            marginTop: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ) : (
        <input
          type={type}
          value={String(value || '')}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '6px',
            border: `1px solid ${error ? theme.status.error : theme.input.border}`,
            borderRadius: '4px',
            fontSize: '12px',
            color: disabled ? theme.text.disabled : theme.input.text,
            backgroundColor: disabled ? theme.background.secondary : theme.input.background,
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      )}
      
      {error && (
        <div style={{ 
          fontSize: '11px', 
          color: theme.status.error, 
          marginTop: '2px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ editorManager, theme }) => {
  const [currentShape, setCurrentShape] = useState<ShapeDefinition | null>(null);
  const [collapsed, setCollapsed] = useState<{ [section: string]: boolean }>({});

  useEffect(() => {
    if (!editorManager) return;

    const editorState = editorManager.getEditorState();
    
    const unsubscribe = editorState.onStateChange((state) => {
      setCurrentShape(state.currentShape);
    });

    // Initial state
    setCurrentShape(editorState.getCurrentShape());

    return unsubscribe;
  }, [editorManager]);

  const handlePropertyChange = useCallback(async (path: string, value: unknown) => {
    if (!editorManager) return;

    const propertyManager = editorManager.getPropertyManager();
    const eventBus = propertyManager['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:property:changed',
      payload: { path, value },
    });
  }, [editorManager]);

  const handleRandomizeAll = useCallback(async () => {
    if (!editorManager) return;

    const propertyManager = editorManager.getPropertyManager();
    const eventBus = propertyManager['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:property:random:requested',
      payload: {},
    });
  }, [editorManager]);

  const handleResetAll = useCallback(async () => {
    if (!editorManager) return;

    const propertyManager = editorManager.getPropertyManager();
    const eventBus = propertyManager['eventBus']; // Access protected eventBus
    await eventBus.emit({
      type: 'editor:property:reset:requested',
      payload: {},
    });
  }, [editorManager]);

  const toggleSection = useCallback((section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  };

  const renderSection = (title: string, sectionKey: string, children: React.ReactNode) => (
    <div style={{ marginBottom: '16px' }}>
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{
          padding: '8px',
          backgroundColor: theme.background.tertiary,
          border: `1px solid ${theme.border.primary}`,
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          color: theme.text.primary,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {title}
        <span style={{ color: theme.text.secondary }}>{collapsed[sectionKey] ? '▼' : '▲'}</span>
      </div>
      {!collapsed[sectionKey] && (
        <div style={{ padding: '12px', border: `1px solid ${theme.border.primary}`, borderTop: 'none' }}>
          {children}
        </div>
      )}
    </div>
  );

  if (!currentShape) {
    return (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: theme.text.primary }}>Properties</h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          No shape selected. Load a shape file to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      height: '100%', 
      overflowY: 'auto',
      fontSize: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, color: theme.text.primary }}>Properties</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleRandomizeAll}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.button.backgroundActive}`,
              borderRadius: '4px',
              backgroundColor: theme.button.backgroundActive,
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            Random
          </button>
          <button
            onClick={handleResetAll}
            style={{
              padding: '4px 8px',
              border: '1px solid #6c757d',
              borderRadius: '4px',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Basic Properties */}
      {renderSection('Basic', 'basic', (
        <>
          <FormField
            label="ID"
            path="id"
            value={currentShape.id}
            type="text"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme}
          />
          <FormField
            label="Name"
            path="name"
            value={currentShape.name}
            type="text"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['name']}
          />
          <FormField
            label="Category"
            path="category"
            value={currentShape.category}
            type="select"
            options={['basic', 'polygon', 'path', 'composite']}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['category']}
          />
          <FormField
            label="Enabled"
            path="enabled"
            value={currentShape.enabled}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['enabled']}
          />
        </>
      ))}

      {/* Dimensions */}
      {renderSection('Dimensions', 'dimensions', (
        <>
          <FormField
            label="Type"
            path="dimensions.type"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.type')}
            type="select"
            options={['fixed', 'random']}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['dimensions.type']}
          />
          
          {currentShape.dimensions?.width && (
            <>
              <FormField
                label="Width Min"
                path="dimensions.width.min"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.width.min')}
                type="number"
                min={10}
                max={1000}
                onChange={handlePropertyChange}
                error={undefined}
                disabled={!!currentShape.dimensions?.radius}
            theme={theme} // errors['dimensions.width.min']}
              />
              <FormField
                label="Width Max"
                path="dimensions.width.max"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.width.max')}
                type="number"
                min={10}
                max={1000}
                onChange={handlePropertyChange}
                error={undefined}
                disabled={!!currentShape.dimensions?.radius}
            theme={theme} // errors['dimensions.width.max']}
              />
            </>
          )}
          
          {currentShape.dimensions?.height && (
            <>
              <FormField
                label="Height Min"
                path="dimensions.height.min"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.height.min')}
                type="number"
                min={10}
                max={1000}
                onChange={handlePropertyChange}
                error={undefined}
                disabled={!!currentShape.dimensions?.radius}
            theme={theme} // errors['dimensions.height.min']}
              />
              <FormField
                label="Height Max"
                path="dimensions.height.max"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.height.max')}
                type="number"
                min={10}
                max={1000}
                onChange={handlePropertyChange}
                error={undefined}
                disabled={!!currentShape.dimensions?.radius}
            theme={theme} // errors['dimensions.height.max']}
              />
            </>
          )}
          
          {currentShape.dimensions?.radius && (
            <>
              <FormField
                label="Radius Min"
                path="dimensions.radius.min"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.radius.min')}
                type="number"
                min={5}
                max={500}
                onChange={handlePropertyChange}
                error={undefined}
            theme={theme} // errors['dimensions.radius.min']}
              />
              <FormField
                label="Radius Max"
                path="dimensions.radius.max"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.radius.max')}
                type="number"
                min={5}
                max={500}
                onChange={handlePropertyChange}
                error={undefined}
            theme={theme} // errors['dimensions.radius.max']}
              />
            </>
          )}
          
          {currentShape.dimensions?.sides && (
            <FormField
              label="Sides"
              path="dimensions.sides"
              value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'dimensions.sides')}
              type="number"
              min={3}
              max={8}
              onChange={handlePropertyChange}
              error={undefined}
            theme={theme} // errors['dimensions.sides']}
            />
          )}
        </>
      ))}

      {/* Physics */}
      {renderSection('Physics', 'physics', (
        <>
          <FormField
            label="Type"
            path="physics.type"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'physics.type')}
            type="select"
            options={['rectangle', 'circle', 'polygon', 'fromVertices', 'composite']}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['physics.type']}
          />
          <FormField
            label="Decomposition"
            path="physics.decomposition"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'physics.decomposition')}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['physics.decomposition']}
          />
        </>
      ))}

      {/* Rendering */}
      {renderSection('Rendering', 'rendering', (
        <>
          <FormField
            label="Type"
            path="rendering.type"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'rendering.type')}
            type="select"
            options={['primitive', 'path', 'composite']}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['rendering.type']}
          />
          <FormField
            label="Preserve Original Vertices"
            path="rendering.preserveOriginalVertices"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'rendering.preserveOriginalVertices')}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['rendering.preserveOriginalVertices']}
          />
        </>
      ))}

      {/* Screw Placement */}
      {renderSection('Screw Placement', 'screwPlacement', (
        <>
          <FormField
            label="Strategy"
            path="screwPlacement.strategy"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.strategy')}
            type="select"
            options={['corners', 'perimeter', 'grid', 'custom', 'capsule']}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['screwPlacement.strategy']}
          />
          
          {/* Corner Strategy Fields */}
          {currentShape.screwPlacement?.strategy === 'corners' && (
            <FormField
              label="Corner Margin"
              path="screwPlacement.cornerMargin"
              value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.cornerMargin')}
              type="number"
              min={5}
              max={100}
              onChange={handlePropertyChange}
              error={undefined}
              theme={theme} // errors['screwPlacement.cornerMargin']}
            />
          )}
          
          {/* Perimeter Strategy Fields */}
          {currentShape.screwPlacement?.strategy === 'perimeter' && (
            <>
              <FormField
                label="Perimeter Points"
                path="screwPlacement.perimeterPoints"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.perimeterPoints')}
                type="number"
                min={3}
                max={20}
                onChange={handlePropertyChange}
                error={undefined}
                theme={theme}
              />
              <FormField
                label="Perimeter Margin"
                path="screwPlacement.perimeterMargin"
                value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.perimeterMargin')}
                type="number"
                min={5}
                max={50}
                onChange={handlePropertyChange}
                error={undefined}
                theme={theme}
              />
            </>
          )}
          
          {/* Grid Strategy Fields */}
          {currentShape.screwPlacement?.strategy === 'grid' && (
            <FormField
              label="Grid Spacing"
              path="screwPlacement.gridSpacing"
              value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.gridSpacing')}
              type="number"
              min={20}
              max={100}
              onChange={handlePropertyChange}
              error={undefined}
              theme={theme}
            />
          )}
          
          {/* Capsule Strategy Fields */}
          {currentShape.screwPlacement?.strategy === 'capsule' && (
            <FormField
              label="Capsule End Margin"
              path="screwPlacement.capsuleEndMargin"
              value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.capsuleEndMargin')}
              type="number"
              min={5}
              max={50}
              onChange={handlePropertyChange}
              error={undefined}
              theme={theme}
            />
          )}
          
          {/* Custom Strategy Note */}
          {currentShape.screwPlacement?.strategy === 'custom' && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: theme.background.tertiary,
              borderRadius: '4px',
              fontSize: '12px',
              color: theme.text.secondary,
              marginBottom: '12px'
            }}>
              Custom positions are set by clicking on the canvas
            </div>
          )}
          
          {/* Min Separation - Always visible */}
          <FormField
            label="Min Separation"
            path="screwPlacement.minSeparation"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'screwPlacement.minSeparation')}
            type="number"
            min={20}
            max={200}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['screwPlacement.minSeparation']}
          />
        </>
      ))}

      {/* Visual */}
      {renderSection('Visual', 'visual', (
        <>
          <FormField
            label="Supports Holes"
            path="visual.supportsHoles"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'visual.supportsHoles')}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['visual.supportsHoles']}
          />
        </>
      ))}

      {/* Behavior */}
      {renderSection('Behavior', 'behavior', (
        <>
          <FormField
            label="Allow Single Screw"
            path="behavior.allowSingleScrew"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'behavior.allowSingleScrew')}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['behavior.allowSingleScrew']}
          />
          <FormField
            label="Single Screw Dynamic"
            path="behavior.singleScrewDynamic"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'behavior.singleScrewDynamic')}
            type="boolean"
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['behavior.singleScrewDynamic']}
          />
          <FormField
            label="Rotational Inertia Multiplier"
            path="behavior.rotationalInertiaMultiplier"
            value={getNestedValue(currentShape as unknown as Record<string, unknown>, 'behavior.rotationalInertiaMultiplier')}
            type="number"
            min={1}
            max={10}
            step={0.1}
            onChange={handlePropertyChange}
            error={undefined}
            theme={theme} // errors['behavior.rotationalInertiaMultiplier']}
          />
        </>
      ))}

      {/* Grid Settings */}
      {editorManager && (
        <div className="border-t pt-4">
          <GridControls
            gridManager={editorManager.getGridManager()}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
};