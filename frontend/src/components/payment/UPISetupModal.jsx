import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Building,
  Zap,
  ArrowRight,
  Lock,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../common/Button';
import Input from '../common/Input';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

import styles from './UPISetupModal.module.css';

/**
 * UPI Setup Modal - Realistic Indian UPI Integration
 * 
 * Features:
 * - Real Indian bank selection
 * - UPI ID validation with common patterns
 * - Stunning glassmorphism design
 * - Step-by-step setup process
 * - Success celebrations with confetti effect
 * - Mobile-optimized for Indian users
 */

const API_BASE = 'http://localhost:5001/api';

const UPISetupModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  employerId,
  taskAmount 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    bankName: '',
    upiId: '',
    maxAmount: taskAmount || 50000
  });
  const [errors, setErrors] = useState({});
  const [mandate, setMandate] = useState(null);

  // Load Indian banks on mount
  useEffect(() => {
    if (isOpen) {
      loadIndianBanks();
    }
  }, [isOpen]);

  /**
   * Load Indian banks from API
   */

  const loadIndianBanks = async () => {
    try {


      const response = await fetch(`${API_BASE}/payments/banks`);
      const result = await response.json();
      
      if (result.success) {
        setBanks(result.data.banks);
      } else {
        // Fallback banks if API fails
        setBanks([
          { code: 'SBI', name: 'State Bank of India', upiHandle: 'sbi' },
          { code: 'HDFC', name: 'HDFC Bank', upiHandle: 'hdfc' },
          { code: 'ICICI', name: 'ICICI Bank', upiHandle: 'icici' },
          { code: 'AXIS', name: 'Axis Bank', upiHandle: 'axis' },
          { code: 'KOTAK', name: 'Kotak Mahindra Bank', upiHandle: 'kotak' },
          { code: 'PAYTM', name: 'Paytm Payments Bank', upiHandle: 'paytm' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
      setBanks([
        { code: 'SBI', name: 'State Bank of India', upiHandle: 'sbi' },
        { code: 'HDFC', name: 'HDFC Bank', upiHandle: 'hdfc' },
        { code: 'ICICI', name: 'ICICI Bank', upiHandle: 'icici' }
      ]);
    }
  };

  /**
   * Handle bank selection
   */
  const handleBankSelect = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      upiId: `employer@${bank.upiHandle}` // Pre-fill with bank handle
    }));
    setCurrentStep(2);
  };

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
    if (!upiId) return 'UPI ID is required';
    
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiPattern.test(upiId)) {
      return 'Invalid UPI ID format (e.g., employer@paytm)';
    }
    
    const validProviders = ['paytm', 'phonepe', 'googlepay', 'amazonpay', 'bhim', 'sbi', 'hdfc', 'icici', 'axis', 'kotak'];
    const provider = upiId.split('@')[1].toLowerCase();
    
    if (!validProviders.some(valid => provider.includes(valid))) {
      return 'Please use a valid UPI provider (Paytm, PhonePe, GooglePay, etc.)';
    }
    
    return null;
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.bankName) {
      newErrors.bankName = 'Please select a bank';
    }
    
    const upiError = validateUPIId(formData.upiId);
    if (upiError) {
      newErrors.upiId = upiError;
    }
    
    if (!formData.maxAmount || formData.maxAmount < 1000) {
      newErrors.maxAmount = 'Minimum amount is ₹1,000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle UPI mandate setup
   */
  const handleSetupMandate = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Setting up UPI mandate...');
      
      const response = await fetch(`${API_BASE}/payments/setup-mandate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nanojobs_session_token')}`
        },
        body: JSON.stringify({
          employerId,
          upiId: formData.upiId.toLowerCase(),
          bankName: formData.bankName,
          maxAmount: parseFloat(formData.maxAmount)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMandate(result.data.mandate);
        setCurrentStep(3);
        
        // Show success with celebration
        toast.success('🎉 UPI mandate setup successful!');
        
        // Call success callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result.data.mandate);
          }
        }, 2000);
        
      } else {
        throw new Error(result.message || 'Setup failed');
      }

    } catch (error) {
      console.error('❌ UPI setup error:', error);
      toast.error(error.message || 'Failed to setup UPI mandate');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  /**
   * Get step indicator
   */
  const getStepIndicator = () => {
    return (
      <div className={styles.stepIndicator}>
        {[1, 2, 3].map(step => (
          <div key={step} className={styles.stepIndicatorContainer}>
            <div 
              className={`${styles.stepCircle} ${
                step === currentStep ? styles.active : 
                step < currentStep ? styles.completed : styles.inactive
              }`}
            >
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
            {step < 3 && (
              <div 
                className={`${styles.stepLine} ${
                  step < currentStep ? styles.completed : styles.inactive
                }`} 
              />
            )}
          </div>
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
              <Shield size={24} />
            </div>
            <div className={styles.headerText}>
              <h2>Setup UPI Payment Protection</h2>
              <p>Secure your task payment with UPI escrow</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={X} 
            onClick={handleClose}
            disabled={isLoading}
          />
        </div>

        {/* Step Indicator */}
        {getStepIndicator()}

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Step 1: Bank Selection */}
          {currentStep === 1 && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <Building size={20} />
                <h3>Select Your Bank</h3>
                <p>Choose the bank linked to your UPI ID</p>
              </div>
              
              <div className={styles.bankGrid}>
                {banks.map(bank => (
                  <div 
                    key={bank.code}
                    className={styles.bankCard}
                    onClick={() => handleBankSelect(bank)}
                  >
                    <div className={styles.bankIcon}>
                      <Building size={24} />
                    </div>
                    <div className={styles.bankInfo}>
                      <h4>{bank.name}</h4>
                      <p>@{bank.upiHandle}</p>
                    </div>
                    <ArrowRight size={16} className={styles.bankArrow} />
                  </div>
                ))}
              </div>
              
              <div className={styles.trustIndicators}>
                <div className={styles.trustItem}>
                  <Shield size={16} />
                  <span>Bank-grade security</span>
                </div>
                <div className={styles.trustItem}>
                  <Lock size={16} />
                  <span>Encrypted transactions</span>
                </div>
                <div className={styles.trustItem}>
                  <TrendingUp size={16} />
                  <span>Instant settlements</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: UPI ID & Settings */}
          {currentStep === 2 && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <Smartphone size={20} />
                <h3>Enter UPI Details</h3>
                <p>Provide your UPI ID and payment limits</p>
              </div>
              
              <div className={styles.formSection}>
                <div className={styles.selectedBank}>
                  <Building size={20} />
                  <div>
                    <h4>{formData.bankName}</h4>
                    <p>Selected Bank</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep(1)}
                  >
                    Change
                  </Button>
                </div>

                <Input
                  label="Your UPI ID"
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  placeholder="employer@paytm"
                  icon={Smartphone}
                  error={errors.upiId}
                  required
                />

                <Input
                  label="Maximum Amount per Transaction"
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                  placeholder="50000"
                  icon={CreditCard}
                  error={errors.maxAmount}
                  required
                  min="1000"
                  max="500000"
                />

                <div className={styles.amountInfo}>
                  <AlertCircle size={16} />
                  <span>You can modify this limit anytime in settings</span>
                </div>
              </div>

              <div className={styles.stepActions}>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSetupMandate}
                  loading={isLoading}
                  icon={Zap}
                >
                  {isLoading ? 'Setting up...' : 'Setup UPI Mandate'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && mandate && (
            <div className={styles.step}>
              <div className={styles.successStep}>
                <div className={styles.successIcon}>
                  <CheckCircle size={48} />
                </div>
                
                <h3>UPI Mandate Setup Complete! 🎉</h3>
                <p>Your payment protection is now active</p>
                
                <Card className={styles.mandateCard}>
                  <CardBody>
                    <div className={styles.mandateDetails}>
                      <div className={styles.mandateRow}>
                        <span>Mandate Reference:</span>
                        <code>{mandate.mandateRef}</code>
                      </div>
                      <div className={styles.mandateRow}>
                        <span>UPI ID:</span>
                        <code>{mandate.upiId}</code>
                      </div>
                      <div className={styles.mandateRow}>
                        <span>Bank:</span>
                        <span>{mandate.bankName}</span>
                      </div>
                      <div className={styles.mandateRow}>
                        <span>Max Amount:</span>
                        <span>₹{mandate.maxAmount.toLocaleString()}</span>
                      </div>
                      <div className={styles.mandateRow}>
                        <span>Status:</span>
                        <span className={styles.statusActive}>Active</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <div className={styles.benefitsList}>
                  <h4>What happens next:</h4>
                  <ul>
                    <li>
                      <CheckCircle size={16} />
                      Your task payment will be locked in secure escrow
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      Workers can apply knowing payment is guaranteed
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      Release payment instantly when task is complete
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleClose}
                  size="lg"
                  fullWidth
                  className={styles.continueButton}
                >
                  Continue to Task Posting
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner message="Setting up your UPI mandate..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default UPISetupModal;