import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, User, Phone, Mail, Globe, FileText, Briefcase, ArrowRight, ArrowLeft,
  CheckCircle2, Zap, Shield, Trophy, Sparkles, Target, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
// Import the API client
import { employerAPI } from '../utils/api';

import styles from './EmployerRegistration.module.css';

const EmployerRegistration = ({ onSuccess }) => {
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    employerType: '',
    companyName: '',
    website: '',
    description: '',
    businessCategory: '',
    expectedTaskVolume: 'low'
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [employerTypes, setEmployerTypes] = useState([]);
  const [businessCategories, setBusinessCategories] = useState([]);

  // Load employer types and categories on mount
  useEffect(() => {
    loadConfigData();
  }, []);

  /**
   * Load configuration data from API using the API client
   */
  const loadConfigData = async () => {
    try {
      const API_BASE = 'http://localhost:5001/api'; // Add this line
      
      const [typesResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE}/employers/config/employer-types`), // Updated URL
        fetch(`${API_BASE}/employers/config/business-categories`) // Updated URL
      ]);
  
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setEmployerTypes(typesData.data.employerTypes);
      } else {
        console.warn('Using fallback employer types');
        setFallbackEmployerTypes();
      }
  
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setBusinessCategories(categoriesData.data.categories);
      } else {
        console.warn('Using fallback business categories');
        setFallbackBusinessCategories();
      }
    } catch (error) {
      console.error('Failed to load config data:', error);
      setFallbackEmployerTypes();
      setFallbackBusinessCategories();
    }
  };

  /**
   * Fallback data when API fails
   */
  const setFallbackEmployerTypes = () => {
    setEmployerTypes([
      { 
        value: 'individual', 
        label: 'Individual/Freelancer', 
        description: 'Individual looking for task assistance',
        features: ['Simple registration', 'Quick task posting', 'Basic verification'] 
      },
      { 
        value: 'small_business', 
        label: 'Small Business', 
        description: 'Small business or startup (1-50 employees)',
        features: ['Company profile', 'Bulk task posting', 'Priority support'] 
      },
      { 
        value: 'company', 
        label: 'Large Company', 
        description: 'Established company (50+ employees)',
        features: ['Enterprise features', 'Custom solutions', 'Dedicated account manager'] 
      }
    ]);
  };

  const setFallbackBusinessCategories = () => {
    setBusinessCategories([
      { value: 'technology', label: 'Technology & IT', description: 'Software, web development, IT services' },
      { value: 'marketing', label: 'Marketing & Advertising', description: 'Digital marketing, content, social media' },
      { value: 'design', label: 'Design & Creative', description: 'Graphic design, UI/UX, creative services' },
      { value: 'writing', label: 'Writing & Translation', description: 'Content writing, copywriting, translation' },
      { value: 'consulting', label: 'Consulting & Strategy', description: 'Business consulting, strategy, advisory' },
      { value: 'education', label: 'Education & Training', description: 'Online tutoring, course creation, training' },
      { value: 'healthcare', label: 'Healthcare & Wellness', description: 'Medical services, wellness, healthcare' },
      { value: 'finance', label: 'Finance & Accounting', description: 'Accounting, bookkeeping, financial services' },
      { value: 'retail', label: 'Retail & E-commerce', description: 'Online retail, e-commerce, product sales' },
      { value: 'other', label: 'Other', description: 'Other business types not listed above' }
    ]);
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid Indian mobile number';
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.employerType) {
        newErrors.employerType = 'Please select your employer type';
      }
    }

    if (step === 2) {
      if (formData.employerType !== 'individual' && !formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL (including http:// or https://)';
      }
      
      if (!formData.businessCategory) {
        newErrors.businessCategory = 'Please select a business category';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  /**
   * Handle form submission using API client
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateStep(2)) {
      return;
    }
  
    setIsLoading(true);
  
    try {
      const API_BASE = 'http://localhost:5001/api'; // Add this line
      
      const response = await fetch(`${API_BASE}/employers/register`, { // Updated URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.replace(/\D/g, ''),
          email: formData.email.trim() || undefined,
          employerType: formData.employerType,
          companyName: formData.companyName.trim() || undefined,
          website: formData.website.trim() || undefined,
          description: formData.description.trim() || undefined,
          businessCategory: formData.businessCategory,
          expectedTaskVolume: formData.expectedTaskVolume
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        toast.success('Registration successful! Welcome to NanoJobs.');
        
        // Call success callback with session token
        if (onSuccess) {
          onSuccess(data.data.sessionToken, data.data.employer.id);
        } else {
          // Fallback navigation
          navigate('/employer-dashboard');
        }
      } else {
        throw new Error(data.message || 'Registration failed');
      }
  
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle back to home
   */
  const handleBackToHome = () => {
    navigate('/');
  };

  // Show loading spinner during submission
  if (isLoading) {
    return <LoadingSpinner fullscreen message="Creating your employer account..." />;
  }

  return (
    <div className={styles.container}>
      {/* Enhanced Header */}
      <header className={styles.header}>
        <Button 
          variant="ghost" 
          icon={ArrowLeft} 
          onClick={handleBackToHome}
          className={styles.backButton}
        >
          Back to Home
        </Button>
        
        <div className={styles.progressSection}>
          <div className={styles.stepIndicators}>
            <div className={`${styles.stepIndicator} ${currentStep >= 1 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>1</div>
              <span>Personal Info</span>
            </div>
            <div className={styles.stepConnector} />
            <div className={`${styles.stepIndicator} ${currentStep >= 2 ? styles.active : ''}`}>
              <div className={styles.stepNumber}>2</div>
              <span>Business Details</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <Briefcase size={48} />
          </div>
          <h1 className={styles.heroTitle}>
            {currentStep === 1 ? "Join NanoJobs as an Employer" : "Tell us about your business"}
          </h1>
          <p className={styles.heroSubtitle}>
            {currentStep === 1 
              ? "Connect with skilled workers and get your tasks done quickly" 
              : "Help us match you with the perfect talent for your needs"}
          </p>
          
          <div className={styles.trustIndicators}>
            <div className={styles.trustItem}>
              <CheckCircle2 size={16} />
              <span>Verified Workers</span>
            </div>
            <div className={styles.trustItem}>
              <Shield size={16} />
              <span>Secure Payments</span>
            </div>
            <div className={styles.trustItem}>
              <Zap size={16} />
              <span>Quick Results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.formSection}>
          <Card className={styles.registrationCard}>
            <CardBody>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className={styles.step}>
                    <div className={styles.stepHeader}>
                      <div className={styles.stepIcon}>
                        <User size={24} />
                      </div>
                      <div className={styles.stepTitle}>
                        <h2>Personal Information</h2>
                        <p>Let's start with your basic details</p>
                      </div>
                    </div>

                    <div className={styles.formFields}>
                      <div className={styles.inputGroup}>
                        <Input
                          label="Full Name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                          icon={User}
                          error={errors.name}
                          autoFocus
                          required
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <Input
                          label="Phone Number"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter your mobile number"
                          icon={Phone}
                          error={errors.phone}
                          required
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <Input
                          label="Email Address"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email address (optional)"
                          icon={Mail}
                          error={errors.email}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>What type of employer are you?</label>
                        <div className={styles.employerTypes}>
                          {employerTypes.map((type) => (
                            <div 
                              key={type.value}
                              className={`${styles.employerTypeCard} ${formData.employerType === type.value ? styles.selected : ''}`}
                              onClick={() => handleInputChange('employerType', type.value)}
                            >
                              <div className={styles.cardHeader}>
                                <div className={styles.radioButton}>
                                  <div className={styles.radioInner} />
                                </div>
                                <h4>{type.label}</h4>
                              </div>
                              <p className={styles.cardDescription}>{type.description}</p>
                              {type.features && (
                                <div className={styles.cardFeatures}>
                                  {type.features.slice(0, 2).map((feature, index) => (
                                    <div key={index} className={styles.feature}>
                                      <CheckCircle2 size={12} />
                                      <span>{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {errors.employerType && (
                          <span className={styles.error}>{errors.employerType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Details */}
                {currentStep === 2 && (
                  <div className={styles.step}>
                    <div className={styles.stepHeader}>
                      <div className={styles.stepIcon}>
                        <Building2 size={24} />
                      </div>
                      <div className={styles.stepTitle}>
                        <h2>Business Information</h2>
                        <p>Help us understand your business better</p>
                      </div>
                    </div>

                    <div className={styles.formFields}>
                      {formData.employerType !== 'individual' && (
                        <div className={styles.inputGroup}>
                          <Input
                            label="Company Name"
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="Enter your company name"
                            icon={Building2}
                            error={errors.companyName}
                            autoFocus
                            required
                          />
                        </div>
                      )}

                      <div className={styles.inputGroup}>
                        <Input
                          label="Website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://your-website.com (optional)"
                          icon={Globe}
                          error={errors.website}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel} htmlFor="description">
                          Business Description
                        </label>
                        <textarea
                          id="description"
                          className={styles.textarea}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Tell us about your business and the type of tasks you'll be posting... (optional)"
                          rows={4}
                          maxLength={1000}
                        />
                        <div className={styles.characterCount}>
                          {formData.description.length}/1000 characters
                        </div>
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel} htmlFor="businessCategory">
                          Business Category
                        </label>
                        <select
                          id="businessCategory"
                          className={styles.select}
                          value={formData.businessCategory}
                          onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                          required
                        >
                          <option value="">Select your business category</option>
                          {businessCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        {errors.businessCategory && (
                          <span className={styles.error}>{errors.businessCategory}</span>
                        )}
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.fieldLabel}>Expected Task Volume</label>
                        <div className={styles.volumeOptions}>
                          {[
                            { value: 'low', title: 'Low Volume', subtitle: '1-5 tasks/month', description: 'Perfect for occasional projects', icon: Target },
                            { value: 'medium', title: 'Medium Volume', subtitle: '5-20 tasks/month', description: 'Regular task posting', icon: Zap },
                            { value: 'high', title: 'High Volume', subtitle: '20+ tasks/month', description: 'Enterprise-level usage', icon: Trophy }
                          ].map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <div 
                                key={option.value}
                                className={`${styles.volumeCard} ${formData.expectedTaskVolume === option.value ? styles.selected : ''}`}
                                onClick={() => handleInputChange('expectedTaskVolume', option.value)}
                              >
                                <div className={styles.volumeIcon}>
                                  <IconComponent size={20} />
                                </div>
                                <div className={styles.volumeContent}>
                                  <h4>{option.title}</h4>
                                  <p className={styles.volumeSubtitle}>{option.subtitle}</p>
                                  <span className={styles.volumeDescription}>{option.description}</span>
                                </div>
                                <div className={styles.volumeSelector}>
                                  <div className={styles.radioButton}>
                                    <div className={styles.radioInner} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className={styles.actions}>
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      icon={ArrowLeft}
                      className={styles.secondaryAction}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {currentStep < 2 ? (
                    <Button
                      onClick={handleNext}
                      icon={ArrowRight}
                      iconPosition="right"
                      className={styles.primaryAction}
                      size="lg"
                    >
                      Continue to Business Details
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      loading={isLoading}
                      icon={Sparkles}
                      className={styles.primaryAction}
                      size="lg"
                    >
                      Create My Employer Account
                    </Button>
                  )}
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Enhanced Benefits Section */}
        <div className={styles.benefitsSection}>
          <div className={styles.benefits}>
            <div className={styles.benefitsHeader}>
              <Trophy size={32} />
              <h3>Why Top Employers Choose NanoJobs</h3>
              <p>Join thousands of successful businesses</p>
            </div>
            
            <div className={styles.benefitsList}>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <Target size={24} />
                </div>
                <div className={styles.benefitContent}>
                  <h4>AI-Powered Matching</h4>
                  <p>Get matched with workers who have the exact skills you need for your tasks</p>
                </div>
              </div>
              
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <Zap size={24} />
                </div>
                <div className={styles.benefitContent}>
                  <h4>Lightning Fast Results</h4>
                  <p>Most tasks are completed within 1-3 hours with quality guaranteed</p>
                </div>
              </div>
              
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <Shield size={24} />
                </div>
                <div className={styles.benefitContent}>
                  <h4>Secure & Protected</h4>
                  <p>Pay only when satisfied. Our escrow system protects your payments</p>
                </div>
              </div>
              
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <Users size={24} />
                </div>
                <div className={styles.benefitContent}>
                  <h4>Verified Talent Pool</h4>
                  <p>All workers are skill-tested and verified for quality assurance</p>
                </div>
              </div>
            </div>
            
            <div className={styles.socialProof}>
              <div className={styles.proofItem}>
                <span className={styles.proofNumber}>10,000+</span>
                <span className={styles.proofLabel}>Active Employers</span>
              </div>
              <div className={styles.proofItem}>
                <span className={styles.proofNumber}>95%</span>
                <span className={styles.proofLabel}>Task Success Rate</span>
              </div>
              <div className={styles.proofItem}>
                <span className={styles.proofNumber}>2.5hrs</span>
                <span className={styles.proofLabel}>Average Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegistration;