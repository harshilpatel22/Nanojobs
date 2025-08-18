import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  Shield, 
  ArrowRight, 
  Users, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  Timer,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Zap,
  Mail,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { authAPI, storageUtils } from '../utils/api';

import styles from './Login.module.css';

/**
 * Premium Login Component - Indian Architecture Theme
 * Beautiful 2-step authentication with MSG91 OTP
 * 
 * Features:
 * - Stunning visual design with Indian cultural elements
 * - Individual OTP digit inputs with auto-advance
 * - Glassmorphism effects and smooth animations
 * - Mobile-optimized with touch-friendly design
 * - Accessibility support and error handling
 */

const Login = ({ onWorkerSuccess, onEmployerSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from URL params or default
  const from = location.state?.from?.pathname || '/';
  
  // Form state
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'email'
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    otp: ['', '', '', '', '', ''] // Individual OTP digits
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // OTP input refs for auto-focus
  const otpRefs = useRef([]);

  // OTP timer countdown
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  /**
   * Handle phone input changes
   */
  const handlePhoneChange = (value) => {
    // Only allow digits and limit to 10
    const phoneValue = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      phone: phoneValue
    }));
    
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: null }));
    }
  };

  /**
   * Handle email input changes
   */
  const handleEmailChange = (value) => {
    setFormData(prev => ({
      ...prev,
      email: value
    }));
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  /**
   * Handle password input changes
   */
  const handlePasswordChange = (value) => {
    setFormData(prev => ({
      ...prev,
      password: value
    }));
    
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
    }
  };

  /**
   * Handle OTP input changes with auto-advance
   */
  const handleOTPChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOTP = [...formData.otp];
    newOTP[index] = digit;
    
    setFormData(prev => ({
      ...prev,
      otp: newOTP
    }));

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Clear OTP error when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: null }));
    }
  };

  /**
   * Handle OTP input keydown for backspace navigation
   */
  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!formData.otp[index] && index > 0) {
        // Move to previous input if current is empty
        otpRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOTP = [...formData.otp];
        newOTP[index] = '';
        setFormData(prev => ({ ...prev, otp: newOTP }));
      }
    }
  };

  /**
   * Handle OTP paste
   */
  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const otpMatch = pastedData.match(/\d{6}/);
    
    if (otpMatch) {
      const otpDigits = otpMatch[0].split('');
      setFormData(prev => ({ ...prev, otp: otpDigits }));
      toast.success('OTP auto-filled from clipboard!');
      
      // Focus last input
      otpRefs.current[5]?.focus();
    }
  };

  /**
   * Validate phone number
   */
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Validate email address
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle phone number submission
   */
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    const phone = formData.phone.trim();
    
    // Validate phone number
    if (!phone) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }
    
    if (!validatePhone(phone)) {
      setErrors({ phone: 'Please enter a valid 10-digit mobile number starting with 6-9' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('📱 Sending OTP to:', phone);
      
      const response = await authAPI.sendOTP(phone);
      
      if (response.success) {
        setSessionId(response.data.sessionId);
        setStep('otp');
        setOtpTimer(120); // 2 minutes
        setCanResendOTP(false);
        
        // Focus first OTP input after transition
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 300);
        
        toast.success('📱 OTP sent successfully!');
        console.log('✅ OTP sent, session ID:', response.data.sessionId);
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
      
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      
      if (error.message.includes('not found')) {
        setErrors({ 
          phone: 'No account found with this number. Please register first.' 
        });
      } else {
        toast.error(error.message || '❌ Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle OTP verification
   */
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    const otp = formData.otp.join('');
    
    // Validate OTP
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit OTP' });
      return;
    }

    if (!sessionId) {
      toast.error('❌ Session expired. Please try again.');
      setStep('phone');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Verifying OTP...');
      
      const response = await authAPI.verifyOTP(sessionId, otp);
      
      if (response.success) {
        const { sessionToken, user, userType, userId } = response.data;
        
        console.log('✅ Login successful:', { userType, userId });
        
        // Show success animation
        setShowSuccess(true);
        
        // Store session based on user type
        setTimeout(() => {
          if (userType === 'worker') {
            storageUtils.setWorkerSession(sessionToken, userId);
            toast.success('🎉 Welcome back! Logged in as Worker');
            
            if (onWorkerSuccess) {
              onWorkerSuccess(sessionToken, userId);
            } else {
              navigate('/dashboard');
            }
          } else if (userType === 'employer') {
            storageUtils.setEmployerSession(sessionToken, userId);
            toast.success('🎉 Welcome back! Logged in as Employer');
            
            if (onEmployerSuccess) {
              onEmployerSuccess(sessionToken, userId);
            } else {
              navigate('/employer-dashboard');
            }
          } else {
            throw new Error('Unknown user type');
          }
        }, 1000); // Delay for success animation
        
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
      
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
        setErrors({ otp: 'Invalid or expired OTP. Please try again.' });
        // Clear OTP inputs on error
        setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
        otpRefs.current[0]?.focus();
      } else {
        toast.error(error.message || '❌ Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    const email = formData.email.trim();
    const password = formData.password.trim();
    
    // Validate email and password
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }
    
    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Email login attempt for:', email);
      
      const response = await authAPI.loginWithEmail(email, password);
      
      if (response.success) {
        const { sessionToken, user, userType, userId } = response.data;
        
        console.log('✅ Email login successful:', { userType, userId });
        
        // Show success animation
        setShowSuccess(true);
        
        // Store session based on user type
        setTimeout(() => {
          if (userType === 'worker') {
            storageUtils.setWorkerSession(sessionToken, userId);
            toast.success('🎉 Welcome back! Logged in as Worker');
            
            if (onWorkerSuccess) {
              onWorkerSuccess(sessionToken, userId);
            } else {
              navigate('/dashboard');
            }
          } else if (userType === 'employer') {
            storageUtils.setEmployerSession(sessionToken, userId);
            toast.success('🎉 Welcome back! Logged in as Employer');
            
            if (onEmployerSuccess) {
              onEmployerSuccess(sessionToken, userId);
            } else {
              navigate('/employer-dashboard');
            }
          } else {
            throw new Error('Unknown user type');
          }
        }, 1000); // Delay for success animation
        
      } else {
        throw new Error(response.message || 'Invalid email or password');
      }
      
    } catch (error) {
      console.error('❌ Email login error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        setErrors({ 
          email: 'Invalid email or password. Please check your credentials.' 
        });
      } else {
        toast.error(error.message || '❌ Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    if (!canResendOTP) return;
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.sendOTP(formData.phone);
      
      if (response.success) {
        setSessionId(response.data.sessionId);
        setOtpTimer(120);
        setCanResendOTP(false);
        setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
        
        // Focus first OTP input
        otpRefs.current[0]?.focus();
        
        toast.success('📱 New OTP sent successfully!');
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.message || '❌ Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle back to phone step
   */
  const handleBackToPhone = () => {
    setStep('phone');
    setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
    setSessionId(null);
    setOtpTimer(0);
    setCanResendOTP(false);
    setErrors({});
    setShowSuccess(false);
  };

  /**
   * Format timer display
   */
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Calculate timer progress (for circular progress)
   */
  const getTimerProgress = () => {
    return ((120 - otpTimer) / 120) * 100;
  };

  /**
   * Handle development worker login
   */
  const handleDevWorkerLogin = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔧 DEV: Quick worker login');
      const response = await authAPI.devLoginWorker();
      
      if (response.success) {
        const { token, user, worker } = response.data;
        
        console.log('✅ Dev worker login successful:', { user, worker });
        
        // Show success animation
        setShowSuccess(true);
        
        // Store session
        setTimeout(() => {
          storageUtils.setWorkerSession(token, worker.id);
          toast.success('🎉 Logged in as Worker!');
          
          if (onWorkerSuccess) {
            onWorkerSuccess(token, worker.id);
          } else {
            navigate('/dashboard');
          }
        }, 1000);
        
      } else {
        throw new Error(response.message || 'Dev login failed');
      }
      
    } catch (error) {
      console.error('❌ Dev worker login error:', error);
      toast.error(error.response?.data?.message || '❌ Dev login failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle development employer login
   */
  const handleDevEmployerLogin = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔧 DEV: Quick employer login');
      const response = await authAPI.devLoginEmployer();
      
      if (response.success) {
        const { token, user, employer } = response.data;
        
        console.log('✅ Dev employer login successful:', { user, employer });
        
        // Show success animation
        setShowSuccess(true);
        
        // Store session
        setTimeout(() => {
          storageUtils.setEmployerSession(token, employer.id);
          toast.success('🎉 Logged in as Employer!');
          
          if (onEmployerSuccess) {
            onEmployerSuccess(token, employer.id);
          } else {
            navigate('/employer-dashboard');
          }
        }, 1000);
        
      } else {
        throw new Error(response.message || 'Dev login failed');
      }
      
    } catch (error) {
      console.error('❌ Dev employer login error:', error);
      toast.error(error.response?.data?.message || '❌ Dev login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.architectureBackground}></div>
        <div className={styles.floatingElements}>
          <div className={styles.floatingElement} style={{ top: '10%', left: '10%' }}>
            <Zap size={16} />
          </div>
          <div className={styles.floatingElement} style={{ top: '20%', right: '15%' }}>
            <Shield size={18} />
          </div>
          <div className={styles.floatingElement} style={{ bottom: '25%', left: '8%' }}>
            <Sparkles size={14} />
          </div>
          <div className={styles.floatingElement} style={{ bottom: '15%', right: '12%' }}>
            <Phone size={16} />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/')}
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className={styles.logo}>
            <Briefcase size={32} />
            <h1>NanoJobs</h1>
          </div>
          
          <div className={styles.headerContent}>
            <h2 className={styles.welcomeTitle}>
              {step === 'phone' ? 'Welcome Back!' : 
               step === 'email' ? 'Welcome Back!' : 
               'Verify Your Number'}
            </h2>
            <p className={styles.subtitle}>
              {step === 'phone' 
                ? 'Sign in to continue your earning journey'
                : step === 'email'
                ? 'Sign in with your email and password'
                : `We've sent a code to ${formData.phone}`
              }
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className={styles.loginContainer}>
          <Card className={styles.loginCard}>
            {showSuccess && (
              <div className={styles.successOverlay}>
                <div className={styles.successIcon}>
                  <CheckCircle size={48} />
                </div>
                <h3>Login Successful!</h3>
                <p>Redirecting to your dashboard...</p>
              </div>
            )}

            <CardBody className={styles.cardBody}>
              {/* Login Method Toggle */}
              {(step === 'phone' || step === 'email') && (
                <div className={styles.loginMethodToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${step === 'phone' ? styles.active : ''}`}
                    onClick={() => setStep('phone')}
                  >
                    <Phone size={16} />
                    <span>Phone + OTP</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${step === 'email' ? styles.active : ''}`}
                    onClick={() => setStep('email')}
                  >
                    <Mail size={16} />
                    <span>Email + Password</span>
                  </button>
                </div>
              )}

              {step === 'phone' ? (
                // Phone Number Step
                <form onSubmit={handlePhoneSubmit} className={styles.form}>
                  <div className={styles.stepIndicator}>
                    <div className={styles.stepDot + ' ' + styles.active}></div>
                    <div className={styles.stepLine}></div>
                    <div className={styles.stepDot}></div>
                  </div>

                  <div className={styles.formHeader}>
                    <div className={styles.formIcon}>
                      <Phone size={24} />
                    </div>
                    <h3>Enter Phone Number</h3>
                    <p>We'll send you a verification code</p>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.phoneInputWrapper}>
                      <span className={styles.countryCode}>+91</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className={`${styles.phoneInput} ${errors.phone ? styles.error : ''}`}
                        maxLength={10}
                        autoComplete="tel"
                        autoFocus
                      />
                    </div>
                    {errors.phone && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={16} />
                        <span>{errors.phone}</span>
                      </div>
                    )}
                    <div className={styles.phoneHint}>
                      <Shield size={14} />
                      <span>Your number is safe and secure with us</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={!formData.phone || formData.phone.length !== 10}
                    className={styles.submitButton}
                  >
                    {isLoading ? (
                      <>
                        <span>Sending OTP</span>
                        <div className={styles.dots}>
                          <span></span><span></span><span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </form>
              ) : step === 'otp' ? (
                // OTP Verification Step
                <form onSubmit={handleOTPSubmit} className={styles.form}>
                  <div className={styles.stepIndicator}>
                    <div className={styles.stepDot + ' ' + styles.completed}></div>
                    <div className={styles.stepLine + ' ' + styles.completed}></div>
                    <div className={styles.stepDot + ' ' + styles.active}></div>
                  </div>

                  <div className={styles.formHeader}>
                    <div className={styles.formIcon}>
                      <Shield size={24} />
                    </div>
                    <h3>Enter Verification Code</h3>
                    <p>Enter the 6-digit code sent to <strong>+91 {formData.phone}</strong></p>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.otpContainer}>
                      {formData.otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => otpRefs.current[index] = el}
                          type="text"
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(index, e)}
                          onPaste={handleOTPPaste}
                          className={`${styles.otpInput} ${errors.otp ? styles.error : ''}`}
                          maxLength={1}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                    
                    {errors.otp && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={16} />
                        <span>{errors.otp}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.otpActions}>
                    <div className={styles.timerSection}>
                      {otpTimer > 0 ? (
                        <div className={styles.timerDisplay}>
                          <div className={styles.timerCircle}>
                            <svg viewBox="0 0 36 36" className={styles.circularProgress}>
                              <path
                                className={styles.circleBg}
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={styles.circle}
                                strokeDasharray={`${100 - getTimerProgress()}, 100`}
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className={styles.timerText}>{formatTimer(otpTimer)}</span>
                          </div>
                          <span>Resend available in</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.resendButton}
                          onClick={handleResendOTP}
                          disabled={isLoading || !canResendOTP}
                        >
                          <RefreshCw size={16} />
                          <span>Resend Code</span>
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className={styles.changeNumber}
                      onClick={handleBackToPhone}
                    >
                      <ArrowLeft size={14} />
                      Change Number
                    </button>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={formData.otp.join('').length !== 6}
                    className={styles.submitButton}
                  >
                    {isLoading ? (
                      <>
                        <span>Verifying</span>
                        <div className={styles.dots}>
                          <span></span><span></span><span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <CheckCircle size={18} />
                      </>
                    )}
                  </Button>
                </form>
              ) : step === 'email' ? (
                // Email + Password Step  
                <form onSubmit={handleEmailLogin} className={styles.form}>
                  <div className={styles.formHeader}>
                    <div className={styles.formIcon}>
                      <Mail size={24} />
                    </div>
                    <h3>Sign In with Email</h3>
                    <p>Enter your email and password to continue</p>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.emailInputWrapper}>
                      <Mail size={18} className={styles.inputIcon} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="Enter your email address"
                        className={`${styles.emailInput} ${errors.email ? styles.error : ''}`}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {errors.email && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={16} />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.passwordInputWrapper}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="Enter your password"
                        className={`${styles.passwordInput} ${errors.password ? styles.error : ''}`}
                        autoComplete="current-password"
                      />
                    </div>
                    {errors.password && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={16} />
                        <span>{errors.password}</span>
                      </div>
                    )}
                    <div className={styles.passwordHint}>
                      <Shield size={14} />
                      <span>Your password is encrypted and secure</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={!formData.email || !formData.password}
                    className={styles.submitButton}
                  >
                    {isLoading ? (
                      <>
                        <span>Signing In</span>
                        <div className={styles.dots}>
                          <span></span><span></span><span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </form>
              ) : null}
            </CardBody>
          </Card>
        </div>

        {/* Development Login Shortcuts */}
        {import.meta.env.DEV && (
          <div className={styles.devLoginSection}>
            <div className={styles.devLoginHeader}>
              <h4>⚡ Quick Login (Development)</h4>
              <p>Skip OTP for faster testing</p>
            </div>
            <div className={styles.devLoginButtons}>
              <button
                className={styles.devLoginBtn + ' ' + styles.workerBtn}
                onClick={handleDevWorkerLogin}
                disabled={isLoading}
              >
                <Users size={20} />
                <span>Login as Worker</span>
              </button>
              <button
                className={styles.devLoginBtn + ' ' + styles.employerBtn}
                onClick={handleDevEmployerLogin}
                disabled={isLoading}
              >
                <Briefcase size={20} />
                <span>Login as Employer</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration Options */}
        <div className={styles.registerSection}>
          <p className={styles.registerText}>New to NanoJobs?</p>
          
          <div className={styles.registerOptions}>
            <Link to="/register" className={styles.registerLink}>
              <div className={styles.registerIcon}>
                <Users size={20} />
              </div>
              <div className={styles.registerContent}>
                <strong>Join as Worker</strong>
                <p>Find flexible micro-tasks and start earning</p>
              </div>
              <ArrowRight size={16} className={styles.registerArrow} />
            </Link>
            
            <Link to="/register/employer" className={styles.registerLink}>
              <div className={styles.registerIcon}>
                <Briefcase size={20} />
              </div>
              <div className={styles.registerContent}>
                <strong>Join as Employer</strong>
                <p>Post tasks and hire skilled talent</p>
              </div>
              <ArrowRight size={16} className={styles.registerArrow} />
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className={styles.trustIndicators}>
          <div className={styles.trustItem}>
            <Shield size={16} />
            <span>Secure OTP Authentication</span>
          </div>
          <div className={styles.trustItem}>
            <Sparkles size={16} />
            <span>AI-Powered Skill Matching</span>
          </div>
          <div className={styles.trustItem}>
            <Zap size={16} />
            <span>Instant Task Notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;