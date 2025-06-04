'use client';

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDarkMode } from '@/editor/utils/useDarkMode';

export default function EditorLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDarkMode = useDarkMode();
  
  return (
    <div className="editor-layout">
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
        toastStyle={{
          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isDarkMode ? '#e5e7eb' : '#111827',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.375rem',
          border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.5)' : '1px solid rgba(209, 213, 219, 0.5)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
      />
      
      <style jsx global>{`
        .Toastify__toast--success .Toastify__toast-icon {
          color: ${isDarkMode ? '#10b981' : '#059669'};
        }
        
        .Toastify__toast--error .Toastify__toast-icon {
          color: ${isDarkMode ? '#ef4444' : '#dc2626'};
        }
        
        .Toastify__progress-bar {
          background: ${isDarkMode ? '#3b82f6' : '#2563eb'};
        }
        
        .Toastify__close-button {
          color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
          opacity: 0.7;
        }
        
        .Toastify__close-button:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}