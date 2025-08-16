/**
 * StarRating Component - Display and interact with star ratings
 * Features:
 * - Display-only mode for showing ratings
 * - Interactive mode for submitting ratings
 * - Hover effects for better UX
 * - Customizable size and colors
 */

import React, { useState } from 'react';
import styles from './StarRating.module.css';

const StarRating = ({
  rating = 0,
  totalStars = 5,
  size = 'medium',
  interactive = false,
  onRate,
  showCount = true,
  ratingCount = 0,
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starNumber) => {
    if (interactive && onRate) {
      onRate(starNumber);
    }
  };

  const handleStarHover = (starNumber) => {
    if (interactive) {
      setHoveredRating(starNumber);
    }
  };

  const handleStarLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  const getStarClass = (starNumber) => {
    const baseClass = styles.star;
    const sizeClass = styles[size];
    const displayRating = interactive ? (hoveredRating || rating) : rating;
    
    let stateClass = '';
    if (starNumber <= displayRating) {
      stateClass = styles.filled;
    } else if (starNumber - 0.5 <= displayRating) {
      stateClass = styles.halfFilled;
    } else {
      stateClass = styles.empty;
    }

    const interactiveClass = interactive ? styles.interactive : '';
    
    return `${baseClass} ${sizeClass} ${stateClass} ${interactiveClass}`;
  };

  const formatRating = (rating) => {
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  };

  return (
    <div className={`${styles.starRating} ${className}`}>
      <div 
        className={styles.starsContainer}
        onMouseLeave={handleStarLeave}
      >
        {[...Array(totalStars)].map((_, index) => {
          const starNumber = index + 1;
          return (
            <span
              key={starNumber}
              className={getStarClass(starNumber)}
              onClick={() => handleStarClick(starNumber)}
              onMouseEnter={() => handleStarHover(starNumber)}
              role={interactive ? "button" : "presentation"}
              tabIndex={interactive ? 0 : -1}
              aria-label={interactive ? `Rate ${starNumber} star${starNumber > 1 ? 's' : ''}` : undefined}
            >
              ★
            </span>
          );
        })}
      </div>
      
      {showCount && !interactive && (
        <div className={styles.ratingInfo}>
          {rating > 0 ? (
            <>
              <span className={styles.ratingValue}>
                {formatRating(rating)}
              </span>
              {ratingCount > 0 && (
                <span className={styles.ratingCount}>
                  ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
                </span>
              )}
            </>
          ) : (
            <span className={styles.noRating}>
              No ratings yet
            </span>
          )}
        </div>
      )}
      
      {interactive && hoveredRating > 0 && (
        <div className={styles.hoverFeedback}>
          Rate {hoveredRating} star{hoveredRating > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default StarRating;