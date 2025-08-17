import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, MapPin, CreditCard, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

import Button from '../components/common/Button';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DigiLockerVerification from '../components/DigiLockerVerification';
import { storageUtils } from '../utils/api';

import styles from './BasicWorkerRegistration.module.css';

/**
 * Basic Worker Registration Form
 * Simplified registration with ID verification
 */
const BasicWorkerRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    aadhaarNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [tempUserId, setTempUserId] = useState(null);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  // Generate temporary user ID for DigiLocker verification
  useEffect(() => {
    if (!tempUserId) {
      const generatedId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTempUserId(generatedId);
    }
  }, []);


  const states = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 
    'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };


  const handleDigiLockerVerification = (verificationResult) => {
    console.log('✅ DigiLocker verification completed:', verificationResult);
    setDigilockerVerified(true);
    setVerificationData(verificationResult);
    
    // Auto-fill Aadhaar number from verification
    if (verificationResult.aadhaarNumber) {
      setFormData(prev => ({
        ...prev,
        aadhaarNumber: verificationResult.aadhaarNumber
      }));
    }
    
    toast.success('✅ Aadhaar verified successfully!');
  };

  const handleSkipVerification = () => {
    console.log('⏭️ User chose to skip DigiLocker verification');
    toast.info('You can complete verification later from your profile');
    // Stay on step 2 since there's no step 3 anymore
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number';
      }
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
    }
    
    if (stepNumber === 2) {
      // DigiLocker verification is optional but recommended
      if (!digilockerVerified && !formData.aadhaarNumber.trim()) {
        newErrors.verification = 'Please complete Aadhaar verification or provide Aadhaar number manually';
      }
      
      // Only validate Aadhaar format if manually entered (not DigiLocker verified)
      if (!digilockerVerified && formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
        newErrors.aadhaarNumber = 'Please enter a valid 12-digit Aadhaar number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Submit triggered, current step:', step);
    console.log('📊 Current form data:', formData);
    console.log('✅ DigiLocker verified:', digilockerVerified);
    console.log('📄 Verification data:', verificationData);
    
    if (!validateStep(step)) {
      console.log('❌ Validation failed for step:', step);
      console.log('🔍 Current errors:', errors);
      return;
    }
    
    console.log('✅ Validation passed, proceeding with registration...');
    setIsLoading(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        ...formData,
        tempUserId: tempUserId,
        aadhaarNumber: formData.aadhaarNumber || (verificationData?.aadhaarNumber),
        isDigiLockerVerified: digilockerVerified
      };

      console.log('📝 Submitting registration data:', registrationData);

      // Submit registration using DigiLocker-only endpoint
      const response = await fetch('/api/basic-workers/register-basic-digilocker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        console.log('📄 Raw response status:', response.status);
        console.log('📄 Raw response headers:', response.headers);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      if (result.success) {
        toast.success('Registration completed successfully!');
        
        // Store basic session info (will get proper session on login)
        localStorage.setItem('nanojobs_registration_complete', 'true');
        localStorage.setItem('nanojobs_worker_id', result.data.worker.id);
        
        // Navigate to success page or login
        navigate('/registration-success', { 
          state: { 
            workerData: result.data,
            nextSteps: result.data.nextSteps
          }
        });
        
      } else {
        toast.error(result.message || 'Registration failed');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen message="Creating your account..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Join NanoJobs</h1>
        <p>Complete simple tasks, earn money, and build your reputation</p>
      </div>

      {/* Progress Steps */}
      <div className={styles.progressSteps}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>1</div>
          <span>Basic Info</span>
        </div>
        <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <span>ID Verification</span>
        </div>
      </div>

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <CardBody>
              <CardHeader>
                <h2><User size={20} /> Basic Information</h2>
                <p>Tell us about yourself</p>
              </CardHeader>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.name ? styles.error : ''}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className={errors.phone ? styles.error : ''}
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Your city"
                    className={errors.city ? styles.error : ''}
                  />
                  {errors.city && <span className={styles.errorText}>{errors.city}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={errors.state ? styles.error : ''}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <span className={styles.errorText}>{errors.state}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Pin Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pin code"
                    maxLength="6"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <Button onClick={handleNext} size="lg">
                  Next: ID Verification
                </Button>
              </div>
            </CardBody>
          )}

          {/* Step 2: ID Verification */}
          {step === 2 && (
            <CardBody>
              <CardHeader>
                <h2><CreditCard size={20} /> Aadhaar Verification</h2>
                <p>Verify your identity securely through DigiLocker</p>
              </CardHeader>

              <div className={styles.idVerification}>
                {tempUserId && (
                  <DigiLockerVerification
                    tempUserId={tempUserId}
                    onVerificationComplete={handleDigiLockerVerification}
                    onSkip={handleSkipVerification}
                    aadhaarNumber={formData.aadhaarNumber}
                    setAadhaarNumber={(number) => setFormData(prev => ({ ...prev, aadhaarNumber: number }))}
                  />
                )}
                
                {!digilockerVerified && (
                  <div className={styles.manualEntry}>
                    <div className={styles.divider}>
                      <span>OR</span>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Enter Aadhaar Number Manually</label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setFormData(prev => ({ ...prev, aadhaarNumber: value }));
                        }}
                        placeholder="Enter your 12-digit Aadhaar number"
                        maxLength="12"
                        className={errors.aadhaarNumber ? styles.error : ''}
                      />
                      {errors.aadhaarNumber && <span className={styles.errorText}>{errors.aadhaarNumber}</span>}
                      <small className={styles.inputNote}>
                        Manual entry requires additional verification later
                      </small>
                    </div>
                  </div>
                )}
                
                {errors.verification && <span className={styles.errorText}>{errors.verification}</span>}
              </div>

              <div className={styles.formActions}>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={!digilockerVerified && !formData.aadhaarNumber}
                  size="lg"
                >
                  <CheckCircle2 size={20} />
                  Complete Registration
                </Button>
              </div>
            </CardBody>
          )}

        </form>
      </Card>

      {/* Info Card */}
      <Card className={styles.infoCard}>
        <CardBody>
          <h3>🎯 How Badge System Works</h3>
          <ul>
            <li>✅ Complete free tasks to earn your first badges</li>
            <li>🏆 Each category has its own badge (Bronze → Silver → Gold → Platinum)</li>
            <li>💰 Higher badges unlock better-paying tasks</li>
            <li>🚀 Build your reputation and increase your earnings</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
};

export default BasicWorkerRegistration;