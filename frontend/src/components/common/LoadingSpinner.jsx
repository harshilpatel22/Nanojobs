import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * LoadingSpinner Component
 * A reusable loading spinner with customizable size and message
 * 
 * Props:
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - message: string (optional loading message)
 * - fullscreen: boolean (whether to show as fullscreen overlay)
 */

const LoadingSpinner = ({ 
  size = 'md', 
  message, 
  fullscreen = false 
}) => {
  const spinnerClass = `${styles.spinner} ${styles[`spinner--${size}`]}`;
  
  const content = (
    <div className={styles.container}>
      <div className={spinnerClass}>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
      </div>
      
      {message && (
        <p className={styles.message}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;