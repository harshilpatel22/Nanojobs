import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from './common/Button';
import Card, { CardHeader, CardBody } from './common/Card';
import { digilockerAPI } from '../utils/api';

import styles from './DigiLockerVerification.module.css';

/**
 * DigiLocker Verification Component
 * Handles Aadhaar verification through DigiLocker API
 */
const DigiLockerVerification = ({ 
  tempUserId, 
  onVerificationComplete, 
  onSkip,
  aadhaarNumber,
  setAadhaarNumber 
}) => {
  const [verificationState, setVerificationState] = useState('input'); // 'input' | 'verifying' | 'completed' | 'failed'
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);

  // Check if already verified
  useEffect(() => {
    if (tempUserId) {
      checkVerificationStatus();
    }
  }, [tempUserId]);

  const checkVerificationStatus = async () => {
    try {
      const result = await digilockerAPI.checkVerificationStatus(tempUserId);
      
      if (result.success && result.data.isVerified) {
        setVerificationState('completed');
        setVerificationData(result.data);
        onVerificationComplete(result.data);
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  const handleStartVerification = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Starting DigiLocker verification...');
      
      const result = await digilockerAPI.initiateVerification(tempUserId, 'worker');
      
      if (result.success) {
        setAuthUrl(result.data.authUrl);
        setVerificationState('verifying');
        
        // Open DigiLocker in new window
        const popup = window.open(
          result.data.authUrl, 
          'digilocker-verification',
          'width=600,height=800,scrollbars=yes,resizable=yes'
        );

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResult = await digilockerAPI.checkVerificationStatus(tempUserId);
            
            if (statusResult.success && statusResult.data.isVerified) {
              clearInterval(pollInterval);
              popup.close();
              setVerificationState('completed');
              setVerificationData(statusResult.data);
              onVerificationComplete(statusResult.data);
              toast.success('✅ Aadhaar verified successfully through DigiLocker!');
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 3000);

        // Clean up polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (popup && !popup.closed) {
            popup.close();
          }
        }, 5 * 60 * 1000);

      } else {
        toast.error(result.message || 'Failed to initiate DigiLocker verification');
        setVerificationState('failed');
      }
    } catch (error) {
      console.error('DigiLocker verification error:', error);
      toast.error('Failed to start verification process');
      setVerificationState('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockVerification = async () => {
    if (process.env.NODE_ENV === 'production') {
      toast.error('Mock verification only available in development');
      return;
    }

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await digilockerAPI.mockVerification(tempUserId, aadhaarNumber);
      
      if (result.success) {
        setVerificationState('completed');
        setVerificationData(result.data);
        onVerificationComplete(result.data);
        toast.success('✅ Mock Aadhaar verification completed!');
      } else {
        toast.error(result.message || 'Mock verification failed');
      }
    } catch (error) {
      console.error('Mock verification error:', error);
      toast.error('Mock verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationState === 'completed' && verificationData) {
    return (
      <Card className={styles.verificationCard}>
        <CardHeader>
          <div className={styles.successHeader}>
            <CheckCircle2 size={24} className={styles.successIcon} />
            <h3>Aadhaar Verified Successfully</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className={styles.verificationDetails}>
            <div className={styles.detailItem}>
              <strong>Aadhaar Number:</strong>
              <span>{verificationData.aadhaarNumber}</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Verified Name:</strong>
              <span>{verificationData.verifiedName}</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Verification Method:</strong>
              <span className={styles.method}>
                {verificationData.verificationMethod === 'mock_digilocker' ? 'Mock DigiLocker' : 'DigiLocker'}
                {verificationData.mockData && <span className={styles.mockBadge}>DEMO</span>}
              </span>
            </div>
            <div className={styles.detailItem}>
              <strong>Verified At:</strong>
              <span>{new Date(verificationData.verifiedAt).toLocaleString()}</span>
            </div>
          </div>
          
          <div className={styles.verificationBadge}>
            <Shield size={16} />
            <span>Verified by DigiLocker</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.verificationCard}>
      <CardHeader>
        <div className={styles.header}>
          <Shield size={24} />
          <div>
            <h3>Aadhaar Verification</h3>
            <p>Verify your identity securely through DigiLocker</p>
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        {verificationState === 'input' && (
          <div className={styles.inputState}>
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>
                <Shield size={20} />
              </div>
              <div className={styles.infoText}>
                <h4>Why DigiLocker?</h4>
                <ul>
                  <li>✅ Instant verification</li>
                  <li>✅ Government-backed security</li>
                  <li>✅ No document upload needed</li>
                  <li>✅ Prevents duplicate accounts</li>
                </ul>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Aadhaar Number</label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter your 12-digit Aadhaar number"
                maxLength="12"
                className={styles.aadhaarInput}
              />
              <small className={styles.inputNote}>
                Your Aadhaar number is securely verified through DigiLocker and not stored on our servers
              </small>
            </div>

            <div className={styles.actionButtons}>
              <Button
                onClick={handleStartVerification}
                disabled={!aadhaarNumber || aadhaarNumber.length !== 12 || isLoading}
                loading={isLoading}
                className={styles.verifyButton}
              >
                <ExternalLink size={16} />
                Verify with DigiLocker
              </Button>
              
              {process.env.NODE_ENV !== 'production' && (
                <Button
                  variant="outline"
                  onClick={handleMockVerification}
                  disabled={!aadhaarNumber || aadhaarNumber.length !== 12 || isLoading}
                  className={styles.mockButton}
                >
                  Mock Verify (Dev Only)
                </Button>
              )}
            </div>

            {onSkip && (
              <div className={styles.skipOption}>
                <p>Want to verify later?</p>
                <Button variant="ghost" onClick={onSkip} size="sm">
                  Skip for now
                </Button>
              </div>
            )}
          </div>
        )}

        {verificationState === 'verifying' && (
          <div className={styles.verifyingState}>
            <div className={styles.loadingIcon}>
              <Loader2 size={32} className={styles.spinner} />
            </div>
            <h4>Verification in Progress</h4>
            <p>Please complete the verification in the DigiLocker window</p>
            <div className={styles.instructions}>
              <ol>
                <li>Login to your DigiLocker account</li>
                <li>Grant permission to share your Aadhaar details</li>
                <li>Return to this page to continue registration</li>
              </ol>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setVerificationState('input');
                setIsLoading(false);
              }}
              size="sm"
            >
              Cancel Verification
            </Button>
          </div>
        )}

        {verificationState === 'failed' && (
          <div className={styles.failedState}>
            <div className={styles.errorIcon}>
              <AlertCircle size={32} />
            </div>
            <h4>Verification Failed</h4>
            <p>Unable to verify your Aadhaar through DigiLocker</p>
            
            <div className={styles.retryActions}>
              <Button
                onClick={() => setVerificationState('input')}
                className={styles.retryButton}
              >
                Try Again
              </Button>
              
              {onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DigiLockerVerification;