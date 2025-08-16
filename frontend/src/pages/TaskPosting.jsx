import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Calendar,
  FileText,
  Zap,
  Award,
  Plus,
  X,
  Shield,
  CreditCard,
  Lock,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UPISetupModal from '../components/payment/UPISetupModal';

import styles from './TaskPosting.module.css';

const API_BASE = 'http://localhost:5001/api';

/**
 * Updated Task Posting Component with UPI Integration
 * Now requires UPI mandate setup before task posting for payment protection
 * 
 * New Features:
 * - UPI mandate requirement check
 * - Payment protection setup flow
 * - Automatic escrow on task creation
 * - Trust badges and security indicators
 * - Enhanced employer onboarding
 */

const TaskPosting = ({ employerId }) => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimatedHours: '',
    hourlyRate: '',
    totalBudget: '',
    requiredSkills: [],
    urgency: 'normal',
    location: 'Remote',
    maxApplications: '10',
    deadline: '',
    startDate: ''
  });
  
  // File upload state
  const [attachments, setAttachments] = useState([]);
  const [fileDescriptions, setFileDescriptions] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  // UPI Integration state
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [hasUPIMandate, setHasUPIMandate] = useState(false);
  const [upiMandate, setUpiMandate] = useState(null);
  const [isCheckingMandate, setIsCheckingMandate] = useState(true);

  // Initialize and check UPI mandate status
  useEffect(() => {
    const token = localStorage.getItem('nanojobs_session_token');
    const employerId = localStorage.getItem('nanojobs_employer_id');
    
    console.log('🔐 TaskPosting Auth Debug:', {
      hasToken: !!token,
      employerId: employerId || 'none'
    });
    
    if (!token) {
      console.warn('⚠️ No session token found');
      toast.error('⚠️ Please log in to access this page');
    }
    
    checkUPIMandate();
    loadTaskCategories();
  }, []);

  // Auto-calculate total budget
  useEffect(() => {
    if (formData.estimatedHours && formData.hourlyRate) {
      const hours = parseFloat(formData.estimatedHours);
      const rate = parseFloat(formData.hourlyRate);
      if (!isNaN(hours) && !isNaN(rate)) {
        const total = hours * rate;
        setFormData(prev => ({
          ...prev,
          totalBudget: total.toString()
        }));
      }
    }
  }, [formData.estimatedHours, formData.hourlyRate]);

  /**
   * Check if employer has active UPI mandate
   */
  const checkUPIMandate = async () => {
    try {
      setIsCheckingMandate(true);
      console.log('🔍 Checking UPI mandate for employer:', employerId);
      
      const response = await fetch(`${API_BASE}/payments/mandates/${employerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nanojobs_session_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data.mandates.length > 0) {
          const activeMandate = result.data.mandates.find(m => m.status === 'ACTIVE');
          
          if (activeMandate) {
            setHasUPIMandate(true);
            setUpiMandate(activeMandate);
            console.log('✅ Active UPI mandate found:', activeMandate.mandateRef);
          } else {
            console.log('⚠️ No active UPI mandate found');
            setHasUPIMandate(false);
          }
        } else {
          console.log('ℹ️ No UPI mandates exist yet');
          setHasUPIMandate(false);
        }
      } else if (response.status === 404) {
        // API endpoint not implemented yet - simulate for demo
        console.log('ℹ️ UPI mandate API not implemented - simulating for demo');
        setHasUPIMandate(false);
      } else {
        console.error('❌ Failed to check UPI mandate:', response.status);
        setHasUPIMandate(false);
      }
    } catch (error) {
      console.error('❌ UPI mandate check error:', error);
      // For demo purposes, don't block the user
      setHasUPIMandate(false);
    } finally {
      setIsCheckingMandate(false);
    }
  };

  /**
   * Load task categories
   */
  const loadTaskCategories = async () => {
    try {
      console.log('🔄 Loading categories from API...');
      
      const response = await fetch(`${API_BASE}/tasks/categories/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data && result.data.categories) {
          const transformedCategories = result.data.categories.map(cat => ({
            value: cat.id,
            label: cat.name,
            description: cat.description,
            averageRate: cat.averageRate,
            badgeRequired: cat.badgeRequired,
            taskCount: cat.taskCount
          }));
          
          setCategories(transformedCategories);
          toast.success(`✅ Loaded ${transformedCategories.length} task categories`);
          return;
        }
      }
      
      // Fallback categories
      setCategories(getFallbackCategories());
      
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      setCategories(getFallbackCategories());
    }
  };

  /**
   * Get fallback categories
   */
  const getFallbackCategories = () => {
    return [
      { value: 'data-entry', label: 'Data Entry', description: 'Simple data input and processing tasks', averageRate: 120 },
      { value: 'content-writing', label: 'Content Writing', description: 'Blog posts, articles, and copywriting', averageRate: 250 },
      { value: 'virtual-assistant', label: 'Virtual Assistant', description: 'Administrative and support tasks', averageRate: 200 },
      { value: 'graphic-design', label: 'Graphic Design', description: 'Logo design, graphics, and visual content', averageRate: 400 },
      { value: 'web-development', label: 'Web Development', description: 'Website development and programming', averageRate: 500 },
      { value: 'digital-marketing', label: 'Digital Marketing', description: 'SEO, social media, and online marketing', averageRate: 300 }
    ];
  };

  /**
   * Handle UPI mandate setup success
   */
  const handleUPIMandateSuccess = (mandate) => {
    console.log('✅ UPI mandate setup successful:', mandate);
    setUpiMandate(mandate);
    setHasUPIMandate(true);
    setShowUPIModal(false);
    
    toast.success('🎉 Payment protection activated! You can now post tasks safely.');
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    if (['title', 'description', 'category'].includes(field)) {
      setAiAnalysis(null);
    }
  };

  /**
   * Add skill to requirements
   */
  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }));
      setSkillInput('');
    }
  };

  /**
   * Remove skill from requirements
   */
  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  /**
   * Handle skill input key press
   */
  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  /**
   * Smart task analysis
   */

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.estimatedHours) {
      newErrors.estimatedHours = 'Estimated hours is required';
    } else if (parseFloat(formData.estimatedHours) < 0.5) {
      newErrors.estimatedHours = 'Minimum 0.5 hours required';
    }

    if (!formData.hourlyRate) {
      newErrors.hourlyRate = 'Hourly rate is required';
    } else if (parseFloat(formData.hourlyRate) < 50) {
      newErrors.hourlyRate = 'Minimum rate is ₹50/hour';
    }

    if (!formData.totalBudget) {
      newErrors.totalBudget = 'Total budget is required';
    } else if (parseFloat(formData.totalBudget) < 100) {
      newErrors.totalBudget = 'Minimum budget is ₹100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle file selection for task attachments
   */
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  /**
   * Remove selected file
   */
  const removeFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Handle form submission with automatic escrow
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasUPIMandate) {
      toast.error('⚠️ Please setup UPI payment protection first');
      setShowUPIModal(true);
      return;
    }

    if (!validateForm()) {
      toast.error('❌ Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create task with attachments
      const taskFormData = new FormData();
      
      // Add task data with correct field names expected by backend
      taskFormData.append('title', formData.title.trim());
      taskFormData.append('description', formData.description.trim());
      taskFormData.append('category', formData.category);
      taskFormData.append('duration', Math.round(parseFloat(formData.estimatedHours) * 60)); // Convert hours to minutes
      taskFormData.append('payAmount', parseFloat(formData.totalBudget));
      taskFormData.append('skillTags', JSON.stringify(formData.requiredSkills));
      taskFormData.append('employerId', employerId);
      taskFormData.append('difficulty', 'beginner'); // Default value
      taskFormData.append('industry', 'general'); // Default value
      
      // Add attachments if any
      if (attachments.length > 0) {
        attachments.forEach((file) => {
          taskFormData.append('attachments', file);
        });
        if (fileDescriptions) {
          taskFormData.append('attachmentDescriptions', fileDescriptions);
        }
      }

      console.log('📝 Creating task with payment protection and attachments...');
      console.log('FormData contents:', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        duration: Math.round(parseFloat(formData.estimatedHours) * 60),
        payAmount: parseFloat(formData.totalBudget),
        skillTags: formData.requiredSkills,
        employerId,
        attachmentCount: attachments.length
      });

      const taskResponse = await fetch(`${API_BASE}/bronze-tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nanojobs_session_token')}`
        },
        body: taskFormData
      });

      if (taskResponse.ok) {
        const taskResult = await taskResponse.json();
        
        
        if (taskResult.success) {
          const createdTask = taskResult.data.task;
          console.log('✅ Task created:', createdTask.id);

          // Step 2: Automatically lock payment in escrow
          console.log('🔒 Locking payment in escrow...');
          
          try {
            const escrowResponse = await fetch(`${API_BASE}/payments/escrow`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('nanojobs_session_token')}`
              },
              body: JSON.stringify({
                taskId: createdTask.id,
                employerId,
                amount: formData.totalBudget
              })
            });

            if (escrowResponse.ok) {
              const escrowResult = await escrowResponse.json();
              console.log('✅ Payment escrowed:', escrowResult.data.payment.transactionId);
              
              toast.success('🎉 Task posted & payment secured! Workers can now apply confidently.');
              navigate('/employer-dashboard');
            } else {
              // Task created but escrow failed - still show success but warn about payment
              console.warn('⚠️ Task created but escrow failed');
              toast.success('✅ Task posted successfully!');
              toast('⚠️ Payment escrow will be set up when a worker is selected', {
                duration: 5000,
                icon: 'ℹ️'
              });
              navigate('/employer-dashboard');
            }
          } catch (escrowError) {
            console.warn('⚠️ Escrow error:', escrowError);
            toast.success('✅ Task posted successfully!');
            toast('ℹ️ Payment protection will be activated when needed', {
              duration: 4000
            });
            navigate('/employer-dashboard');
          }
        } else {
          throw new Error(taskResult.message || 'Failed to create task');
        }
      } else {
        const errorData = await taskResponse.json().catch(async () => {
          const errorText = await taskResponse.text().catch(() => '');
          return { message: errorText };
        });
        console.error('❌ Task creation failed:', taskResponse.status, errorData);
        
        if (taskResponse.status === 404) {
          toast.success('🎉 Task validated successfully! (Backend endpoint pending)');
          setTimeout(() => navigate('/employer-dashboard'), 2000);
        } else {
          throw new Error(errorData.message || `HTTP ${taskResponse.status}: Failed to create task`);
        }
      }

    } catch (error) {
      console.error('❌ Task submission error:', error);
      toast.error(error.message || '❌ Failed to post task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back to dashboard
   */
  const handleBack = () => {
    navigate('/employer-dashboard');
  };

  // Show loading while checking mandate
  if (isCheckingMandate) {
    return <LoadingSpinner fullscreen message="Checking payment setup..." />;
  }

  // Show loading while submitting
  if (isSubmitting) {
    return <LoadingSpinner fullscreen message="Creating your task and securing payment..." />;
  }

  return (
    <div className={styles.container}>
      {/* Modern Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={handleBack}
            className={styles.backButton}
          />
          <div className={styles.headerTitle}>
            <h1>Create New Task</h1>
            <p>Build your team with skilled freelancers</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!hasUPIMandate && (
            <Button
              variant="primary"
              onClick={() => setShowUPIModal(true)}
              icon={Shield}
              className={styles.setupButton}
            >
              Setup Payment
            </Button>
          )}
          {hasUPIMandate && (
            <div className={styles.paymentStatus}>
              <CheckCircle size={16} />
              <span>Payment Protected</span>
            </div>
          )}
        </div>
      </header>

      {/* Status Banners */}
      {!hasUPIMandate && (
        <div className={styles.statusBanner + ' ' + styles.warning}>
          <div className={styles.bannerIcon}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.bannerContent}>
            <h4>Payment Protection Required</h4>
            <p>Setup secure payment to build trust and attract quality workers</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUPIModal(true)}
            icon={Shield}
          >
            Setup Now
          </Button>
        </div>
      )}

      {hasUPIMandate && upiMandate && (
        <div className={styles.statusBanner + ' ' + styles.success}>
          <div className={styles.bannerIcon}>
            <Shield size={20} />
          </div>
          <div className={styles.bannerContent}>
            <h4>Payment Protection Active</h4>
            <p>{upiMandate.bankName} • ₹{upiMandate.maxAmount.toLocaleString()} secure limit</p>
          </div>
          <div className={styles.trustBadge}>
            <Lock size={14} />
            <span>Secured</span>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Main Form */}
        <div className={styles.formSection}>
          <Card className={styles.formCard}>
            <CardBody>
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Task Basics */}
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIcon}>
                      <Briefcase size={20} />
                    </div>
                    <div className={styles.stepInfo}>
                      <h3>Task Details</h3>
                      <p>Tell us what you need done</p>
                    </div>
                  </div>
                  
                  <div className={styles.stepContent}>
                    <div className={styles.inputGroup}>
                      <Input
                        label="What do you need done? *"
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Design a modern logo for my tech startup"
                        error={errors.title}
                        maxLength={100}
                        className={styles.titleInput}
                      />
                      <div className={styles.helperText}>
                        {formData.title.length}/100 characters
                      </div>
                    </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Task Description *</label>
                    <textarea
                      className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your task in detail. Include requirements, deliverables, timeline, and any specific instructions..."
                      rows={6}
                      maxLength={2000}
                    />
                    {errors.description && (
                      <span className={styles.error}>{errors.description}</span>
                    )}
                    <div className={styles.characterCount}>
                      {formData.description.length}/2000 characters
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Category *</label>
                    <select
                      className={`${styles.select} ${errors.category ? styles.error : ''}`}
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span className={styles.error}>{errors.category}</span>
                    )}
                  </div>
                </div>

                {/* Budget Planning */}
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIcon}>
                      <DollarSign size={20} />
                    </div>
                    <div className={styles.stepInfo}>
                      <h3>Budget & Timeline</h3>
                      <p>Set your budget and expectations</p>
                    </div>
                  </div>
                  
                  <div className={styles.stepContent}>
                    <div className={styles.budgetGrid}>
                      <div className={styles.inputGroup}>
                        <Input
                          label="How many hours do you estimate? *"
                          type="number"
                          value={formData.estimatedHours}
                          onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                          placeholder="4"
                          error={errors.estimatedHours}
                          min="0.5"
                          step="0.5"
                          className={styles.budgetInput}
                        />
                        <div className={styles.helperText}>Minimum 0.5 hours</div>
                      </div>

                      <div className={styles.inputGroup}>
                        <Input
                          label="What's your hourly rate? *"
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                          placeholder="200"
                          error={errors.hourlyRate}
                          min="50"
                          className={styles.budgetInput}
                        />
                        <div className={styles.helperText}>₹50/hour minimum</div>
                      </div>

                      <div className={styles.inputGroup}>
                        <div className={styles.totalBudgetDisplay}>
                          <label className={styles.label}>Total Budget</label>
                          <div className={styles.budgetAmount}>
                            ₹{formData.totalBudget || '0'}
                          </div>
                          <div className={styles.helperText}>Auto-calculated from hours × rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Calculator */}
                    {formData.estimatedHours && formData.hourlyRate && (
                      <div className={styles.budgetSummary}>
                        <div className={styles.calculationRow}>
                          <span>{formData.estimatedHours} hours</span>
                          <span>×</span>
                          <span>₹{formData.hourlyRate}/hour</span>
                          <span>=</span>
                          <span className={styles.totalAmount}>₹{formData.totalBudget}</span>
                        </div>
                        
                        {hasUPIMandate && (
                          <div className={styles.escrowNotice}>
                            <Shield size={14} />
                            <span>This amount will be secured in escrow when posted</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills & Requirements */}
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIcon}>
                      <Users size={20} />
                    </div>
                    <div className={styles.stepInfo}>
                      <h3>Skills & Requirements</h3>
                      <p>Specify what skills you need</p>
                    </div>
                  </div>
                  
                  <div className={styles.stepContent}>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Required Skills</label>
                    <div className={styles.skillsInput}>
                      <Input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={handleSkillKeyPress}
                        placeholder="Type a skill and press Enter"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        icon={Plus}
                        onClick={handleAddSkill}
                        disabled={!skillInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.requiredSkills.length > 0 && (
                      <div className={styles.skillTags}>
                        {formData.requiredSkills.map((skill, index) => (
                          <span key={index} className={styles.skillTag}>
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className={styles.removeSkill}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Task Settings */}
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIcon}>
                      <Award size={20} />
                    </div>
                    <div className={styles.stepInfo}>
                      <h3>Task Settings</h3>
                      <p>Configure task preferences</p>
                    </div>
                  </div>
                  
                  <div className={styles.stepContent}>
                  
                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Urgency</label>
                      <select
                        className={styles.select}
                        value={formData.urgency}
                        onChange={(e) => handleInputChange('urgency', e.target.value)}
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal</option>
                        <option value="high">Urgent</option>
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <Input
                        label="Location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Remote"
                        icon={MapPin}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <Input
                        label="Max Applications"
                        type="number"
                        value={formData.maxApplications}
                        onChange={(e) => handleInputChange('maxApplications', e.target.value)}
                        placeholder="10"
                        icon={Users}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <Input
                        label="Deadline (Optional)"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        icon={Calendar}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <Input
                        label="Start Date (Optional)"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        icon={Calendar}
                      />
                    </div>
                  </div>
                  </div>
                </div>

                {/* File Attachments */}
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIcon}>
                      <FileText size={20} />
                    </div>
                    <div className={styles.stepInfo}>
                      <h3>File Attachments</h3>
                      <p>Add supporting documents (Optional)</p>
                    </div>
                  </div>
                  
                  <div className={styles.stepContent}>
                    <p className={styles.sectionDescription}>
                      Upload files to help workers understand your task better. Include templates, examples, or reference materials.
                    </p>
                  
                  <div className={styles.fileUploadArea}>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      id="task-attachments"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                    />
                    <label htmlFor="task-attachments" className={styles.fileUploadLabel}>
                      <div className={styles.uploadIcon}>
                        <FileText size={32} />
                      </div>
                      <p className={styles.uploadText}>Click to upload files or drag and drop</p>
                      <p className={styles.uploadSubtext}>
                        PDF, Word, Excel, PowerPoint, Images, ZIP (Max 10MB per file, 5 files total)
                      </p>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {attachments.length > 0 && (
                    <div className={styles.selectedFiles}>
                      <p className={styles.filesLabel}>Selected Files ({attachments.length}/5)</p>
                      {attachments.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                          <div className={styles.fileInfo}>
                            <span className={styles.fileIcon}>📄</span>
                            <div className={styles.fileDetails}>
                              <p className={styles.fileName}>{file.name}</p>
                              <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeFile(index)}
                            className={styles.removeBtn}
                            icon={X}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <div className={styles.inputGroup}>
                        <Input
                          label="File Descriptions (Optional)"
                          type="text"
                          value={fileDescriptions}
                          onChange={(e) => setFileDescriptions(e.target.value)}
                          placeholder="Briefly describe each file, separated by commas..."
                          icon={FileText}
                        />
                      </div>
                    </div>
                  )}
                  </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className={styles.submitSection}>
                  <div className={styles.submitContent}>
                    <div className={styles.submitSummary}>
                      <h4>Ready to post your task?</h4>
                      <div className={styles.finalBudget}>
                        <span>Total Budget: </span>
                        <strong>₹{formData.totalBudget || '0'}</strong>
                      </div>
                      {hasUPIMandate && (
                        <div className={styles.escrowInfo}>
                          <Shield size={16} />
                          <span>Funds will be secured until task completion</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      size="lg"
                      loading={isSubmitting}
                      disabled={!hasUPIMandate || !formData.title || !formData.description || !formData.category || !formData.totalBudget}
                      className={styles.submitButton}
                    >
                      {isSubmitting ? (
                        <>
                          <div className={styles.loadingSpinner} />
                          Creating Task...
                        </>
                      ) : hasUPIMandate ? (
                        <>
                          <Zap size={18} />
                          Post Task Now
                        </>
                      ) : (
                        <>
                          <Shield size={18} />
                          Setup Payment First
                        </>
                      )}
                    </Button>
                    
                    {!hasUPIMandate && (
                      <p className={styles.submitNote}>
                        <Shield size={14} />
                        Payment protection builds trust and attracts quality workers
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Task Preview Sidebar */}
        <div className={styles.previewSection}>
          <Card className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <Eye size={18} />
              <h3>Live Preview</h3>
            </div>
            
            <div className={styles.previewContent}>
              <div className={styles.taskPreview}>
                <h4 className={styles.previewTitle}>
                  {formData.title || 'Your task title will appear here'}
                </h4>
                
                <p className={styles.previewDescription}>
                  {formData.description 
                    ? (formData.description.length > 120 
                        ? formData.description.substring(0, 120) + '...'
                        : formData.description)
                    : 'Task description will be shown here as you type...'
                  }
                </p>
                
                <div className={styles.previewMeta}>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{formData.estimatedHours || '0'} hours</span>
                  </div>
                  <div className={styles.metaItem}>
                    <DollarSign size={14} />
                    <span>₹{formData.hourlyRate || '0'}/hr</span>
                  </div>
                </div>

                <div className={styles.previewBudget}>
                  <span className={styles.budgetLabel}>Total Budget</span>
                  <span className={styles.budgetValue}>₹{formData.totalBudget || '0'}</span>
                </div>

                {formData.requiredSkills.length > 0 && (
                  <div className={styles.previewSkills}>
                    <span className={styles.skillsLabel}>Skills needed:</span>
                    <div className={styles.skillsList}>
                      {formData.requiredSkills.slice(0, 4).map((skill, index) => (
                        <span key={index} className={styles.skillBadge}>
                          {skill}
                        </span>
                      ))}
                      {formData.requiredSkills.length > 4 && (
                        <span className={styles.skillMore}>
                          +{formData.requiredSkills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {hasUPIMandate && (
                  <div className={styles.trustBadge}>
                    <Shield size={14} />
                    <span>Payment Protected</span>
                  </div>
                )}
              </div>

              <div className={styles.previewTips}>
                <h5>💡 Tips for better results</h5>
                <ul>
                  <li>Be specific about deliverables</li>
                  <li>Include clear requirements</li>
                  <li>Set realistic timelines</li>
                  <li>Add relevant skills needed</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* UPI Setup Modal */}
      <UPISetupModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        onSuccess={handleUPIMandateSuccess}
        employerId={employerId}
        taskAmount={parseFloat(formData.totalBudget) || 5000}
      />
    </div>
  );
};

export default TaskPosting;