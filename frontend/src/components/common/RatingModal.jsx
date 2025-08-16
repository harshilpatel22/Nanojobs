/**
 * RatingModal Component - Modal for submitting ratings after task completion
 * Features:
 * - Clean star-based rating interface
 * - Task context information
 * - Success/error handling
 * - Responsive design
 */

import React, { useState } from 'react';
import StarRating from './StarRating';
import Button from './Button';
import styles from './RatingModal.module.css';

const RatingModal = ({
  isOpen,
  onClose,
  onSubmitRating,
  taskTitle,
  otherPartyName,
  raterType, // 'WORKER' or 'EMPLOYER'
  isLoading = false
}) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitRating(selectedRating);
      // Modal will be closed by parent component after successful submission
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Error handling will be done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedRating(0);
      onClose();
    }
  };

  const getRatingDescription = (rating) => {
    const descriptions = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return descriptions[rating] || '';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Rate Your Experience
          </h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.taskInfo}>
            <h3 className={styles.taskTitle}>{taskTitle}</h3>
            <p className={styles.ratingPrompt}>
              How would you rate your experience with{' '}
              <span className={styles.partyName}>{otherPartyName}</span>?
            </p>
          </div>

          <div className={styles.ratingSection}>
            <StarRating
              rating={selectedRating}
              interactive={true}
              onRate={handleRatingChange}
              size="large"
              showCount={false}
            />
            
            {selectedRating > 0 && (
              <div className={styles.ratingDescription}>
                {getRatingDescription(selectedRating)}
              </div>
            )}
          </div>

          <div className={styles.ratingGuidelines}>
            <h4>Rating Guidelines:</h4>
            <ul>
              <li><strong>5 Stars:</strong> Excellent work, exceeded expectations</li>
              <li><strong>4 Stars:</strong> Very good work, met expectations well</li>
              <li><strong>3 Stars:</strong> Good work, met basic expectations</li>
              <li><strong>2 Stars:</strong> Fair work, some issues but acceptable</li>
              <li><strong>1 Star:</strong> Poor work, did not meet expectations</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedRating === 0 || isSubmitting}
            loading={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;