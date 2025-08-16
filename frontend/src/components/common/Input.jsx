import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './Input.module.css';

/**
 * Input Component
 * A comprehensive input component with validation, icons, and multiple variants
 * 
 * Props:
 * - type: string (input type - text, email, password, etc.)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - variant: 'default' | 'filled' | 'outline' (default: 'default')
 * - label: string (input label)
 * - placeholder: string
 * - value: string
 * - onChange: function
 * - onBlur: function
 * - onFocus: function
 * - disabled: boolean
 * - readonly: boolean
 * - required: boolean
 * - error: string (error message)
 * - success: boolean (success state)
 * - hint: string (helper text)
 * - icon: React component (left icon)
 * - rightIcon: React component (right icon)
 * - fullWidth: boolean (takes full width)
 * - maxLength: number
 * - className: string
 */

const Input = forwardRef(({
  type = 'text',
  size = 'md',
  variant = 'default',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  readonly = false,
  required = false,
  error,
  success = false,
  hint,
  icon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  maxLength,
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  const containerClass = [
    styles.container,
    fullWidth && styles['container--full-width'],
    className
  ].filter(Boolean).join(' ');

  const inputClass = [
    styles.input,
    styles[`input--${size}`],
    styles[`input--${variant}`],
    hasError && styles['input--error'],
    hasSuccess && styles['input--success'],
    disabled && styles['input--disabled'],
    readonly && styles['input--readonly'],
    isFocused && styles['input--focused'],
    LeftIcon && styles['input--with-left-icon'],
    (RightIcon || isPassword) && styles['input--with-right-icon']
  ].filter(Boolean).join(' ');

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={containerClass}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className={styles.inputWrapper}>
        {/* Left icon */}
        {LeftIcon && (
          <div className={styles.leftIcon}>
            <LeftIcon size={16} />
          </div>
        )}

        {/* Input element */}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={
            [
              error && `${inputId}-error`,
              hint && `${inputId}-hint`,
              hasSuccess && `${inputId}-success`
            ].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />

        {/* Right icon or password toggle */}
        {(RightIcon || isPassword) && (
          <div className={styles.rightIcon}>
            {isPassword ? (
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : RightIcon ? (
              <RightIcon size={16} />
            ) : null}
          </div>
        )}

        {/* Status icons */}
        {hasError && (
          <div className={styles.statusIcon}>
            <AlertCircle size={16} />
          </div>
        )}

        {hasSuccess && (
          <div className={styles.statusIcon}>
            <CheckCircle size={16} />
          </div>
        )}
      </div>

      {/* Character count */}
      {maxLength && value && (
        <div className={styles.characterCount}>
          {value.length}/{maxLength}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div id={`${inputId}-error`} className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Success message */}
      {hasSuccess && (
        <div id={`${inputId}-success`} className={styles.successMessage}>
          Input is valid
        </div>
      )}

      {/* Hint text */}
      {hint && !error && (
        <div id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;