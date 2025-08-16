import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, User, Phone, Mail, FileText, CheckCircle, AlertCircle, Brain, ArrowLeft, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

// Import components
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TrialTaskFlow from '../components/trial-tasks/TrialTaskflow';

// Import API utilities
import { workerAPI, fileUtils, apiUtils } from '../utils/api';

// Import styles
import styles from './WorkerRegistration.module.css';

/**
 * Enhanced WorkerRegistration Page - Dual Path Support
 * Now supports both Resume Upload and Simple Form registration paths
 * 
 * Props:
 * - onSuccess: function (callback when registration succeeds)
 */

const WorkerRegistration = ({ onSuccess }) => {
  const [registrationMode, setRegistrationMode] = useState(null); // null, 'resume', 'simple_form'
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const watchedName = watch('name');

  /**
   * Handle registration mode selection
   */
  const handleModeSelection = (mode) => {
    setRegistrationMode(mode);
    setCurrentStep(1);
  };

  /**
   * Go back to mode selection
   */
  const goBackToModeSelection = () => {
    setRegistrationMode(null);
    setCurrentStep(1);
    setSelectedFile(null);
    setFileError('');
    setAnalysisResult(null);
  };

  /**
   * Handle file selection and validation (Resume Path)
   */
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file
    const validation = fileUtils.validateResumeFile(file);
    if (!validation.valid) {
      setFileError(validation.errors.join(', '));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    toast.success('Resume selected successfully!');
  }, []);

  /**
   * Handle drag and drop
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validation = fileUtils.validateResumeFile(file);
      
      if (validation.valid) {
        setSelectedFile(file);
        setFileError('');
        toast.success('Resume uploaded successfully!');
      } else {
        setFileError(validation.errors.join(', '));
        setSelectedFile(null);
      }
    }
  }, []);

  /**
   * Remove selected file
   */
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setFileError('');
    
    // Reset file input
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  /**
   * Handle resume registration form submission (Professional Path)
   */
  const onSubmitResume = async (formData) => {
    if (!selectedFile) {
      setFileError('Please select a resume file');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const uploadData = fileUtils.createResumeFormData(selectedFile, formData);

      console.log('Submitting registration with resume...');
      
      // Submit registration
      const response = await workerAPI.registerWithResume(uploadData);

      if (apiUtils.isSuccess(response)) {
        setAnalysisResult(response.data);
        setCurrentStep(3); // Move to success step
        
        toast.success('Registration successful! 🎉');
        
        // Call success callback after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data.sessionToken, response.data.worker.id);
          }
        }, 2000);
      } else {
        throw new Error(apiUtils.getErrorMessage(response));
      }

    } catch (error) {
      console.error('Registration error:', error);
      const errorData = apiUtils.handleError(error);
      toast.error(errorData.message);
      
      // Show specific file upload errors
      if (errorData.status === 400 && errorData.message.includes('file')) {
        setFileError(errorData.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle trial task success (Simple Form Path)
   */
  const handleTrialTaskSuccess = (result) => {
    setAnalysisResult(result);
    setCurrentStep(3);
    
    toast.success('Registration successful! 🎉');
    
    // Call success callback after a short delay
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(result.sessionToken, result.worker.id);
      }
    }, 2000);
  };

  /**
   * Render enhanced mode selection with user personas
   */
  const renderModeSelection = () => (
    <div className={styles.modeSelection}>
      <div className={styles.modeHeader}>
        <h2>Choose Your Registration Path</h2>
        <p>We have two ways to get started based on your background and experience.</p>
      </div>

      <div className={styles.modeOptions}>
        {/* Professional/Student Path */}
        <Card 
          className={`${styles.modeCard} ${styles.professionalCard}`}
          clickable
          hover
          onClick={() => handleModeSelection('resume')}
        >
          <CardBody>
            <div className={styles.modeIcon}>
              <FileText size={48} />
            </div>
            <h3>Professional Path</h3>
            <h4>Upload Your Resume</h4>
            <p>Perfect for students and working professionals who have a resume ready.</p>
            
            <div className={styles.modePersonas}>
              <div className={styles.persona}>
                <Users size={16} />
                <span>Students & Graduates</span>
              </div>
              <div className={styles.persona}>
                <Briefcase size={16} />
                <span>Working Professionals</span>
              </div>
            </div>
            
            <div className={styles.modeFeatures}>
              <span>✓ Quick setup (2-3 minutes)</span>
              <span>✓ AI analyzes your experience</span>
              <span>✓ Higher badge potential</span>
              <span>✓ Automatic skill detection</span>
            </div>
            
            <div className={styles.modeAction}>
              <Button size="sm" fullWidth>
                Upload Resume
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className={styles.modeOr}>OR</div>

        {/* Simple Form Path for Housewives */}
        <Card 
          className={`${styles.modeCard} ${styles.simpleCard}`}
          clickable
          hover
          onClick={() => handleModeSelection('simple_form')}
        >
          <CardBody>
            <div className={styles.modeIcon}>
              <Brain size={48} />
            </div>
            <h3>Simple Path</h3>
            <h4>Start with Trial Tasks</h4>
            <p>Perfect for housewives and first-time workers who want to learn by doing.</p>
            
            <div className={styles.modePersonas}>
              <div className={styles.persona}>
                <Users size={16} />
                <span>Housewives</span>
              </div>
              <div className={styles.persona}>
                <Users size={16} />
                <span>First-time Workers</span>
              </div>
            </div>
            
            <div className={styles.modeFeatures}>
              <span>✓ No resume required</span>
              <span>✓ Learn by doing real tasks</span>
              <span>✓ Earn money while learning</span>
              <span>✓ Step-by-step guidance</span>
            </div>
            
            <div className={styles.modeAction}>
              <Button size="sm" fullWidth>
                Start Trial Tasks
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className={styles.modeFooter}>
        <Card variant="flat" className={styles.infoCard}>
          <CardBody>
            <h4>Both paths lead to the same opportunities!</h4>
            <p>
              Whether you upload a resume or complete trial tasks, you'll get access to the same 
              micro-tasks and earning opportunities. Choose the path that feels most comfortable for you.
            </p>
            <div className={styles.guarantees}>
              <div className={styles.guarantee}>
                <CheckCircle size={16} />
                <span>Same earning potential</span>
              </div>
              <div className={styles.guarantee}>
                <CheckCircle size={16} />
                <span>Equal task access</span>
              </div>
              <div className={styles.guarantee}>
                <CheckCircle size={16} />
                <span>Skill development support</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  /**
   * Render file upload area (Professional Path)
   */
  const renderFileUpload = () => (
    <div className={styles.fileUploadSection}>
      <div
        className={`${styles.dropZone} ${selectedFile ? styles.dropZoneSuccess : ''} ${fileError ? styles.dropZoneError : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        <div className={styles.dropZoneContent}>
          {selectedFile ? (
            <>
              <CheckCircle size={48} className={styles.successIcon} />
              <h3>Resume Selected</h3>
              <p className={styles.fileName}>{selectedFile.name}</p>
              <p className={styles.fileSize}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeFile}
                className={styles.removeButton}
              >
                Remove File
              </Button>
            </>
          ) : (
            <>
              <Upload size={48} className={styles.uploadIcon} />
              <h3>Upload Your Resume</h3>
              <p>Drag and drop your resume here, or click to select</p>
              <p className={styles.fileTypes}>
                Supports PDF, DOC, DOCX, TXT (Max 5MB)
              </p>
              <Button variant="outline">
                Select Resume
              </Button>
            </>
          )}
        </div>
      </div>

      {fileError && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} />
          {fileError}
        </div>
      )}

      <div className={styles.uploadHelp}>
        <h4>Tips for best results:</h4>
        <ul>
          <li>Use a recent, updated resume</li>
          <li>Include all your skills and experience</li>
          <li>Make sure the text is clear and readable</li>
          <li>PDF format works best for analysis</li>
        </ul>
      </div>
    </div>
  );

  /**
   * Render resume registration form (Professional Path)
   */
  const renderResumeForm = () => (
    <form onSubmit={handleSubmit(onSubmitResume)} className={styles.form}>
      <div className={styles.formHeader}>
        <FileText size={48} className={styles.formIcon} />
        <h3>Professional Registration</h3>
        <p>Upload your resume and we'll analyze your experience to assign the right skill level.</p>
      </div>

      <div className={styles.formFields}>
        <Input
          icon={User}
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            },
            maxLength: {
              value: 50,
              message: 'Name must be less than 50 characters'
            },
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: 'Name can only contain letters and spaces'
            }
          })}
        />

        <Input
          icon={Phone}
          label="Phone Number"
          type="tel"
          placeholder="Enter your mobile number"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Please enter a valid 10-digit Indian mobile number'
            }
          })}
        />

        <Input
          icon={Mail}
          label="Email Address (Optional)"
          type="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register('email', {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address'
            }
          })}
        />
      </div>

      {renderFileUpload()}

      <div className={styles.formActions}>
        <Button
          type="button"
          variant="outline"
          onClick={goBackToModeSelection}
          icon={ArrowLeft}
          className={styles.backButton}
        >
          Back to Options
        </Button>
        
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isUploading}
          disabled={!isValid || !selectedFile}
        >
          {isUploading ? 'Analyzing Resume...' : 'Register & Analyze'}
        </Button>
      </div>
    </form>
  );

  /**
   * Render success step with AI analysis results
   */
  const renderSuccessStep = () => {
    if (!analysisResult) return null;

    const { worker, badgeInfo } = analysisResult;
    const aiAnalysis = analysisResult.aiAnalysis || analysisResult.trialEvaluation;

    return (
      <div className={styles.successStep}>
        <div className={styles.successHeader}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2>Welcome to NanoJobs, {worker.name}! 🎉</h2>
          <p>
            {registrationMode === 'resume' 
              ? 'Your resume has been analyzed and you\'ve been assigned a skill badge.'
              : 'Your trial tasks have been completed and you\'ve been assigned a skill badge.'
            }
          </p>
        </div>

        <Card className={styles.badgeCard}>
          <CardBody>
            <div className={styles.badgeDisplay}>
              <div 
                className={styles.badge}
                style={{
                  backgroundColor: badgeInfo.bgColor,
                  color: badgeInfo.textColor,
                  borderColor: badgeInfo.color
                }}
              >
                {worker.badge}
              </div>
              <div className={styles.badgeInfo}>
                <h3>{badgeInfo.description}</h3>
                <p>Estimated Rate: {badgeInfo.hourlyRange}/hour</p>
                <p className={styles.badgeReason}>{worker.badgeReason}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className={styles.analysisDetails}>
          <div className={styles.analysisSection}>
            <h4>Your Skills</h4>
            <div className={styles.skillTags}>
              {worker.skills.map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.analysisSection}>
            <h4>Recommended Task Categories</h4>
            <div className={styles.taskCategories}>
              {worker.recommendedTasks.map((task, index) => (
                <span key={index} className={styles.taskTag}>
                  {task}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.analysisSection}>
            <h4>Registration Summary</h4>
            <ul className={styles.summaryList}>
              <li>Registration Path: <strong>{registrationMode === 'resume' ? 'Professional (Resume)' : 'Simple (Trial Tasks)'}</strong></li>
              <li>Experience Level: <strong>{worker.experienceLevel}</strong></li>
              {registrationMode === 'simple_form' && worker.trialTaskStats && (
                <li>Trial Tasks: <strong>{worker.trialTaskStats.passed}/{worker.trialTaskStats.completed} passed</strong></li>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h4>What's Next?</h4>
          <ol className={styles.stepsList}>
            <li>Explore your personalized dashboard</li>
            <li>Browse tasks matching your {worker.badge} level</li>
            <li>Start with simple tasks to build your reputation</li>
            <li>Earn money and unlock higher-paying opportunities</li>
          </ol>
        </div>

        <Button size="lg" fullWidth onClick={() => setCurrentStep(4)}>
          Continue to Dashboard
        </Button>
      </div>
    );
  };

  /**
   * Render step indicators
   */
  const renderStepIndicator = () => {
    if (!registrationMode) return null;

    const steps = registrationMode === 'resume' 
      ? ['Basic Info', 'Upload Resume', 'AI Analysis']
      : ['Basic Info', 'Trial Tasks', 'Results'];

    return (
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className={`${styles.step} ${currentStep >= index + 1 ? styles.stepActive : ''}`}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <span>{step}</span>
            </div>
            {index < steps.length - 1 && <div className={styles.stepConnector}></div>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // If simple form mode is selected, render the TrialTaskFlow component
  if (registrationMode === 'simple_form') {
    return (
      <TrialTaskFlow 
        onSuccess={handleTrialTaskSuccess}
        onBack={goBackToModeSelection}
        workerData={getValues()}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Join NanoJobs</h1>
        <p>
          {!registrationMode 
            ? 'Choose the registration path that works best for you'
            : registrationMode === 'resume' 
              ? 'Upload your resume and let AI match you with perfect micro-tasks'
              : 'Complete trial tasks to demonstrate your skills and start earning'
          }
        </p>
      </div>

      {renderStepIndicator()}

      <Card className={styles.registrationCard}>
        {!registrationMode && (
          <CardHeader
            title="Get Started with NanoJobs"
            subtitle="Join thousands of workers earning extra income through micro-tasks designed for Indian professionals."
          />
        )}

        {registrationMode === 'resume' && currentStep <= 2 && (
          <CardHeader
            title="Professional Registration"
            subtitle="Upload your resume and we'll use AI to assign the right skill badge and recommend suitable tasks."
          />
        )}

        <CardBody>
          {!registrationMode && renderModeSelection()}
          {registrationMode === 'resume' && currentStep <= 2 && renderResumeForm()}
          {currentStep === 3 && renderSuccessStep()}
          {isUploading && (
            <div className={styles.loadingOverlay}>
              <LoadingSpinner 
                size="lg" 
                message="Analyzing your resume with AI..." 
              />
            </div>
          )}
        </CardBody>
      </Card>

      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>Why NanoJobs?</h4>
            <ul>
              <li>Earn ₹5,000-15,000 extra income monthly</li>
              <li>Flexible work from home opportunities</li>
              <li>Skill development and career growth</li>
              <li>Instant payments via UPI</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>Suitable for:</h4>
            <ul>
              <li>Students looking for part-time income</li>
              <li>Housewives wanting flexible work</li>
              <li>Professionals seeking extra earnings</li>
              <li>Anyone with basic computer skills</li>
            </ul>
          </div>
        </div>
        
        <p className={styles.legal}>
          By registering, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default WorkerRegistration;