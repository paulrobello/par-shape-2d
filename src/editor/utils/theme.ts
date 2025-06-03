/**
 * Theme definitions for the editor UI
 */

export interface EditorTheme {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  // Border colors
  border: {
    primary: string;
    secondary: string;
  };
  // Button colors
  button: {
    background: string;
    backgroundHover: string;
    backgroundActive: string;
    backgroundDisabled: string;
    text: string;
    textDisabled: string;
    border: string;
  };
  // Input colors
  input: {
    background: string;
    border: string;
    borderFocus: string;
    text: string;
    placeholder: string;
  };
  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Canvas colors
  canvas: {
    background: string;
    shape: string;
    screw: string;
    indicator: string;
  };
}

export const lightTheme: EditorTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    tertiary: '#f8f9fa',
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    muted: '#6c757d',
  },
  border: {
    primary: '#e0e0e0',
    secondary: '#ccc',
  },
  button: {
    background: '#ffffff',
    backgroundHover: '#f8f9fa',
    backgroundActive: '#007bff',
    backgroundDisabled: '#f8f9fa',
    text: '#212529',
    textDisabled: '#6c757d',
    border: '#ccc',
  },
  input: {
    background: '#ffffff',
    border: '#ccc',
    borderFocus: '#007bff',
    text: '#212529',
    placeholder: '#6c757d',
  },
  status: {
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#007bff',
  },
  canvas: {
    background: '#1A252F',
    shape: '#007bff',
    screw: '#dc3545',
    indicator: '#6c757d',
  },
};

export const darkTheme: EditorTheme = {
  background: {
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    tertiary: '#383838',
  },
  text: {
    primary: '#ffffff',
    secondary: '#e0e0e0',
    muted: '#a0a0a0',
  },
  border: {
    primary: '#404040',
    secondary: '#555555',
  },
  button: {
    background: '#2d2d2d',
    backgroundHover: '#383838',
    backgroundActive: '#0d6efd',
    backgroundDisabled: '#383838',
    text: '#ffffff',
    textDisabled: '#a0a0a0',
    border: '#555555',
  },
  input: {
    background: '#2d2d2d',
    border: '#555555',
    borderFocus: '#0d6efd',
    text: '#ffffff',
    placeholder: '#a0a0a0',
  },
  status: {
    success: '#198754',
    warning: '#fd7e14',
    error: '#dc3545',
    info: '#0d6efd',
  },
  canvas: {
    background: '#1A252F',
    shape: '#0d6efd',
    screw: '#dc3545',
    indicator: '#a0a0a0',
  },
};

/**
 * Get theme based on dark mode preference
 */
export const getTheme = (isDarkMode: boolean): EditorTheme => {
  return isDarkMode ? darkTheme : lightTheme;
};