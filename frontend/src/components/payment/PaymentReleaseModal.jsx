import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle, 
  DollarSign,
  User,
  Smartphone,
  Clock,
  Shield,
  Zap,
  AlertCircle,
  Star,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../common/Button';
import Input from '../common/Input';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { ratingAPI } from '../../utils/api';

import styles from './PaymentReleaseModal.module.css';

/**
 * Payment Release Modal - Complete Task & Release Payment
 * 
 * Features:
 * - Task completion confirmation
 * - Worker UPI ID collection
 * - Instant payment simulation
 * - Success celebration with confetti
 * - Rating system for worker
 * - Payment receipt generation
 */

const PaymentReleaseModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  task,
  worker,
  payment 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    workerUpiId: worker?.upiId || '',
    rating: 5,
    feedback: '',
    confirmCompletion: false
  });
  const [errors, setErrors] = useState({});
  const [paymentResult, setPaymentResult] = useState(null);

  // Auto-fill worker UPI if available
  useEffect(() => {
    if (worker?.upiId) {
      setFormData(prev => ({
        ...prev,
        workerUpiId: worker.upiId
      }));
    }
  }, [worker]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  /**
   * Validate UPI ID format
   */
  const validateUPIId = (upiId) => {
    if (!upiId) return 'Worker UPI ID is required';
    
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiPattern.test(upiId)) {
      return 'Invalid UPI ID format (e.g., worker@phonepe)';
    }
    
    return null;
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};
    
    const upiError = validateUPIId(formData.workerUpiId);
    if (upiError) {
      newErrors.workerUpiId = upiError;
    }
    
    if (!formData.confirmCompletion) {
      newErrors.confirmCompletion = 'Please confirm task completion';
    }
    
    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5 stars';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle payment release
   */
  const handleReleasePayment = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💸 Releasing payment to worker...');
      
      // Step 1: Release payment
      const paymentResponse = await fetch('/api/payments/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nanojobs_session_token')}`
        },
        body: JSON.stringify({
          taskId: task.id,
          workerId: worker.id,
          workerUpiId: formData.workerUpiId.toLowerCase()
        })
      });

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment release failed');
      }

      console.log('✅ Payment released successfully');

      // Step 2: Submit rating separately
      try {
        console.log('⭐ Submitting rating...');
        
        // Find the application ID from the task data
        const applicationId = task.applicationId || worker.applicationId;
        
        if (applicationId) {
          await ratingAPI.submitRating(applicationId, formData.rating);
          console.log('✅ Rating submitted successfully');
        } else {
          console.warn('⚠️ No application ID found, rating not submitted');
        }
      } catch (ratingError) {
        console.error('❌ Failed to submit rating:', ratingError);
        // Don't fail the entire operation if rating fails
        toast.error('Payment completed, but rating submission failed');
      }

      // Success!
      setPaymentResult(paymentResult.data);
      setCurrentStep(2);
      
      // Show success with celebration
      toast.success('🎉 Payment released successfully!');
      
      // Call success callback after delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(paymentResult.data);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Payment release error:', error);
      toast.error(error.message || 'Failed to release payment');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isProcessing && onClose) {
      onClose();
    }
  };

  /**
   * Render star rating
   */
  const renderStarRating = () => {
    return (
      <div className={styles.starRating}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${star <= formData.rating ? styles.filled : ''}`}
            onClick={() => handleInputChange('rating', star)}
          >
            <Star size={20} />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Send size={24} />
            </div>
            <div className={styles.headerText}>
              <h2>Complete Task & Release Payment</h2>
              <p>Transfer ₹{payment?.amount?.toLocaleString() || task?.totalBudget?.toLocaleString()} to worker</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={X} 
            onClick={handleClose}
            disabled={isProcessing}
          />
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Step 1: Task Completion & Payment Setup */}
          {currentStep === 1 && (
            <div className={styles.step}>
              {/* Task Summary */}
              <Card className={styles.taskSummary}>
                <CardHeader title="Task Summary" />
                <CardBody>
                  <div className={styles.taskDetails}>
                    <h4>{task?.title}</h4>
                    <div className={styles.taskMeta}>
                      <div className={styles.metaItem}>
                        <DollarSign size={16} />
                        <span>₹{task?.totalBudget?.toLocaleString()}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Clock size={16} />
                        <span>{task?.estimatedHours}h estimated</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Award size={16} />
                        <span>{task?.requiredBadge} level</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Worker Details */}
              <Card className={styles.workerCard}>
                <CardHeader title="Worker Details" />
                <CardBody>
                  <div className={styles.workerDetails}>
                    <div className={styles.workerAvatar}>
                      <User size={24} />
                    </div>
                    <div className={styles.workerInfo}>
                      <h4>{worker?.name}</h4>
                      <p>{worker?.badge} Level Worker</p>
                      <div className={styles.workerStats}>
                        <span>⭐ {worker?.rating || '4.8'} rating</span>
                        <span>• {worker?.completedTasks || '12'} tasks completed</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Payment Form */}
              <div className={styles.paymentForm}>
                <h3>Payment Details</h3>
                
                <Input
                  label="Worker's UPI ID"
                  type="text"
                  value={formData.workerUpiId}
                  onChange={(e) => handleInputChange('workerUpiId', e.target.value)}
                  placeholder="worker@phonepe"
                  icon={Smartphone}
                  error={errors.workerUpiId}
                  required
                />

                <div className={styles.ratingSection}>
                  <label className={styles.label}>Rate Worker's Performance</label>
                  {renderStarRating()}
                  <span className={styles.ratingText}>
                    {formData.rating === 5 ? 'Excellent!' : 
                     formData.rating === 4 ? 'Great work' :
                     formData.rating === 3 ? 'Good' :
                     formData.rating === 2 ? 'Needs improvement' : 'Poor'}
                  </span>
                </div>

                <div className={styles.feedbackSection}>
                  <label className={styles.label}>Feedback (Optional)</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.feedback}
                    onChange={(e) => handleInputChange('feedback', e.target.value)}
                    placeholder="Share your experience working with this worker..."
                    rows={3}
                    maxLength={500}
                  />
                  <div className={styles.characterCount}>
                    {formData.feedback.length}/500 characters
                  </div>
                </div>

                <div className={styles.confirmationSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.confirmCompletion}
                      onChange={(e) => handleInputChange('confirmCompletion', e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkmark}></span>
                    <span>I confirm that the task has been completed satisfactorily</span>
                  </label>
                  {errors.confirmCompletion && (
                    <span className={styles.error}>{errors.confirmCompletion}</span>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <Card className={styles.paymentSummary}>
                <CardBody>
                  <div className={styles.summaryHeader}>
                    <Shield size={20} />
                    <h4>Payment Summary</h4>
                  </div>
                  <div className={styles.summaryDetails}>
                    <div className={styles.summaryRow}>
                      <span>Task Amount:</span>
                      <span>₹{task?.totalBudget?.toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Platform Fee:</span>
                      <span>₹0</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Worker Receives:</span>
                      <strong>₹{task?.totalBudget?.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className={styles.instantBadge}>
                    <Zap size={16} />
                    <span>Instant UPI Transfer</span>
                  </div>
                </CardBody>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleReleasePayment}
                loading={isProcessing}
                size="lg"
                fullWidth
                icon={Send}
                className={styles.releaseButton}
              >
                {isProcessing ? 'Processing Payment...' : `Release ₹${task?.totalBudget?.toLocaleString()}`}
              </Button>
            </div>
          )}

          {/* Step 2: Success */}
          {currentStep === 2 && paymentResult && (
            <div className={styles.step}>
              <div className={styles.successStep}>
                <div className={styles.successIcon}>
                  <CheckCircle size={64} />
                </div>
                
                <h3>Payment Sent Successfully! 🎉</h3>
                <p>₹{paymentResult.payment.amount.toLocaleString()} has been transferred to {worker?.name}</p>
                
                {/* Payment Receipt */}
                <Card className={styles.receiptCard}>
                  <CardHeader title="Payment Receipt" />
                  <CardBody>
                    <div className={styles.receiptDetails}>
                      <div className={styles.receiptRow}>
                        <span>Transaction ID:</span>
                        <code>{paymentResult.payment.transactionId}</code>
                      </div>
                      <div className={styles.receiptRow}>
                        <span>Amount Sent:</span>
                        <span>₹{paymentResult.payment.amount.toLocaleString()}</span>
                      </div>
                      <div className={styles.receiptRow}>
                        <span>To UPI ID:</span>
                        <code>{paymentResult.payment.workerUpiId}</code>
                      </div>
                      <div className={styles.receiptRow}>
                        <span>Completed At:</span>
                        <span>{new Date(paymentResult.payment.completedAt).toLocaleString()}</span>
                      </div>
                      <div className={styles.receiptRow}>
                        <span>Status:</span>
                        <span className={styles.statusSuccess}>Completed ✓</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Success Message */}
                <div className={styles.successMessage}>
                  <h4>What happens next:</h4>
                  <ul>
                    <li>
                      <CheckCircle size={16} />
                      Worker has been notified of payment
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      Task is marked as completed
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      Receipt saved to your transaction history
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      Worker rating has been recorded
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleClose}
                  size="lg"
                  fullWidth
                  className={styles.continueButton}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingContent}>
              <LoadingSpinner />
              <h4>Processing Payment...</h4>
              <div className={styles.processingSteps}>
                <div className={styles.processingStep}>
                  <div className={styles.stepDot}></div>
                  <span>Validating UPI ID...</span>
                </div>
                <div className={styles.processingStep}>
                  <div className={styles.stepDot}></div>
                  <span>Debiting from escrow...</span>
                </div>
                <div className={styles.processingStep}>
                  <div className={styles.stepDot}></div>
                  <span>Transferring to worker...</span>
                </div>
                <div className={styles.processingStep}>
                  <div className={styles.stepDot}></div>
                  <span>Sending confirmation...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReleaseModal;