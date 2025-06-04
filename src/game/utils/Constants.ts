/**
 * Legacy game constants file
 * All constants have been moved to @/shared/utils/Constants
 * This file provides backward compatibility exports
 */

// Re-export all constants from shared location
export {
  GAME_CONFIG,
  SCREW_COLORS,
  SHAPE_TINTS,
  LAYOUT_CONSTANTS,
  UI_CONSTANTS,
  PHYSICS_CONSTANTS,
  DEBUG_CONFIG,
  getTotalLayersForLevel,
} from '@/shared/utils/Constants';

// Note: This file is maintained for backward compatibility only.
// New code should import directly from @/shared/utils/Constants