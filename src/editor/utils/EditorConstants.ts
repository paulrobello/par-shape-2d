/**
 * Legacy editor constants file
 * All constants have been moved to @/shared/utils/Constants
 * This file provides backward compatibility exports
 */

// Re-export all constants from shared location
export {
  EDITOR_CONFIG as EDITOR_CONSTANTS,
  EDITOR_EVENTS,
} from '@/shared/utils/Constants';

export type EditorConstants = typeof import('@/shared/utils/Constants').EDITOR_CONFIG;
export type EditorEventNames = typeof import('@/shared/utils/Constants').EDITOR_EVENTS;

// Note: This file is maintained for backward compatibility only.
// New code should import directly from @/shared/utils/Constants