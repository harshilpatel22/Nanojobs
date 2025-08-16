import React from 'react';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  Briefcase,
  ArrowRight,
  Calendar,
  Shield,
  Lock,
  CreditCard
} from 'lucide-react';

import Button from '../common/Button';
import styles from './TaskCard.module.css';

/**
 * Enhanced TaskCard Component with Payment Integration
 * Now shows payment status, escrow information, and trust indicators
 * 
 * New Props:
 * - paymentStatus: Payment status object with escrow info
 * - showPaymentInfo: Boolean to show payment details
 * - trustLevel: Trust level indicator for the task
 */

const TaskCard = ({ 
  task, 
  showApplication = true,
  onApply,
  onViewDetails,
  className = '',
  compact = false,
  highlightMatch = false,
  paymentStatus = null,
  showPaymentInfo = false,
  trustLevel = 'standard'
}) => {
  
  /**
   * Get badge styling based on level
   */
  const getBadgeStyle = (badge) => {
    const badgeStyles = {
      BRONZE: { color: '#CD7F32', bg: '#FFF8E1', text: 'Bronze' },
      SILVER: { color: '#C0C0C0', bg: '#F5F5F5', text: 'Silver' },
      GOLD: { color: '#FFD700', bg: '#FFFDE7', text: 'Gold' },
      PLATINUM: { color: '#E5E4E2', bg: '#FAFAFA', text: 'Platinum' }
    };

    return badgeStyles[badge] || badgeStyles.BRONZE;
  };

  /**
   * Get urgency styling
   */
  const getUrgencyStyle = (urgency) => {
    const urgencyStyles = {
      low: { color: 'var(--info)', bg: 'var(--info-background)', text: 'Low Priority' },
      normal: { color: 'var(--text-secondary)', bg: 'var(--background-light)', text: 'Normal' },
      high: { color: 'var(--warning)', bg: 'var(--warning-background)', text: 'Urgent' }
    };

    return urgencyStyles[urgency] || urgencyStyles.normal;
  };

  /**
   * Get payment status styling
   */
  const getPaymentStatusStyle = (status) => {
    const statusStyles = {
      PENDING: { color: 'var(--warning)', bg: 'rgba(255, 184, 0, 0.15)', text: 'Payment Pending' },
      ESCROWED: { color: 'var(--primary)', bg: 'rgba(0, 102, 255, 0.15)', text: 'Payment Secured' },
      COMPLETED: { color: 'var(--success)', bg: 'rgba(0, 200, 150, 0.15)', text: 'Payment Released' },
      FAILED: { color: 'var(--error)', bg: 'rgba(229, 62, 62, 0.15)', text: 'Payment Failed' }
    };

    return statusStyles[status] || statusStyles.PENDING;
  };

  /**
   * Get trust level indicator
   */
  const getTrustIndicator = (level) => {
    const trustLevels = {
      basic: { icon: Shield, color: 'var(--text-muted)', text: 'Basic Protection' },
      standard: { icon: Lock, color: 'var(--primary)', text: 'Payment Protected' },
      premium: { icon: CreditCard, color: 'var(--success)', text: 'Premium Security' }
    };

    return trustLevels[level] || trustLevels.standard;
  };

  /**
   * Format category for display
   */
  const formatCategory = (category) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Calculate time remaining until deadline
   */
  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  /**
   * Handle apply button click
   */
  const handleApply = (e) => {
    e.stopPropagation();
    if (onApply) {
      onApply(task);
    }
  };

  /**
   * Handle view details click
   */
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(task);
    }
  };

  const badgeStyle = getBadgeStyle(task.requiredBadge);
  const urgencyStyle = getUrgencyStyle(task.urgency);
  const paymentStyle = paymentStatus ? getPaymentStatusStyle(paymentStatus.status) : null;
  const trustIndicator = getTrustIndicator(trustLevel);
  const timeRemaining = getTimeRemaining(task.deadline);
  const isUrgent = task.urgency === 'high';
  const hasApplicationed = task.applications?.workerHasApplied;
  const canApply = task.applications?.canApply && !hasApplicationed;
  const hasSecurePayment = paymentStatus && paymentStatus.status === 'ESCROWED';

  const cardClasses = [
    styles.card,
    compact && styles.compact,
    highlightMatch && styles.highlighted,
    isUrgent && styles.urgent,
    hasApplicationed && styles.applied,
    hasSecurePayment && styles.paymentSecured,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={handleViewDetails}>
      {/* Header with enhanced badges */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h3 className={styles.title}>{task.title}</h3>
          <div className={styles.badges}>
            <span 
              className={styles.badge}
              style={{ 
                color: badgeStyle.color, 
                backgroundColor: badgeStyle.bg 
              }}
            >
              <Award size={14} />
              {badgeStyle.text}
            </span>
            {task.urgency !== 'normal' && (
              <span 
                className={styles.urgencyBadge}
                style={{ 
                  color: urgencyStyle.color, 
                  backgroundColor: urgencyStyle.bg 
                }}
              >
                {urgencyStyle.text}
              </span>
            )}
            {paymentStatus && showPaymentInfo && (
              <span 
                className={styles.paymentBadge}
                style={{ 
                  color: paymentStyle.color, 
                  backgroundColor: paymentStyle.bg 
                }}
              >
                {paymentStatus.status === 'ESCROWED' && <Lock size={12} />}
                {paymentStatus.status === 'COMPLETED' && <CheckCircle size={12} />}
                {paymentStatus.status === 'FAILED' && <AlertTriangle size={12} />}
                {paymentStyle.text}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {task.employer?.isVerified && (
            <div className={styles.verifiedBadge}>
              <CheckCircle size={16} />
              <span>Verified</span>
            </div>
          )}
          
          {/* Trust/Security Indicator */}
          {trustLevel !== 'basic' && (
            <div className={styles.trustBadge} style={{ color: trustIndicator.color }}>
              <trustIndicator.icon size={16} />
              <span>{trustIndicator.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!compact && (
          <p className={styles.description}>
            {task.description.length > 150 
              ? `${task.description.substring(0, 150)}...` 
              : task.description
            }
          </p>
        )}

        {/* Task Meta */}
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Briefcase size={16} />
            <span>{formatCategory(task.category)}</span>
          </div>
          
          <div className={styles.metaItem}>
            <Clock size={16} />
            <span>{task.estimatedHours}h</span>
          </div>
          
          <div className={styles.metaItem}>
            <MapPin size={16} />
            <span>{task.location}</span>
          </div>
          
          {task.deadline && (
            <div className={`${styles.metaItem} ${timeRemaining === 'Due today' || timeRemaining === 'Expired' ? styles.urgent : ''}`}>
              <Calendar size={16} />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {task.requiredSkills && task.requiredSkills.length > 0 && (
          <div className={styles.skills}>
            {task.requiredSkills.slice(0, compact ? 3 : 5).map((skill, index) => (
              <span key={index} className={styles.skillTag}>
                {skill}
              </span>
            ))}
            {task.requiredSkills.length > (compact ? 3 : 5) && (
              <span className={styles.skillMore}>
                +{task.requiredSkills.length - (compact ? 3 : 5)} more
              </span>
            )}
          </div>
        )}

        {/* Payment Information */}
        {paymentStatus && showPaymentInfo && (
          <div className={styles.paymentInfo}>
            <div className={styles.paymentHeader}>
              <Shield size={16} />
              <span>Payment Details</span>
            </div>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentRow}>
                <span>Amount:</span>
                <span>₹{paymentStatus.amount?.toLocaleString()}</span>
              </div>
              <div className={styles.paymentRow}>
                <span>Status:</span>
                <span style={{ color: paymentStyle.color }}>
                  {paymentStyle.text}
                </span>
              </div>
              {paymentStatus.transactionId && (
                <div className={styles.paymentRow}>
                  <span>Transaction:</span>
                  <code>{paymentStatus.transactionId}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compatibility (if available) */}
        {task.compatibility && (
          <div className={styles.compatibility}>
            <div className={styles.compatibilityScore}>
              <div className={styles.compatibilityBar}>
                <div 
                  className={styles.compatibilityFill}
                  style={{ width: `${task.compatibility.score}%` }}
                />
              </div>
              <span className={styles.compatibilityText}>
                {task.compatibility.score}% match
              </span>
            </div>
            {task.compatibility.badgeMatch === 'perfect' && (
              <div className={styles.perfectMatch}>
                <CheckCircle size={14} />
                <span>Perfect skill match</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with enhanced pricing display */}
      <div className={styles.footer}>
        <div className={styles.pricing}>
          <div className={styles.rate}>
            <DollarSign size={16} />
            <span className={styles.rateValue}>₹{task.hourlyRate.toLocaleString()}/hr</span>
          </div>
          <div className={styles.budget}>
            <span className={styles.budgetLabel}>Total:</span>
            <span className={styles.budgetValue}>₹{task.totalBudget.toLocaleString()}</span>
          </div>
          {hasSecurePayment && (
            <div className={styles.securedBadge}>
              <Lock size={12} />
              <span>Secured</span>
            </div>
          )}
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Users size={14} />
            <span>{task.applicationCount || 0} applied</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.postedTime}>
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions with enhanced payment trust indicators */}
      {showApplication && (
        <div className={styles.actions}>
          {hasApplicationed ? (
            <div className={styles.appliedStatus}>
              <CheckCircle size={16} />
              <span>Applied</span>
              <span className={styles.applicationStatus}>
                ({task.applications.workerApplication?.status || 'Pending'})
              </span>
            </div>
          ) : canApply ? (
            <div className={styles.applySection}>
              <Button 
                onClick={handleApply}
                fullWidth
                size={compact ? 'sm' : 'md'}
                className={hasSecurePayment ? styles.secureApplyButton : ''}
              >
                {hasSecurePayment ? 'Apply Now (Payment Secured)' : 'Apply Now'}
              </Button>
              {hasSecurePayment && (
                <div className={styles.paymentTrust}>
                  <Shield size={12} />
                  <span>Payment guaranteed in escrow</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.cannotApply}>
              <AlertTriangle size={16} />
              <span>
                {task.applicationCount >= task.maxApplications 
                  ? 'Applications full' 
                  : 'Not qualified'
                }
              </span>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            onClick={handleViewDetails}
            icon={ArrowRight}
            iconPosition="right"
            size={compact ? 'sm' : 'md'}
          >
            View Details
          </Button>
        </div>
      )}

      {/* Employer info with enhanced trust indicators */}
      <div className={styles.employer}>
        <span className={styles.employerName}>
          by {task.employer?.name || 'Anonymous'}
        </span>
        <div className={styles.employerBadges}>
          {task.employer?.isVerified && (
            <CheckCircle size={12} className={styles.employerVerified} />
          )}
          {hasSecurePayment && (
            <div className={styles.employerTrust}>
              <Lock size={12} />
              <span>Payment Secured</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;