import React from 'react';
import styles from './Card.module.css';

/**
 * Card Component
 * A flexible container component for displaying content with consistent styling
 * 
 * Props:
 * - variant: 'default' | 'elevated' | 'outlined' | 'flat' (default: 'default')
 * - padding: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
 * - hover: boolean (adds hover effects)
 * - clickable: boolean (adds cursor pointer and hover states)
 * - header: React node (optional header content)
 * - footer: React node (optional footer content)
 * - children: React node (main card content)
 * - className: string (additional CSS classes)
 * - onClick: function (click handler)
 */

const Card = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  header,
  footer,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const cardClass = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--padding-${padding}`],
    hover && styles['card--hover'],
    clickable && styles['card--clickable'],
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={cardClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      {...props}
    >
      {header && (
        <div className={styles.header}>
          {header}
        </div>
      )}

      <div className={styles.content}>
        {children}
      </div>

      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * CardHeader Component
 * Pre-styled header for cards with title and optional subtitle
 */
export const CardHeader = ({ 
  title, 
  subtitle, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`${styles.cardHeader} ${className}`}>
      <div className={styles.cardHeaderContent}>
        {title && (
          <h3 className={styles.cardTitle}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className={styles.cardSubtitle}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className={styles.cardHeaderAction}>
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * CardFooter Component
 * Pre-styled footer for cards with actions or additional info
 */
export const CardFooter = ({ 
  children, 
  align = 'right',
  className = '' 
}) => {
  return (
    <div className={`${styles.cardFooter} ${styles[`cardFooter--${align}`]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * CardBody Component
 * Simple wrapper for card content with consistent spacing
 */
export const CardBody = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`${styles.cardBody} ${className}`}>
      {children}
    </div>
  );
};

export default Card;