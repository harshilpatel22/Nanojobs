import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ArrowRight, Gift, Clock, Shield } from 'lucide-react';

import Button from '../components/common/Button';
import Card, { CardHeader, CardBody } from '../components/common/Card';

import styles from './RegistrationSuccess.module.css';

/**
 * Registration Success Page
 * Shows next steps and badge earning opportunities
 */
const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { workerData, nextSteps } = location.state || {};

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const badgeCategories = [
    {
      id: 'DATA_ENTRY',
      name: 'Data Entry',
      icon: '📊',
      description: 'Excel work, form filling, data organization',
      earning: '₹150-200/hour'
    },
    {
      id: 'CONTENT_CREATION',
      name: 'Content Creation',
      icon: '✍️',
      description: 'Writing, social media, basic design',
      earning: '₹200-300/hour'
    },
    {
      id: 'CUSTOMER_SERVICE',
      name: 'Customer Service',
      icon: '💬',
      description: 'Chat support, email management',
      earning: '₹180-250/hour'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <CheckCircle2 size={64} />
        </div>
        <h1>Welcome to NanoJobs!</h1>
        <p>Your account has been created successfully</p>
      </div>

      {/* Account Summary */}
      {workerData && (
        <Card className={styles.accountCard}>
          <CardHeader>
            <h2>👤 Your Account</h2>
          </CardHeader>
          <CardBody>
            <div className={styles.accountInfo}>
              <div className={styles.infoItem}>
                <strong>Name:</strong> {workerData.user.name}
              </div>
              <div className={styles.infoItem}>
                <strong>Phone:</strong> {workerData.user.phone}
              </div>
              <div className={styles.infoItem}>
                <strong>Location:</strong> {workerData.worker.city}, {workerData.worker.state}
              </div>
              <div className={styles.infoItem}>
                <strong>ID Document:</strong> 
                <span className={styles.idStatus}>
                  <Shield size={16} />
                  {workerData.worker.isIdVerified ? 'Verified' : 'Under Review'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Next Steps */}
      <Card className={styles.stepsCard}>
        <CardHeader>
          <h2>🚀 What's Next?</h2>
          <p>Follow these steps to start earning</p>
        </CardHeader>
        <CardBody>
          <div className={styles.stepsList}>
            {nextSteps && nextSteps.map((step, index) => (
              <div key={index} className={styles.stepItem}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Badge Earning Opportunities */}
      <Card className={styles.badgeCard}>
        <CardHeader>
          <h2>🏆 Earn Your First Badges</h2>
          <p>Complete free tasks to unlock these categories</p>
        </CardHeader>
        <CardBody>
          <div className={styles.badgeGrid}>
            {badgeCategories.map(category => (
              <div key={category.id} className={styles.badgeItem}>
                <div className={styles.badgeIcon}>{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <div className={styles.badgeEarning}>{category.earning}</div>
                <div className={styles.badgeLevel}>
                  <Star size={16} />
                  <span>Bronze Badge Available</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Free Tasks Promotion */}
      <Card className={styles.freeTasksCard}>
        <CardBody>
          <div className={styles.freeTasksContent}>
            <div className={styles.freeTasksIcon}>
              <Gift size={48} />
            </div>
            <div className={styles.freeTasksText}>
              <h2>🎯 Start with Free Tasks</h2>
              <p>New employers post free tasks to test the platform. Complete these to earn your first badges!</p>
              <ul>
                <li>✅ No competition - up to 10 spots per task</li>
                <li>🏆 Earn bronze badges in different categories</li>
                <li>💰 Unlock higher-paying tasks</li>
                <li>⭐ Build your reputation from day one</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statValue}>24 hrs</div>
          <div className={styles.statLabel}>ID Verification</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Gift size={24} />
          </div>
          <div className={styles.statValue}>10</div>
          <div className={styles.statLabel}>Max Applications per Free Task</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Star size={24} />
          </div>
          <div className={styles.statValue}>6</div>
          <div className={styles.statLabel}>Badge Categories</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button
          onClick={handleGoToDashboard}
          size="lg"
          className={styles.primaryButton}
        >
          <Star size={20} />
          Go to Dashboard
          <ArrowRight size={20} />
        </Button>
        
        <Button
          variant="outline"
          onClick={handleLogin}
          size="lg"
        >
          Login to Your Account
        </Button>
      </div>

      {/* Help Section */}
      <Card className={styles.helpCard}>
        <CardBody>
          <h3>💡 Need Help?</h3>
          <p>Check out our getting started guide or contact support for assistance.</p>
          <div className={styles.helpLinks}>
            <a href="/help/getting-started" className={styles.helpLink}>
              Getting Started Guide
            </a>
            <a href="/support" className={styles.helpLink}>
              Contact Support
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default RegistrationSuccess;