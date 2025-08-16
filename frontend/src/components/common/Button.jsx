import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

/**
 * Button Component
 * A versatile button component with multiple variants, sizes, and states
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' (default: 'primary')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - loading: boolean (shows loading spinner)
 * - disabled: boolean
 * - fullWidth: boolean (takes full width of container)
 * - icon: React component (icon to show before text)
 * - iconPosition: 'left' | 'right' (default: 'left')
 * - onClick: function
 * - type: 'button' | 'submit' | 'reset' (default: 'button')
 * - children: React node (button content)
 * - className: string (additional CSS classes)
 */

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  children,
  className = '',
  ...props
}) => {
  const buttonClass = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth && styles['button--full-width'],
    loading && styles['button--loading'],
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={isDisabled}
      onClick={handleClick}
      aria-disabled={isDisabled}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <span className={styles.spinner}>
          <Loader2 size={16} />
        </span>
      )}

      {/* Left icon */}
      {Icon && iconPosition === 'left' && !loading && (
        <span className={styles.icon}>
          <Icon size={16} />
        </span>
      )}

      {/* Button content */}
      {children && (
        <span className={styles.content}>
          {children}
        </span>
      )}

      {/* Right icon */}
      {Icon && iconPosition === 'right' && !loading && (
        <span className={styles.icon}>
          <Icon size={16} />
        </span>
      )}
    </button>
  );
};

export default Button;