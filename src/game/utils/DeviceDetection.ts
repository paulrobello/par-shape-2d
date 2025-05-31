import { isMobile, isTablet, isDesktop } from 'react-device-detect';

/**
 * Centralized device detection utilities using react-device-detect library
 */
export class DeviceDetection {
  /**
   * Check if the current device is mobile or tablet
   */
  static isMobileDevice(): boolean {
    return isMobile || isTablet;
  }

  /**
   * Check if the current device is specifically mobile (phone)
   */
  static isMobile(): boolean {
    return isMobile;
  }

  /**
   * Check if the current device is specifically tablet
   */
  static isTablet(): boolean {
    return isTablet;
  }

  /**
   * Check if the current device is desktop
   */
  static isDesktop(): boolean {
    return isDesktop;
  }

  /**
   * Get device type as string for logging/debugging
   */
  static getDeviceType(): string {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'unknown';
  }

  /**
   * Get detailed device info for debugging
   */
  static getDeviceInfo(): {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    deviceType: string;
  } {
    return {
      isMobile,
      isTablet,
      isDesktop,
      deviceType: this.getDeviceType()
    };
  }
}