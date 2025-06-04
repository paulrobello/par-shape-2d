import { Common } from 'matter-js';
import * as decomp from 'poly-decomp-es';

// Track initialization state internally
let isInitialized = false;

/**
 * Initializes the poly-decomp library for Matter.js
 * This must be called before any Bodies.fromVertices() operations
 */
export function initializePolyDecomp(): void {
  if (!isInitialized) {
    // Set the poly-decomp library for Matter.js to use
    Common.setDecomp(decomp);
    isInitialized = true;
    console.log('✅ Poly-decomp library initialized for Matter.js Bodies.fromVertices support');
  }
}

/**
 * Check if poly-decomp has been initialized
 */
export function isPolyDecompInitialized(): boolean {
  return isInitialized;
}