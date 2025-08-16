import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, AlertCircle, User, Phone, Mail, Briefcase, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// Import components
import Button from '../common/Button';
import Input from '../common/Input';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';

// Import API utilities
import { workerAPI, trialTaskAPI, apiUtils, storageUtils } from '../../utils/api';

// Import styles
import styles from './TrialTaskFlow.module.css';

/**
 * TrialTaskFlow Component - Replaces SkillAssessment
 * Provides real micro-task trials instead of quiz questions
 * 
 * Props:
 * - onSuccess: function (callback when trials succeed)
 * - onBack: function (callback to go back to registration choice)
 * - workerData: object (pre-filled worker data from parent)
 */

const TrialTaskFlow = ({ onSuccess, onBack, workerData = {} }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Instructions, 3: Task, 4: Results
  const [trialTasks, setTrialTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [currentTaskData, setCurrentTaskData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Store the basic info data from step 1
  const [basicInfoData, setBasicInfoData] = useState({
    name: workerData.name || '',
    phone: workerData.phone || '',
    email: workerData.email || '',
    educationLevel: '',
    availableHours: 3,
    previousWork: ''
  });

  // React Hook Form setup for basic info
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues
  } = useForm({
    mode: 'onChange',
    defaultValues: basicInfoData
  });

  /**
   * Load trial tasks on component mount
   */
  useEffect(() => {
    loadTrialTasks();
  }, []);

  /**
   * Timer countdown effect
   */
  useEffect(() => {
    let timer;
    if (currentStep === 3 && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, timeRemaining]);

  /**
   * Load trial tasks from API
   */
  const loadTrialTasks = async () => {
    try {
      const response = await trialTaskAPI.getTrialTasks({
        includeAnalytics: true,
        workerId: storageUtils.getSession().workerId
      });
      
      if (apiUtils.isSuccess(response)) {
        setTrialTasks(response.data.trialTasks || []);
        console.log('📝 Loaded trial tasks:', response.data.trialTasks);
      } else {
        throw new Error(apiUtils.getErrorMessage(response));
      }
    } catch (error) {
      console.error('Failed to load trial tasks:', error);
      toast.error('Failed to load trial tasks. Please try again.');
      // Load default tasks as fallback
      setTrialTasks(getDefaultTrialTasks());
    }
  };

  /**
   * Handle time up for current task
   */
  const handleTimeUp = useCallback(() => {
    toast.error('Time\'s up for this task! Submitting current work...');
    handleTaskSubmission(true); // Auto-submit on timeout
  }, [currentTaskData, currentTaskIndex]);

  /**
   * Handle basic info form submission
   */
  const onSubmitBasicInfo = (formData) => {
    if (trialTasks.length === 0) {
      toast.error('Trial tasks not loaded yet. Please try again.');
      return;
    }
    
    console.log('📝 Basic info submitted:', formData);
    
    // Store the basic info data for later use
    setBasicInfoData(formData);
    
    setCurrentStep(2); // Move to instructions
  };

  /**
   * Start first trial task
   */
  const startTrialTasks = () => {
    if (trialTasks.length === 0) {
      toast.error('No trial tasks available');
      return;
    }

    setCurrentStep(3);
    startCurrentTask();
  };

  /**
   * Start current task timer and setup
   */
  const startCurrentTask = () => {
    const currentTask = trialTasks[currentTaskIndex];
    if (!currentTask) return;

    setTaskStartTime(Date.now());
    setTimeRemaining(currentTask.timeLimit * 60); // Convert minutes to seconds
    setCurrentTaskData({});
    
    toast.success(`Started: ${currentTask.title}`);
  };

  /**
   * Handle task data changes
   */
  const handleTaskDataChange = useCallback((field, value) => {
    setCurrentTaskData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Handle task submission
   */
  const handleTaskSubmission = async (isTimeout = false) => {
    if (isSubmitting) return;

    const currentTask = trialTasks[currentTaskIndex];
    if (!currentTask) return;

    setIsSubmitting(true);

    try {
      const timeSpent = taskStartTime ? Math.floor((Date.now() - taskStartTime) / (1000 * 60)) : 0;

      console.log('📤 Submitting trial task:', {
        taskId: currentTask.id,
        workData: currentTaskData,
        timeSpent
      });

      // Submit task work for evaluation
      const response = await trialTaskAPI.submitTrialTask(
        currentTask.id,
        basicInfoData,
        currentTaskData,
        timeSpent
      );

      if (apiUtils.isSuccess(response)) {
        const submission = {
          taskId: currentTask.id,
          taskTitle: currentTask.title,
          ...response.data
        };
        
        setTaskSubmissions(prev => [...prev, submission]);
        
        if (isTimeout) {
          toast.error(`Time's up! Task submitted automatically.`);
        } else {
          toast.success(`${currentTask.title} completed!`);
        }

        // Move to next task or finish
        if (currentTaskIndex < trialTasks.length - 1) {
          setCurrentTaskIndex(prev => prev + 1);
          setCurrentStep(3); // Stay in task mode
          setTimeout(() => startCurrentTask(), 1000);
        } else {
          // All tasks completed
          completeAllTrials();
        }
      } else {
        throw new Error(apiUtils.getErrorMessage(response));
      }

    } catch (error) {
      console.error('❌ Task submission error:', error);
      toast.error('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Complete all trial tasks and register worker
   */
  const completeAllTrials = async () => {
    try {
      console.log('🎯 Completing trial tasks and registering worker...');

      // Register worker with trial results
      const registrationData = {
        ...basicInfoData,
        registrationPath: 'simple_form',
        trialTaskResults: taskSubmissions
      };

      const response = await workerAPI.registerWithTrialTasks(registrationData);

      if (apiUtils.isSuccess(response)) {
        setCurrentStep(4); // Move to results
        
        toast.success('All trial tasks completed! 🎉');
        
        // Call success callback
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data.sessionToken, response.data.worker.id);
          }
        }, 2000);
      } else {
        throw new Error(apiUtils.getErrorMessage(response));
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error('Failed to complete registration. Please try again.');
    }
  };

  /**
   * Render basic info form (Simple Form Path)
   */
  const renderBasicInfoForm = () => (
    <form onSubmit={handleSubmit(onSubmitBasicInfo)} className={styles.form}>
      <div className={styles.formHeader}>
        <Briefcase size={48} className={styles.briefcaseIcon} />
        <h3>Tell us about yourself</h3>
        <p>We'll use this information to match you with suitable tasks.</p>
      </div>

      <div className={styles.formFields}>
        <Input
          icon={User}
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' }
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

        <div className={styles.selectField}>
          <label className={styles.selectLabel}>Education Level</label>
          <select
            {...register('educationLevel', { required: 'Please select your education level' })}
            className={styles.select}
          >
            <option value="">Select education level</option>
            <option value="10th">10th Standard</option>
            <option value="12th">12th Standard</option>
            <option value="diploma">Diploma</option>
            <option value="graduate">Graduate</option>
            <option value="postgraduate">Postgraduate</option>
            <option value="other">Other</option>
          </select>
          {errors.educationLevel && (
            <span className={styles.fieldError}>{errors.educationLevel.message}</span>
          )}
        </div>

        <div className={styles.selectField}>
          <label className={styles.selectLabel}>Available Hours per Day</label>
          <select
            {...register('availableHours', { required: 'Please select available hours' })}
            className={styles.select}
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3-4 hours</option>
            <option value={5}>5-6 hours</option>
            <option value={8}>Full time (8+ hours)</option>
          </select>
        </div>

        <div className={styles.textareaField}>
          <label className={styles.selectLabel}>Previous Work Experience (Optional)</label>
          <textarea
            {...register('previousWork')}
            placeholder="Briefly describe any previous work experience..."
            rows="3"
            className={styles.textarea}
          />
        </div>
      </div>

      <div className={styles.trialInfo}>
        <h4>Trial Tasks Overview</h4>
        <div className={styles.trialStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{trialTasks.length}</span>
            <span className={styles.statLabel}>practical tasks</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>₹{trialTasks.reduce((sum, task) => sum + (task.payAmount || 0), 0)}</span>
            <span className={styles.statLabel}>total earnings</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>45</span>
            <span className={styles.statLabel}>minutes</span>
          </div>
        </div>
        
        <div className={styles.trialInstructions}>
          <h5>What to expect:</h5>
          <ul>
            <li>Complete 3 real micro-tasks to prove your skills</li>
            <li>Each task is paid and contributes to your final assessment</li>
            <li>Tasks include data entry, content writing, and organization</li>
            <li>Earn your Bronze badge based on performance</li>
          </ul>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          icon={ArrowLeft}
        >
          Back
        </Button>
        
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!isValid || trialTasks.length === 0}
        >
          Start Trial Tasks
        </Button>
      </div>
    </form>
  );

  /**
   * Render task instructions
   */
  const renderInstructions = () => (
    <div className={styles.instructionsContainer}>
      <div className={styles.instructionsHeader}>
        <CheckCircle size={48} className={styles.instructionsIcon} />
        <h3>Ready to Start Your Trial Tasks?</h3>
        <p>You'll complete 3 short tasks that simulate real work you'll do on NanoJobs.</p>
      </div>

      <div className={styles.tasksList}>
        {trialTasks.map((task, index) => (
          <Card key={task.id} className={styles.taskCard}>
            <CardBody>
              <div className={styles.taskInfo}>
                <div className={styles.taskNumber}>{index + 1}</div>
                <div className={styles.taskDetails}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskPay}>₹{task.payAmount}</span>
                    <span className={styles.taskTime}>{task.timeLimit} minutes</span>
                    <span className={styles.taskCategory}>{task.category.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className={styles.instructionsRules}>
        <h4>Important Guidelines:</h4>
        <ul>
          <li>Each task has a time limit - work efficiently but carefully</li>
          <li>You'll be evaluated on accuracy, speed, and quality</li>
          <li>Read instructions carefully before starting</li>
          <li>You'll earn money for each completed task</li>
          <li>Need 2 out of 3 tasks passed to earn Bronze badge</li>
        </ul>
      </div>

      <div className={styles.instructionsActions}>
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          icon={ArrowLeft}
        >
          Back to Info
        </Button>
        
        <Button
          size="lg"
          onClick={startTrialTasks}
          icon={ArrowRight}
          iconPosition="right"
        >
          Start First Task
        </Button>
      </div>
    </div>
  );

  /**
   * Render current trial task interface
   */
  const renderTrialTask = () => {
    const currentTask = trialTasks[currentTaskIndex];
    if (!currentTask) return null;

    return (
      <div className={styles.taskContainer}>
        <div className={styles.taskHeader}>
          <div className={styles.taskProgress}>
            <span>Task {currentTaskIndex + 1} of {trialTasks.length}</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${((currentTaskIndex + 1) / trialTasks.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className={styles.taskTimer}>
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <Card className={styles.currentTaskCard}>
          <CardHeader
            title={currentTask.title}
            subtitle={`₹${currentTask.payAmount} • ${currentTask.timeLimit} minutes`}
          />
          <CardBody>
            <div className={styles.taskInstructions}>
              <h4>Instructions:</h4>
              <p>{currentTask.instructions}</p>
            </div>

            {/* Render task-specific interface */}
            {currentTask.category === 'DATA_ENTRY' && renderDataEntryTask(currentTask)}
            {currentTask.category === 'CONTENT' && renderContentTask(currentTask)}
            {currentTask.category === 'ORGANIZATION' && renderOrganizationTask(currentTask)}
          </CardBody>
        </Card>

        <div className={styles.taskActions}>
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
            disabled={isSubmitting}
          >
            Back to Instructions
          </Button>
          
          <Button
            onClick={() => handleTaskSubmission()}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={CheckCircle}
            iconPosition="right"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Task'}
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render data entry task interface
   */
  const renderDataEntryTask = (task) => (
    <div className={styles.dataEntryTask}>
      <div className={styles.taskSample}>
        <h5>Sample Data to Enter:</h5>
        <div className={styles.sampleImage}>
          <p>📋 Imagine customer data shown here</p>
          <p><strong>Sample:</strong> John Smith, 9876543210, john@email.com, Mumbai</p>
        </div>
      </div>
      
      <div className={styles.entryForm}>
        <h5>Enter the data:</h5>
        {[...Array(5)].map((_, index) => (
          <div key={index} className={styles.entryRow}>
            <Input
              placeholder="Name"
              value={currentTaskData[`entry_${index}_name`] || ''}
              onChange={(e) => handleTaskDataChange(`entry_${index}_name`, e.target.value)}
            />
            <Input
              placeholder="Phone"
              value={currentTaskData[`entry_${index}_phone`] || ''}
              onChange={(e) => handleTaskDataChange(`entry_${index}_phone`, e.target.value)}
            />
            <Input
              placeholder="Email"
              value={currentTaskData[`entry_${index}_email`] || ''}
              onChange={(e) => handleTaskDataChange(`entry_${index}_email`, e.target.value)}
            />
            <Input
              placeholder="City"
              value={currentTaskData[`entry_${index}_city`] || ''}
              onChange={(e) => handleTaskDataChange(`entry_${index}_city`, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Render content creation task interface
   */
  const renderContentTask = (task) => (
    <div className={styles.contentTask}>
      <div className={styles.contentPrompt}>
        <h5>Write product descriptions for:</h5>
        <ul>
          <li><strong>Bluetooth Headphones</strong> - Noise cancellation, 20hr battery, Foldable</li>
          <li><strong>Smart Fitness Watch</strong> - Heart rate monitor, GPS tracking, Waterproof</li>
          <li><strong>Organic Green Tea</strong> - 100% natural, Weight loss support, 25 tea bags</li>
        </ul>
        <p>Each description should be 80-120 words, professional and persuasive.</p>
      </div>
      
      <div className={styles.contentEditor}>
        <textarea
          placeholder="Write your product descriptions here..."
          rows="10"
          value={currentTaskData.content || ''}
          onChange={(e) => handleTaskDataChange('content', e.target.value)}
          className={styles.contentTextarea}
        />
        <div className={styles.wordCount}>
          Words: {(currentTaskData.content || '').split(' ').filter(w => w.length > 0).length}
        </div>
      </div>
    </div>
  );

  /**
   * Render organization task interface
   */
  const renderOrganizationTask = (task) => (
    <div className={styles.organizationTask}>
      <div className={styles.organizationPrompt}>
        <h5>Organize these mixed contacts:</h5>
        <div className={styles.rawData}>
          <p>John Smith - john@email.com - 9876543210 - Tech Corp</p>
          <p>Mary Johnson, Marketing Manager, mary.j@company.com, +91-9876543211</p>
          <p>9876543212 | David Wilson | david@startup.in | StartUp Inc</p>
        </div>
        <p>Organize into proper columns: Name, Phone, Email, Company</p>
      </div>
      
      <div className={styles.organizationTable}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className={styles.organizationRow}>
            <Input
              placeholder="Name"
              value={currentTaskData[`org_${index}_name`] || ''}
              onChange={(e) => handleTaskDataChange(`org_${index}_name`, e.target.value)}
            />
            <Input
              placeholder="Phone"
              value={currentTaskData[`org_${index}_phone`] || ''}
              onChange={(e) => handleTaskDataChange(`org_${index}_phone`, e.target.value)}
            />
            <Input
              placeholder="Email"
              value={currentTaskData[`org_${index}_email`] || ''}
              onChange={(e) => handleTaskDataChange(`org_${index}_email`, e.target.value)}
            />
            <Input
              placeholder="Company"
              value={currentTaskData[`org_${index}_company`] || ''}
              onChange={(e) => handleTaskDataChange(`org_${index}_company`, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Render completion results
   */
  const renderResults = () => (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <CheckCircle size={64} className={styles.successIcon} />
        <h2>Trial Tasks Completed! 🎉</h2>
        <p>You've successfully completed all trial tasks. Here are your results:</p>
      </div>

      <div className={styles.resultsCards}>
        {taskSubmissions.map((submission, index) => (
          <Card key={index} className={styles.resultCard}>
            <CardBody>
              <div className={styles.resultHeader}>
                <h4>{submission.taskTitle}</h4>
                <span className={`${styles.resultBadge} ${submission.evaluation.passed ? styles.passed : styles.failed}`}>
                  {submission.evaluation.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </span>
              </div>
              <div className={styles.resultScores}>
                <div className={styles.score}>
                  <span className={styles.scoreLabel}>Accuracy</span>
                  <span className={styles.scoreValue}>{submission.evaluation.accuracyScore}%</span>
                </div>
                <div className={styles.score}>
                  <span className={styles.scoreLabel}>Speed</span>
                  <span className={styles.scoreValue}>{submission.evaluation.speedScore}%</span>
                </div>
                <div className={styles.score}>
                  <span className={styles.scoreLabel}>Quality</span>
                  <span className={styles.scoreValue}>{submission.evaluation.qualityScore}%</span>
                </div>
              </div>
              {submission.evaluation.feedback && (
                <p className={styles.feedback}>{submission.evaluation.feedback}</p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className={styles.overallResult}>
        <h3>Your Badge Assignment:</h3>
        <div className={styles.badgeDisplay}>
          <div className={styles.bronzeBadge}>BRONZE</div>
          <p>Entry Level - Perfect for getting started with micro-tasks</p>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={() => setCurrentStep(5)}>
        Continue to Dashboard
      </Button>
    </div>
  );

  /**
   * Helper function to format time remaining
   */
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get default trial tasks if API fails
   */
  const getDefaultTrialTasks = () => [
    {
      id: 'trial_data_entry_1',
      title: 'Data Entry Trial',
      description: 'Enter 5 customer records from the provided format',
      category: 'DATA_ENTRY',
      payAmount: 75,
      timeLimit: 15,
      accuracyThreshold: 90,
      instructions: 'Look at the sample data and enter each record into the correct fields. Pay attention to spelling and formatting.'
    },
    {
      id: 'trial_content_1',
      title: 'Product Description Trial',
      description: 'Write 3 compelling product descriptions',
      category: 'CONTENT',
      payAmount: 100,
      timeLimit: 20,
      accuracyThreshold: 85,
      instructions: 'Write engaging product descriptions that would help customers understand and want to buy these products.'
    },
    {
      id: 'trial_organization_1',
      title: 'Contact Organization Trial',
      description: 'Organize 3 mixed contact details properly',
      category: 'ORGANIZATION',
      payAmount: 80,
      timeLimit: 10,
      accuracyThreshold: 92,
      instructions: 'Take the mixed contact information and organize it into proper columns.'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Skills Assessment via Real Tasks</h1>
        <p>
          {currentStep === 1 
            ? 'Complete real micro-tasks to prove your abilities and earn money'
            : currentStep === 2 
            ? 'Instructions for your trial tasks'
            : currentStep === 3
            ? 'Complete each task within the time limit'
            : 'Your assessment results'
          }
        </p>
      </div>

      <Card className={styles.assessmentCard}>
        <CardBody>
          {currentStep === 1 && renderBasicInfoForm()}
          {currentStep === 2 && renderInstructions()}
          {currentStep === 3 && renderTrialTask()}
          {currentStep === 4 && renderResults()}
        </CardBody>
      </Card>
    </div>
  );
};

export default TrialTaskFlow;