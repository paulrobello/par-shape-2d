/**
 * Level completion burst and sparkle effect
 * Provides visual celebration when the last container is removed
 */

import { Vector2 } from '@/types/game';
import { AnimationState } from '@/shared/utils/AnimationUtils';
import { GeometryRenderer } from '@/shared/rendering/core/GeometryRenderer';
import { applyEasing } from '@/shared/utils/EasingFunctions';
import { DEBUG_CONFIG, ANIMATION_CONSTANTS } from '@/shared/utils/Constants';

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
  duration: ANIMATION_CONSTANTS.levelCompletion.burstDuration, // 2.5 seconds (under 3 second requirement)
  burstParticleCount: 20, // Increased from 10 for good visual impact but optimized for performance
  sparkleParticleCount: 30, // Increased from 18 but reduced from doubled values for better performance
  burstRadius: 120,
  sparkleRadius: 80,
  burstParticleSize: 4,
  sparkleParticleSize: 2.5,
  textFontSize: 48, // Slightly smaller for better fit
  textWaveAmplitude: 20, // Increased wave amplitude for more visibility
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
    
    if (DEBUG_CONFIG.logLevelCompletionEffects) {
      console.log(`🎆 Created ${waveTextLetters.length} wave text letters for "COMPLETE"`);
    }

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
        y: centerPosition.y - 20 // Position text closer to the burst center
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

    // Update wave text (0.2-2.4s: wave animation) - Extended for better visibility
    const textStartTime = 0.2; // Start earlier for better visibility
    const textEndTime = 0.96; // End later, closer to total completion
    
    if (progress >= textStartTime) {
      const textProgress = Math.min(1, (progress - textStartTime) / (textEndTime - textStartTime));
      
      // Debug text timing occasionally
      if (DEBUG_CONFIG.logLevelCompletionEffects && Math.random() < 0.05) { // 5% chance
        console.log(`🎆 Text update: progress=${progress.toFixed(3)}, textProgress=${textProgress.toFixed(3)}, startTime=${textStartTime}, endTime=${textEndTime}`);
      }
      
      for (const letter of this.animationState.waveTextLetters) {
        // Wave animation with sine wave and phase offset
        const wavePhase = progress * this.config.textWaveFrequency * Math.PI * 2 + letter.phaseOffset;
        letter.waveOffset = Math.sin(wavePhase) * this.config.textWaveAmplitude;
        
        // Fade in text smoothly with longer full visibility period
        if (textProgress < 0.15) {
          letter.opacity = textProgress / 0.15; // Fade in over first 15% of text duration
        } else if (textProgress > 0.85) {
          letter.opacity = 1 - ((textProgress - 0.85) / 0.15); // Fade out over last 15%
        } else {
          letter.opacity = 1; // Full opacity for 70% of the text duration
        }
      }
    } else {
      // Before text start time - ensure letters are invisible
      for (const letter of this.animationState.waveTextLetters) {
        letter.opacity = 0;
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
      if (particle.opacity > 0.05) { // Early culling for better performance
        GeometryRenderer.renderCircle(ctx, {
          x: particle.currentPosition.x,
          y: particle.currentPosition.y,
          radius: particle.size,
          fillColor: particle.color,
          glowColor: particle.color,
          glowBlur: particle.size * 1.5, // Reduced glow for better performance
          shadowBlur: particle.size,
          shadowColor: particle.color,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        });
      }
    }

    // Render sparkle particles
    for (const particle of this.animationState.sparkleParticles) {
      if (particle.opacity > 0.05) { // Early culling for better performance
        const renderRadius = particle.baseSize * particle.scale;
        // Use CSS rgba format instead of hex for better performance
        const colorWithAlpha = `rgba(255, 255, 255, ${particle.opacity})`;
        
        GeometryRenderer.renderCircle(ctx, {
          x: particle.position.x,
          y: particle.position.y,
          radius: renderRadius,
          fillColor: colorWithAlpha,
          glowColor: particle.color,
          glowBlur: renderRadius * 1.5, // Reduced glow for better performance
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
    const baseY = centerPosition.y - 20; // Position text closer to burst center for better visibility
    
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
      if (DEBUG_CONFIG.logLevelCompletionEffects) {
        console.log('🎆 Wave text render skipped - no animation state or letters');
      }
      return;
    }

    // Debug: Log wave text state periodically
    if (DEBUG_CONFIG.logLevelCompletionEffects && Math.random() < 0.1) { // 10% chance to log
      const maxOpacity = Math.max(...this.animationState.waveTextLetters.map(l => l.opacity));
      console.log(`🎆 Wave text render: ${this.animationState.waveTextLetters.length} letters, max opacity: ${maxOpacity.toFixed(3)}, progress: ${this.animationState.progress.toFixed(3)}`);
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
        
        // Debug log first letter occasionally
        if (DEBUG_CONFIG.logLevelCompletionEffects && letter.character === 'C' && Math.random() < 0.05) {
          console.log(`🎆 Rendering letter '${letter.character}' at (${letter.x.toFixed(1)}, ${y.toFixed(1)}) with opacity ${letter.opacity.toFixed(3)}`);
        }
        
        // Use CSS alpha format instead of hex for better compatibility
        const opacity = Math.max(0.3, letter.opacity); // Ensure better visibility
        const fillColor = `rgba(46, 204, 113, ${opacity})`; // Professional green
        const strokeColor = `rgba(39, 174, 96, ${opacity})`; // Darker green for stroke
        const glowColor = `rgba(88, 214, 141, ${opacity})`; // Lighter green for glow
        
        // Render text with optimized glow effect for performance and visibility
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Stroke for definition - wider stroke for better visibility
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 4;
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