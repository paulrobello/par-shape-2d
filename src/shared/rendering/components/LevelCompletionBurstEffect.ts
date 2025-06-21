/**
 * Level completion burst and sparkle effect
 * Provides visual celebration when the last container is removed
 */

import { Vector2 } from '@/types/game';
import { AnimationState } from '@/shared/utils/AnimationUtils';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';
import { applyEasing } from '@/shared/utils/EasingFunctions';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

/**
 * Configuration for the burst effect
 */
export interface BurstEffectConfig {
  /** Duration of the entire effect in milliseconds */
  duration?: number;
  /** Number of burst particles shooting outward */
  burstParticleCount?: number;
  /** Number of sparkle particles twinkling */
  sparkleParticleCount?: number;
  /** Maximum distance burst particles travel */
  burstRadius?: number;
  /** Area radius for sparkle particle placement */
  sparkleRadius?: number;
  /** Base size for burst particles */
  burstParticleSize?: number;
  /** Base size for sparkle particles */
  sparkleParticleSize?: number;
  /** Font size for the COMPLETE text */
  textFontSize?: number;
  /** Wave amplitude for text animation */
  textWaveAmplitude?: number;
  /** Wave frequency for text animation */
  textWaveFrequency?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<BurstEffectConfig> = {
  duration: 2500, // 2.5 seconds (under 3 second requirement)
  burstParticleCount: 10,
  sparkleParticleCount: 18,
  burstRadius: 120,
  sparkleRadius: 80,
  burstParticleSize: 4,
  sparkleParticleSize: 2.5,
  textFontSize: 64,
  textWaveAmplitude: 15,
  textWaveFrequency: 2,
};

/**
 * Individual burst particle state
 */
interface BurstParticle {
  /** Starting position */
  startPosition: Vector2;
  /** Target position */
  targetPosition: Vector2;
  /** Current position */
  currentPosition: Vector2;
  /** Direction angle in radians */
  angle: number;
  /** Particle size */
  size: number;
  /** Current opacity */
  opacity: number;
  /** Color variation */
  color: string;
}

/**
 * Individual sparkle particle state
 */
interface SparkleParticle {
  /** Fixed position */
  position: Vector2;
  /** Base size */
  baseSize: number;
  /** Current scale multiplier */
  scale: number;
  /** Current opacity */
  opacity: number;
  /** Phase offset for twinkling */
  phaseOffset: number;
  /** Color */
  color: string;
}

/**
 * Individual letter state for wave text animation
 */
interface WaveTextLetter {
  /** The character */
  character: string;
  /** X position relative to text center */
  x: number;
  /** Base Y position */
  baseY: number;
  /** Current Y offset from wave */
  waveOffset: number;
  /** Phase offset for wave animation */
  phaseOffset: number;
  /** Current opacity */
  opacity: number;
}

/**
 * Main effect animation state
 */
interface EffectAnimationState extends AnimationState {
  /** Burst particles */
  burstParticles: BurstParticle[];
  /** Sparkle particles */
  sparkleParticles: SparkleParticle[];
  /** Wave text letters */
  waveTextLetters: WaveTextLetter[];
  /** Center position of the effect */
  centerPosition: Vector2;
  /** Text center position for wave text */
  textCenterPosition: Vector2;
}

/**
 * Level completion burst effect class
 * Creates a spectacular burst and sparkle animation for level completion
 */
export class LevelCompletionBurstEffect {
  private animationState: EffectAnimationState | null = null;
  private config: Required<BurstEffectConfig>;
  private hasLoggedFirstRender = false;

  /**
   * Create a new burst effect
   * @param config - Configuration options for the effect
   */
  constructor(config: BurstEffectConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (DEBUG_CONFIG.logLevelCompletionEffects) {
      console.log('🎆 LevelCompletionBurstEffect created with config:', this.config);
    }
  }

  /**
   * Start the burst effect at the specified position
   * @param centerPosition - Center point for the effect
   */
  start(centerPosition: Vector2): void {
    if (DEBUG_CONFIG.logLevelCompletionEffects) {
      console.log('🎆 Starting burst effect at:', centerPosition);
    }

    // Create burst particles in radial pattern
    const burstParticles: BurstParticle[] = [];
    for (let i = 0; i < this.config.burstParticleCount; i++) {
      const angle = (i / this.config.burstParticleCount) * Math.PI * 2;
      const distance = this.config.burstRadius * (0.8 + Math.random() * 0.4); // Vary distance
      
      const targetX = centerPosition.x + Math.cos(angle) * distance;
      const targetY = centerPosition.y + Math.sin(angle) * distance;
      
      const burstParticle: BurstParticle = {
        startPosition: { ...centerPosition },
        targetPosition: { x: targetX, y: targetY },
        currentPosition: { ...centerPosition },
        angle,
        size: this.config.burstParticleSize * (0.8 + Math.random() * 0.4),
        opacity: 1,
        color: this.getRandomBurstColor(),
      };
      
      burstParticles.push(burstParticle);
    }

    // Create sparkle particles in random positions around center
    const sparkleParticles: SparkleParticle[] = [];
    for (let i = 0; i < this.config.sparkleParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.config.sparkleRadius;
      
      const sparkleParticle: SparkleParticle = {
        position: {
          x: centerPosition.x + Math.cos(angle) * distance,
          y: centerPosition.y + Math.sin(angle) * distance,
        },
        baseSize: this.config.sparkleParticleSize * (0.6 + Math.random() * 0.8),
        scale: 1,
        opacity: 1,
        phaseOffset: Math.random() * Math.PI * 2,
        color: this.getRandomSparkleColor(),
      };
      
      sparkleParticles.push(sparkleParticle);
    }

    // Create wave text letters for "COMPLETE"
    const waveTextLetters = this.createWaveTextLetters(centerPosition);

    // Initialize animation state
    this.animationState = {
      isActive: true,
      progress: 0,
      startTime: Date.now(),
      duration: this.config.duration,
      burstParticles,
      sparkleParticles,
      waveTextLetters,
      centerPosition: { ...centerPosition },
      textCenterPosition: { 
        x: centerPosition.x, 
        y: centerPosition.y - 50 // Position text above the burst center
      },
    };
  }

  /**
   * Update the effect animation
   * @param deltaTime - Time elapsed since last update in milliseconds
   * @returns true if the effect is complete, false otherwise
   */
  update(deltaTime: number): boolean {
    if (!this.animationState || !this.animationState.isActive) {
      return true;
    }

    // Update progress
    const progressIncrement = deltaTime / this.animationState.duration;
    this.animationState.progress = Math.min(1, this.animationState.progress + progressIncrement);

    const progress = this.animationState.progress;

    // Update burst particles (0-0.5s: rapid expansion)
    const burstProgress = Math.min(1, progress * 2); // Double speed for burst phase
    for (const particle of this.animationState.burstParticles) {
      if (burstProgress < 1) {
        // Burst particles expand outward with easeOutCubic
        const easedProgress = applyEasing(burstProgress, 'easeOutCubic');
        
        particle.currentPosition.x = particle.startPosition.x + 
          (particle.targetPosition.x - particle.startPosition.x) * easedProgress;
        particle.currentPosition.y = particle.startPosition.y + 
          (particle.targetPosition.y - particle.startPosition.y) * easedProgress;
        
        // Fade out particles as they expand
        particle.opacity = 1 - easedProgress * 0.7; // Keep some opacity longer
      } else {
        // Final fade out phase
        const fadeProgress = (progress - 0.5) * 2; // 0.5-1.0 -> 0-1
        particle.opacity = Math.max(0, 0.3 - fadeProgress * 0.3);
      }
    }

    // Update sparkle particles (0.2-2.0s: twinkling)
    const sparkleStartTime = 0.2; // Start after burst begins
    const sparkleEndTime = 0.8; // End before total completion
    
    if (progress >= sparkleStartTime) {
      const sparkleProgress = Math.min(1, (progress - sparkleStartTime) / (sparkleEndTime - sparkleStartTime));
      
      for (const particle of this.animationState.sparkleParticles) {
        // Twinkling effect with sine wave and phase offset
        const twinklePhase = progress * 6 + particle.phaseOffset; // 6 full cycles over effect duration
        const twinkleValue = (Math.sin(twinklePhase) + 1) / 2; // 0-1 range
        
        particle.scale = 0.5 + twinkleValue * 1.5; // Scale between 0.5x and 2x
        
        // Fade out sparkles over time
        particle.opacity = Math.max(0, 1 - sparkleProgress);
      }
    }

    // Update wave text (0.3-2.2s: wave animation)
    const textStartTime = 0.3; // Start after burst begins
    const textEndTime = 0.88; // End before total completion
    
    if (progress >= textStartTime) {
      const textProgress = Math.min(1, (progress - textStartTime) / (textEndTime - textStartTime));
      
      for (const letter of this.animationState.waveTextLetters) {
        // Wave animation with sine wave and phase offset
        const wavePhase = progress * this.config.textWaveFrequency * Math.PI * 2 + letter.phaseOffset;
        letter.waveOffset = Math.sin(wavePhase) * this.config.textWaveAmplitude;
        
        // Fade in text smoothly
        if (textProgress < 0.2) {
          letter.opacity = textProgress / 0.2; // Fade in over first 20% of text duration
        } else if (textProgress > 0.8) {
          letter.opacity = 1 - ((textProgress - 0.8) / 0.2); // Fade out over last 20%
        } else {
          letter.opacity = 1; // Full opacity in the middle
        }
      }
    }

    // Check if effect is complete
    if (this.animationState.progress >= 1) {
      this.animationState.isActive = false;
      
      if (DEBUG_CONFIG.logLevelCompletionEffects) {
        console.log('🎆 Burst effect completed');
      }
      
      return true;
    }

    return false;
  }

  /**
   * Render the effect
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.animationState || !this.animationState.isActive) {
      return;
    }
    
    // Debug logging for first render
    if (DEBUG_CONFIG.logLevelCompletionEffects && !this.hasLoggedFirstRender) {
      console.log('🎆 LevelCompletionBurstEffect.render() called - effect is active');
      this.hasLoggedFirstRender = true;
    }

    // Render burst particles
    for (const particle of this.animationState.burstParticles) {
      if (particle.opacity > 0.01) {
        GeometryRenderer.renderCircle(ctx, {
          x: particle.currentPosition.x,
          y: particle.currentPosition.y,
          radius: particle.size,
          fillColor: particle.color,
          glowColor: particle.color,
          glowBlur: particle.size * 2,
          shadowBlur: particle.size,
          shadowColor: particle.color,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        });
      }
    }

    // Render sparkle particles
    for (const particle of this.animationState.sparkleParticles) {
      if (particle.opacity > 0.01) {
        const renderRadius = particle.baseSize * particle.scale;
        const alpha = Math.round(particle.opacity * 255).toString(16).padStart(2, '0');
        const colorWithAlpha = particle.color + alpha;
        
        GeometryRenderer.renderCircle(ctx, {
          x: particle.position.x,
          y: particle.position.y,
          radius: renderRadius,
          fillColor: colorWithAlpha,
          glowColor: particle.color,
          glowBlur: renderRadius * 3,
        });
      }
    }

    // Render wave text
    this.renderWaveText(ctx);
  }

  /**
   * Check if the effect is currently active
   * @returns true if the effect is running
   */
  isActive(): boolean {
    return this.animationState?.isActive || false;
  }

  /**
   * Get the current progress of the effect (0-1)
   * @returns progress value or 0 if not active
   */
  getProgress(): number {
    return this.animationState?.progress || 0;
  }

  /**
   * Stop the effect immediately
   */
  stop(): void {
    if (this.animationState) {
      this.animationState.isActive = false;
      
      if (DEBUG_CONFIG.logLevelCompletionEffects) {
        console.log('🎆 Burst effect stopped');
      }
    }
  }

  /**
   * Get a random color for burst particles
   * @returns hex color string
   */
  private getRandomBurstColor(): string {
    const colors = [
      '#FFD700', // Gold
      '#FF6B35', // Orange-red
      '#F7931E', // Orange
      '#FFFF00', // Yellow
      '#FF1493', // Deep pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get a random color for sparkle particles
   * @returns hex color string
   */
  private getRandomSparkleColor(): string {
    const colors = [
      '#FFFFFF', // White
      '#E6F3FF', // Light blue
      '#FFF8DC', // Cornsilk (light yellow)
      '#F0F8FF', // Alice blue
      '#FFFACD', // Lemon chiffon
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Create wave text letters for "COMPLETE"
   * @param centerPosition - Center position for calculating text placement
   * @returns Array of wave text letters
   */
  private createWaveTextLetters(centerPosition: Vector2): WaveTextLetter[] {
    const text = 'COMPLETE';
    const letters: WaveTextLetter[] = [];
    
    // Create a temporary canvas to measure text width
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.font = `bold ${this.config.textFontSize}px Arial, sans-serif`;
    
    // Measure total text width
    const totalWidth = tempCtx.measureText(text).width;
    
    // Calculate starting X position to center the text
    let currentX = centerPosition.x - totalWidth / 2;
    const baseY = centerPosition.y - 50; // Position text above burst center
    
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      const charWidth = tempCtx.measureText(character).width;
      
      const letter: WaveTextLetter = {
        character,
        x: currentX + charWidth / 2, // Center of character
        baseY,
        waveOffset: 0,
        phaseOffset: (i / text.length) * Math.PI * 2, // Distribute phase across letters
        opacity: 0,
      };
      
      letters.push(letter);
      currentX += charWidth;
    }
    
    return letters;
  }

  /**
   * Render the wave text effect
   * @param ctx - Canvas rendering context
   */
  private renderWaveText(ctx: CanvasRenderingContext2D): void {
    if (!this.animationState || this.animationState.waveTextLetters.length === 0) {
      return;
    }

    // Set up text styling
    ctx.save();
    ctx.font = `bold ${this.config.textFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Render each letter with wave effect
    for (const letter of this.animationState.waveTextLetters) {
      if (letter.opacity > 0.01) {
        const y = letter.baseY + letter.waveOffset;
        const alpha = Math.round(letter.opacity * 255).toString(16).padStart(2, '0');
        
        // Green color with calculated alpha
        const fillColor = `#2ECC71${alpha}`; // Professional green
        const strokeColor = `#27AE60${alpha}`; // Darker green for stroke
        const glowColor = `#58D68D${alpha}`; // Lighter green for glow
        
        // Render text with glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Stroke for definition
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeText(letter.character, letter.x, y);
        
        // Fill
        ctx.fillStyle = fillColor;
        ctx.fillText(letter.character, letter.x, y);
        
        // Reset shadow for next character
        ctx.shadowBlur = 0;
      }
    }
    
    ctx.restore();
  }
}