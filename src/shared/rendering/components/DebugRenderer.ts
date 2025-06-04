/**
 * Debug rendering utilities
 * Consolidates debug visualization patterns from game and editor
 */

import { Body, Bounds, Constraint } from 'matter-js';
import { GeometryRenderer } from '../core/GeometryRenderer';
import { TextRenderer } from './TextRenderer';
import { withContext } from '../core/CanvasUtils';
import { ColorTheme } from '../styles/ColorTheme';

export interface DebugOptions {
  showBounds?: boolean;
  showVelocity?: boolean;
  showAngle?: boolean;
  showConstraints?: boolean;
  showCenterOfMass?: boolean;
  showAxes?: boolean;
  showLabels?: boolean;
  showPerformance?: boolean;
  maxVelocityLength?: number;
  boundsColor?: string;
  velocityColor?: string;
  constraintColor?: string;
  axesColor?: string;
  labelColor?: string;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  bodies: number;
  constraints: number;
  timestamp: number;
}

/**
 * Debug rendering utilities class
 */
export class DebugRenderer {
  private static performanceHistory: PerformanceMetrics[] = [];
  private static maxHistorySize = 60; // 1 second at 60fps

  /**
   * Render debug information for a physics body
   */
  static renderBodyDebug(
    ctx: CanvasRenderingContext2D,
    body: Body,
    theme: ColorTheme,
    options: DebugOptions = {}
  ): void {
    const {
      showBounds = true,
      showVelocity = true,
      showAngle = true,
      showCenterOfMass = true,
      showAxes = false,
      showLabels = false,
      maxVelocityLength = 50,
    } = options;

    const debugColors = theme.debug;

    // Body bounds
    if (showBounds) {
      const bounds = body.bounds;
      GeometryRenderer.renderRectangle(ctx, {
        x: bounds.min.x,
        y: bounds.min.y,
        width: bounds.max.x - bounds.min.x,
        height: bounds.max.y - bounds.min.y,
        strokeColor: options.boundsColor || debugColors.bounds,
        lineWidth: 1,
      });
    }

    // Center of mass
    if (showCenterOfMass) {
      GeometryRenderer.renderPoint(ctx, {
        x: body.position.x,
        y: body.position.y,
        radius: 3,
        fillColor: debugColors.physics,
        style: 'cross',
      });
    }

    // Velocity vector
    if (showVelocity && (body.velocity.x !== 0 || body.velocity.y !== 0)) {
      const velocityMagnitude = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      const normalizedLength = Math.min(velocityMagnitude * 10, maxVelocityLength);
      
      const endX = body.position.x + (body.velocity.x / velocityMagnitude) * normalizedLength;
      const endY = body.position.y + (body.velocity.y / velocityMagnitude) * normalizedLength;

      GeometryRenderer.renderLine(ctx, {
        x1: body.position.x,
        y1: body.position.y,
        x2: endX,
        y2: endY,
        strokeColor: options.velocityColor || debugColors.warning,
        lineWidth: 2,
      });

      // Arrow head
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      const arrowSize = 5;
      GeometryRenderer.renderPolygon(ctx, {
        points: [
          { x: endX, y: endY },
          {
            x: endX - arrowSize * Math.cos(angle - Math.PI / 6),
            y: endY - arrowSize * Math.sin(angle - Math.PI / 6),
          },
          {
            x: endX - arrowSize * Math.cos(angle + Math.PI / 6),
            y: endY - arrowSize * Math.sin(angle + Math.PI / 6),
          },
        ],
        fillColor: options.velocityColor || debugColors.warning,
        closed: true,
      });
    }

    // Angle indicator
    if (showAngle && body.angle !== 0) {
      const angleLength = 20;
      const endX = body.position.x + Math.cos(body.angle) * angleLength;
      const endY = body.position.y + Math.sin(body.angle) * angleLength;

      GeometryRenderer.renderLine(ctx, {
        x1: body.position.x,
        y1: body.position.y,
        x2: endX,
        y2: endY,
        strokeColor: debugColors.info,
        lineWidth: 2,
      });
    }

    // Coordinate axes
    if (showAxes) {
      const axisLength = 30;

      // X-axis (red)
      GeometryRenderer.renderLine(ctx, {
        x1: body.position.x,
        y1: body.position.y,
        x2: body.position.x + axisLength,
        y2: body.position.y,
        strokeColor: '#ff0000',
        lineWidth: 1,
      });

      // Y-axis (green)
      GeometryRenderer.renderLine(ctx, {
        x1: body.position.x,
        y1: body.position.y,
        x2: body.position.x,
        y2: body.position.y + axisLength,
        strokeColor: '#00ff00',
        lineWidth: 1,
      });
    }

    // Labels
    if (showLabels) {
      const labelText = `ID: ${body.id}\nMass: ${body.mass.toFixed(2)}\nVel: ${Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2).toFixed(1)}`;
      
      TextRenderer.renderTextWithBackground(ctx, {
        x: body.position.x + 15,
        y: body.position.y - 15,
        text: labelText,
        font: '10px monospace',
        fillColor: options.labelColor || debugColors.text,
        backgroundColor: debugColors.background,
        padding: 3,
        textAlign: 'left',
        textBaseline: 'top',
      });
    }
  }

  /**
   * Render debug information for a constraint
   */
  static renderConstraintDebug(
    ctx: CanvasRenderingContext2D,
    constraint: Constraint,
    theme: ColorTheme,
    options: DebugOptions = {}
  ): void {
    const debugColors = theme.debug;
    const constraintColor = options.constraintColor || debugColors.constraint;

    if (!constraint.bodyA || !constraint.bodyB) return;

    const pointA = constraint.pointA;
    const pointB = constraint.pointB;
    const posA = {
      x: constraint.bodyA.position.x + pointA.x,
      y: constraint.bodyA.position.y + pointA.y,
    };
    const posB = {
      x: constraint.bodyB.position.x + pointB.x,
      y: constraint.bodyB.position.y + pointB.y,
    };

    // Constraint line
    GeometryRenderer.renderLine(ctx, {
      x1: posA.x,
      y1: posA.y,
      x2: posB.x,
      y2: posB.y,
      strokeColor: constraintColor,
      lineWidth: 2,
      lineDash: [5, 5],
    });

    // Attachment points
    GeometryRenderer.renderPoint(ctx, {
      x: posA.x,
      y: posA.y,
      radius: 3,
      fillColor: constraintColor,
      style: 'circle',
    });

    GeometryRenderer.renderPoint(ctx, {
      x: posB.x,
      y: posB.y,
      radius: 3,
      fillColor: constraintColor,
      style: 'circle',
    });

    // Length and stiffness info
    if (options.showLabels) {
      const length = Math.sqrt((posB.x - posA.x) ** 2 + (posB.y - posA.y) ** 2);
      const midX = (posA.x + posB.x) / 2;
      const midY = (posA.y + posB.y) / 2;

      TextRenderer.renderTextWithBackground(ctx, {
        x: midX,
        y: midY - 10,
        text: `L: ${length.toFixed(1)}\nS: ${constraint.stiffness}`,
        font: '9px monospace',
        fillColor: debugColors.text,
        backgroundColor: debugColors.background,
        padding: 2,
        textAlign: 'center',
        textBaseline: 'bottom',
      });
    }
  }

  /**
   * Render bounds debug visualization
   */
  static renderBoundsDebug(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    theme: ColorTheme,
    label?: string
  ): void {
    const debugColors = theme.debug;

    GeometryRenderer.renderRectangle(ctx, {
      x: bounds.min.x,
      y: bounds.min.y,
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y,
      strokeColor: debugColors.bounds,
      lineWidth: 1,
      fillColor: `${debugColors.bounds}20`, // 20% opacity
    });

    if (label) {
      TextRenderer.renderTextWithBackground(ctx, {
        x: bounds.min.x + 5,
        y: bounds.min.y + 5,
        text: label,
        font: '10px Arial',
        fillColor: debugColors.text,
        backgroundColor: debugColors.background,
        padding: 2,
      });
    }
  }

  /**
   * Render performance metrics overlay
   */
  static renderPerformanceOverlay(
    ctx: CanvasRenderingContext2D,
    metrics: PerformanceMetrics,
    theme: ColorTheme,
    x: number = 10,
    y: number = 10
  ): void {
    // Add to history
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    const debugColors = theme.debug;

    // Current metrics text
    const metricsText = [
      `FPS: ${metrics.fps.toFixed(1)}`,
      `Frame: ${metrics.frameTime.toFixed(1)}ms`,
      `Render: ${metrics.renderTime.toFixed(1)}ms`,
      `Bodies: ${metrics.bodies}`,
      `Constraints: ${metrics.constraints}`,
    ].join('\n');

    TextRenderer.renderTextWithBackground(ctx, {
      x,
      y,
      text: metricsText,
      font: '11px monospace',
      fillColor: debugColors.text,
      backgroundColor: debugColors.background,
      padding: 5,
      textAlign: 'left',
      textBaseline: 'top',
    });

    // FPS graph
    if (this.performanceHistory.length > 1) {
      this.renderFPSGraph(ctx, x, y + 80, 150, 50, theme);
    }
  }

  /**
   * Render FPS history graph
   */
  private static renderFPSGraph(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    theme: ColorTheme
  ): void {
    const debugColors = theme.debug;
    const history = this.performanceHistory;
    
    if (history.length < 2) return;

    withContext(ctx, () => {
      // Background
      GeometryRenderer.renderRectangle(ctx, {
        x,
        y,
        width,
        height,
        fillColor: debugColors.background,
        strokeColor: debugColors.grid,
        lineWidth: 1,
      });

      // Target FPS line (60 FPS)
      const targetY = y + height - (60 / 120) * height; // Scale to 120 max FPS
      GeometryRenderer.renderLine(ctx, {
        x1: x,
        y1: targetY,
        x2: x + width,
        y2: targetY,
        strokeColor: debugColors.info,
        lineWidth: 1,
        lineDash: [2, 2],
      });

      // FPS line
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < history.length; i++) {
        const fps = Math.min(history[i].fps, 120); // Cap at 120 FPS for display
        const pointX = x + (i / (history.length - 1)) * width;
        const pointY = y + height - (fps / 120) * height;
        points.push({ x: pointX, y: pointY });
      }

      GeometryRenderer.renderPolygon(ctx, {
        points,
        strokeColor: debugColors.warning,
        lineWidth: 2,
        closed: false,
      });

      // Labels
      TextRenderer.renderText(ctx, {
        x: x + 2,
        y: y + 12,
        text: '120',
        font: '9px monospace',
        fillColor: debugColors.text,
      });

      TextRenderer.renderText(ctx, {
        x: x + 2,
        y: y + height - 2,
        text: '0',
        font: '9px monospace',
        fillColor: debugColors.text,
      });

      TextRenderer.renderText(ctx, {
        x: x + width / 2,
        y: y - 5,
        text: 'FPS',
        font: '10px monospace',
        fillColor: debugColors.text,
        textAlign: 'center',
      });
    });
  }

  /**
   * Render grid for coordinate reference
   */
  static renderDebugGrid(
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number },
    gridSize: number,
    theme: ColorTheme,
    showLabels: boolean = false
  ): void {
    const debugColors = theme.debug;
    const { x, y, width, height } = bounds;

    withContext(ctx, () => {
      ctx.strokeStyle = debugColors.grid;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([1, 3]);

      // Vertical lines
      for (let i = Math.floor(x / gridSize) * gridSize; i <= x + width; i += gridSize) {
        if (i >= x && i <= x + width) {
          GeometryRenderer.renderLine(ctx, {
            x1: i,
            y1: y,
            x2: i,
            y2: y + height,
            strokeColor: debugColors.grid,
            lineWidth: 0.5,
          });

          if (showLabels && i % (gridSize * 5) === 0) {
            TextRenderer.renderText(ctx, {
              x: i + 2,
              y: y + 12,
              text: i.toString(),
              font: '8px monospace',
              fillColor: debugColors.text,
            });
          }
        }
      }

      // Horizontal lines
      for (let i = Math.floor(y / gridSize) * gridSize; i <= y + height; i += gridSize) {
        if (i >= y && i <= y + height) {
          GeometryRenderer.renderLine(ctx, {
            x1: x,
            y1: i,
            x2: x + width,
            y2: i,
            strokeColor: debugColors.grid,
            lineWidth: 0.5,
          });

          if (showLabels && i % (gridSize * 5) === 0) {
            TextRenderer.renderText(ctx, {
              x: x + 2,
              y: i - 2,
              text: i.toString(),
              font: '8px monospace',
              fillColor: debugColors.text,
            });
          }
        }
      }
    });
  }

  /**
   * Clear performance history
   */
  static clearPerformanceHistory(): void {
    this.performanceHistory = [];
  }

  /**
   * Get current performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }
}