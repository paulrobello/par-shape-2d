/**
 * Debug utilities for position analysis and troubleshooting
 */

import { Shape } from '@/game/entities/Shape';
import { DEBUG_CONFIG } from '@/shared/utils/Constants';

export class DebugUtils {
  /**
   * Dump complete position information for all shapes and screws
   */
  static dumpPositions(shapes: Shape[]): void {
    if (!DEBUG_CONFIG.logDebugUtilities) return;
    
    console.log('🔍 ===== POSITION DUMP =====');
    console.log(`Found ${shapes.length} shapes`);
    
    shapes.forEach((shape, index) => {
      const positionMismatch = Math.abs(shape.position.x - shape.body.position.x) > 0.1 || 
                              Math.abs(shape.position.y - shape.body.position.y) > 0.1;
      
      console.log(`\n📦 Shape ${index + 1}: ${shape.id} (${shape.type}${shape.isComposite ? ', composite' : ''})`);
      console.log(`   Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
      console.log(`   Body.position:  (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
      console.log(`   Body.angle: ${(shape.body.angle * 180 / Math.PI).toFixed(1)}°`);
      console.log(`   Body.isStatic: ${shape.body.isStatic}`);
      
      if (positionMismatch) {
        console.error(`   ❌ POSITION MISMATCH!`);
      } else {
        console.log(`   ✅ Positions aligned`);
      }
      
      // Dump screws for this shape
      const screws = shape.getAllScrews();
      console.log(`   Screws: ${screws.length}`);
      
      screws.forEach((screw, screwIndex) => {
        const distance = Math.sqrt(
          Math.pow(screw.position.x - shape.body.position.x, 2) + 
          Math.pow(screw.position.y - shape.body.position.y, 2)
        );
        
        console.log(`     🔩 Screw ${screwIndex + 1}: ${screw.id} (${screw.color})`);
        console.log(`        Position: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
        console.log(`        Distance from shape center: ${distance.toFixed(1)}px`);
        console.log(`        Local offset: ${screw.localOffset ? `(${screw.localOffset.x.toFixed(1)}, ${screw.localOffset.y.toFixed(1)})` : 'not set'}`);
        console.log(`        State: ${screw.isCollected ? 'collected' : screw.isBeingCollected ? 'collecting' : 'active'}`);
        console.log(`        Has constraint: ${!!screw.constraint}`);
        console.log(`        Has anchor body: ${!!screw.anchorBody}`);
      });
    });
    
    console.log('🔍 ===== END DUMP =====\n');
  }

  /**
   * Dump information for a specific shape
   */
  static dumpShape(shape: Shape): void {
    if (!DEBUG_CONFIG.logDebugUtilities) return;
    
    console.log(`\n🔍 Shape Details: ${shape.id}`);
    console.log(`Type: ${shape.type}${shape.isComposite ? ' (composite)' : ''}`);
    console.log(`Shape.position: (${shape.position.x.toFixed(1)}, ${shape.position.y.toFixed(1)})`);
    console.log(`Body.position: (${shape.body.position.x.toFixed(1)}, ${shape.body.position.y.toFixed(1)})`);
    console.log(`Body.angle: ${(shape.body.angle * 180 / Math.PI).toFixed(1)}°`);
    console.log(`Body.isStatic: ${shape.body.isStatic}`);
    
    const screws = shape.getAllScrews();
    console.log(`Screws: ${screws.length}`);
    screws.forEach(screw => {
      console.log(`  - ${screw.id}: (${screw.position.x.toFixed(1)}, ${screw.position.y.toFixed(1)})`);
    });
  }

  /**
   * Set up keyboard listener for debug dump
   */
  static setupDebugKeyListener(getShapes: () => Shape[]): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Press 'D' key to dump positions
      if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        const shapes = getShapes();
        this.dumpPositions(shapes);
      }
    };

    // Remove any existing listener first
    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
    
    console.log('🔍 Debug key listener active: Press "D" to dump shape/screw positions');
  }

  /**
   * Clean up debug listeners
   */
  static cleanupDebugListeners(): void {
    // Note: Since we can't easily remove specific listeners, this is a placeholder
    // The listener will be replaced when setupDebugKeyListener is called again
  }
}