import axios from 'axios';

/**
 * Enhanced API Client Configuration
 * Handles all API communication with the NanoJobs backend including new Phase 3 endpoints
 * 
 * New features:
 * - Employer registration and management
 * - Task creation and management with AI analysis
 * - Application workflow
 * - Enhanced session management for both user types
 * - FIXED: Trial Task API initialization issues
 */

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Token management utilities for proper session isolation
const tokenUtils = {
  getToken: () => {
    // Try sessionStorage first (per-tab), fallback to localStorage (cross-tab)
    const sessionToken = sessionStorage.getItem('nanojobs_session_token');
    const localToken = localStorage.getItem('nanojobs_session_token');
    const token = sessionToken || localToken;
    
    if (token) {
      console.log('🔍 Token source:', sessionToken ? 'sessionStorage (this tab)' : 'localStorage (shared)');
    }
    
    return token;
  },
  setToken: (token) => {
    console.log('🔑 Setting session token for this tab');
    // Store in both for compatibility, but sessionStorage takes precedence
    sessionStorage.setItem('nanojobs_session_token', token);
    localStorage.setItem('nanojobs_session_token', token);
  },
  removeToken: () => {
    console.log('🗑️ Removing session token from this tab');
    // Remove from both storages
    sessionStorage.removeItem('nanojobs_session_token');
    localStorage.removeItem('nanojobs_session_token');
  }
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding authentication
apiClient.interceptors.request.use(
  (config) => {
    const sessionToken = tokenUtils.getToken();
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      tokenUtils.removeToken();
      localStorage.removeItem('nanojobs_worker_id');
      localStorage.removeItem('nanojobs_employer_id');
      window.dispatchEvent(new Event('auth-expired'));
    }
    
    return Promise.reject(error);
  }
);

/**
 * Enhanced Storage Utilities with dual session support
 */
export const storageUtils = {
  // Worker session management
  setWorkerSession: (sessionToken, workerId) => {
    tokenUtils.setToken(sessionToken);
    localStorage.setItem('nanojobs_worker_id', workerId);
    localStorage.removeItem('nanojobs_employer_id'); // Clear employer session
  },

  // Employer session management
  setEmployerSession: (sessionToken, employerId) => {
    tokenUtils.setToken(sessionToken);
    localStorage.setItem('nanojobs_employer_id', employerId);
    localStorage.removeItem('nanojobs_worker_id'); // Clear worker session
  },

  // Get current session (works for both user types)
  getSession: () => {
    return {
      sessionToken: tokenUtils.getToken(),
      workerId: localStorage.getItem('nanojobs_worker_id'),
      employerId: localStorage.getItem('nanojobs_employer_id')
    };
  },

  // Clear all session data
  clearSession: () => {
    tokenUtils.removeToken();
    localStorage.removeItem('nanojobs_worker_id');
    localStorage.removeItem('nanojobs_employer_id');
  },

  // Check if any user is logged in
  isLoggedIn: () => {
    const token = tokenUtils.getToken();
    const workerId = localStorage.getItem('nanojobs_worker_id');
    const employerId = localStorage.getItem('nanojobs_employer_id');
    return !!(token && (workerId || employerId));
  },

  // Get current user type
  getUserType: () => {
    const workerId = localStorage.getItem('nanojobs_worker_id');
    const employerId = localStorage.getItem('nanojobs_employer_id');
    
    if (workerId) return 'worker';
    if (employerId) return 'employer';
    return null;
  },

  // Quiz progress (worker-specific)
  saveQuizProgress: (progress) => {
    localStorage.setItem('nanojobs_quiz_progress', JSON.stringify(progress));
  },

  getQuizProgress: () => {
    const saved = localStorage.getItem('nanojobs_quiz_progress');
    return saved ? JSON.parse(saved) : null;
  },

  clearQuizProgress: () => {
    localStorage.removeItem('nanojobs_quiz_progress');
  },

  // Task filters and preferences
  saveTaskFilters: (filters) => {
    localStorage.setItem('nanojobs_task_filters', JSON.stringify(filters));
  },

  getTaskFilters: () => {
    const saved = localStorage.getItem('nanojobs_task_filters');
    return saved ? JSON.parse(saved) : {};
  },

  clearTaskFilters: () => {
    localStorage.removeItem('nanojobs_task_filters');
  }
};

/**
 * Utility functions for API responses (EXISTING + ENHANCED)
 */
export const apiUtils = {
  handleError: (error) => {
    if (error.response) {
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData.error || 'Request failed',
        message: errorData.message || 'An error occurred',
        status: error.response.status,
        details: errorData.details || null
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server. Please check your internet connection.',
        status: 0
      };
    } else {
      return {
        success: false,
        error: 'Unknown error',
        message: error.message || 'An unexpected error occurred',
        status: 0
      };
    }
  },

  formatSuccess: (data, message = 'Success') => {
    return {
      success: true,
      message,
      data
    };
  },

  isSuccess: (response) => {
    return response && response.success === true;
  },

  getErrorMessage: (response) => {
    if (!response) return 'Unknown error';
    return response.message || response.error || 'An error occurred';
  },

  // NEW: Extract AI analysis data from task responses
  extractAIAnalysis: (taskResponse) => {
    if (!taskResponse || !taskResponse.data || !taskResponse.data.aiAnalysis) {
      return null;
    }
    return taskResponse.data.aiAnalysis;
  },

  // NEW: Format task data for display
  formatTaskForDisplay: (task) => {
    return {
      ...task,
      hourlyRate: parseFloat(task.hourlyRate),
      totalBudget: parseFloat(task.totalBudget),
      estimatedHours: parseFloat(task.estimatedHours),
      createdAt: new Date(task.createdAt),
      deadline: task.deadline ? new Date(task.deadline) : null,
      startDate: task.startDate ? new Date(task.startDate) : null
    };
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  sendOTP: async (phone) => {
    const response = await apiClient.post('/auth/login', { phone });
    return response.data;
  },

  verifyOTP: async (sessionId, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { sessionId, otp });
    return response.data;
  },

  loginWithEmail: async (email, password) => {
    const response = await apiClient.post('/auth/login-email', { email, password });
    return response.data;
  },

  setPassword: async (phone, email, password, confirmPassword) => {
    const response = await apiClient.post('/auth/set-password', { 
      phone, 
      email, 
      password, 
      confirmPassword 
    });
    return response.data;
  },

  changePassword: async (email, currentPassword, newPassword, confirmPassword) => {
    const response = await apiClient.post('/auth/change-password', { 
      email, 
      currentPassword, 
      newPassword, 
      confirmPassword 
    });
    return response.data;
  },

  checkAuthStatus: async (sessionId) => {
    const response = await apiClient.get('/auth/status', { 
      params: { sessionId } 
    });
    return response.data;
  },

  logout: async (sessionId) => {
    const response = await apiClient.post('/auth/logout', { sessionId });
    return response.data;
  },

  // Development only login methods
  devLoginWorker: async (phone = '9876543210') => {
    const response = await apiClient.post('/auth/dev-login-worker', { phone });
    return response.data;
  },

  devLoginEmployer: async (phone = '9876543211') => {
    const response = await apiClient.post('/auth/dev-login-employer', { phone });
    return response.data;
  }
};

export const paymentAPI = {
  // UPI mandate management
  setupUPIMandate: async (employerId, upiId, bankName, maxAmount = 50000) => {
    console.log('📡 API Call: setupUPIMandate', { employerId, upiId, bankName });
    
    try {
      const response = await apiClient.post('/payments/setup-mandate', {
        employerId,
        upiId,
        bankName,
        maxAmount
      });
      console.log('✅ setupUPIMandate response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ setupUPIMandate error:', error);
      throw error;
    }
  },

  getEmployerMandates: async (employerId) => {
    console.log('📡 API Call: getEmployerMandates', employerId);
    
    try {
      const response = await apiClient.get(`/payments/mandates/${employerId}`);
      console.log('✅ getEmployerMandates response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getEmployerMandates error:', error);
      throw error;
    }
  },

  // Payment escrow and release
  lockPaymentInEscrow: async (taskId, employerId, amount) => {
    console.log('📡 API Call: lockPaymentInEscrow', { taskId, employerId, amount });
    
    try {
      const response = await apiClient.post('/payments/escrow', {
        taskId,
        employerId,
        amount
      });
      console.log('✅ lockPaymentInEscrow response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ lockPaymentInEscrow error:', error);
      throw error;
    }
  },

  releasePaymentToWorker: async (taskId, workerId, workerUpiId, rating = 5, feedback = '') => {
    console.log('📡 API Call: releasePaymentToWorker', { taskId, workerId, workerUpiId });
    
    try {
      const response = await apiClient.post('/payments/release', {
        taskId,
        workerId,
        workerUpiId,
        rating,
        feedback
      });
      console.log('✅ releasePaymentToWorker response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ releasePaymentToWorker error:', error);
      throw error;
    }
  },

  // Payment status and history
  getPaymentStatus: async (taskId) => {
    console.log('📡 API Call: getPaymentStatus', taskId);
    
    try {
      const response = await apiClient.get(`/payments/status/${taskId}`);
      console.log('✅ getPaymentStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getPaymentStatus error:', error);
      throw error;
    }
  },

  getPaymentHistory: async (employerId, filters = {}) => {
    console.log('📡 API Call: getPaymentHistory', { employerId, filters });
    
    try {
      const response = await apiClient.get(`/payments/history/${employerId}`, { 
        params: filters 
      });
      console.log('✅ getPaymentHistory response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getPaymentHistory error:', error);
      throw error;
    }
  },

  // Utility endpoints
  getIndianBanks: async () => {
    console.log('📡 API Call: getIndianBanks');
    
    try {
      const response = await apiClient.get('/payments/banks');
      console.log('✅ getIndianBanks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getIndianBanks error:', error);
      // Return fallback banks if API fails
      return {
        success: true,
        data: {
          banks: [
            { code: 'SBI', name: 'State Bank of India', upiHandle: 'sbi' },
            { code: 'HDFC', name: 'HDFC Bank', upiHandle: 'hdfc' },
            { code: 'ICICI', name: 'ICICI Bank', upiHandle: 'icici' },
            { code: 'AXIS', name: 'Axis Bank', upiHandle: 'axis' },
            { code: 'KOTAK', name: 'Kotak Mahindra Bank', upiHandle: 'kotak' },
            { code: 'PAYTM', name: 'Paytm Payments Bank', upiHandle: 'paytm' }
          ]
        }
      };
    }
  },

  // Auto-escrow for task creation
  autoEscrowPayment: async (taskId, amount) => {
    console.log('📡 API Call: autoEscrowPayment', { taskId, amount });
    
    try {
      const response = await apiClient.post('/payments/auto-escrow', {
        taskId,
        amount
      });
      console.log('✅ autoEscrowPayment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ autoEscrowPayment error:', error);
      throw error;
    }
  },

  // Refund payment (for cancelled tasks)
  refundPayment: async (taskId, reason = '') => {
    console.log('📡 API Call: refundPayment', { taskId, reason });
    
    try {
      const response = await apiClient.post('/payments/refund', {
        taskId,
        reason
      });
      console.log('✅ refundPayment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ refundPayment error:', error);
      throw error;
    }
  }
};

/**
 * Enhanced Trial Task API - PRODUCTION READY
 * Complete integration with the new trial task system
 */
export const trialTaskAPI = {
  /**
   * Get available trial tasks with enhanced data
   */
  getTrialTasks: async (options = {}) => {
    console.log('📋 Getting trial tasks:', options);
    
    try {
      const params = {};
      if (options.category) params.category = options.category;
      if (options.includeAnalytics !== undefined) params.includeAnalytics = options.includeAnalytics;
      if (options.workerId) params.workerId = options.workerId;
      
      // Use the new dedicated endpoint
      const response = await apiClient.get('/trial-tasks', { params });
      
      if (apiUtils.isSuccess(response.data)) {
        const tasks = response.data.data.trialTasks || [];
        console.log(`✅ Loaded ${tasks.length} trial tasks`);
        
        // Add frontend-friendly enhancements
        const enhancedTasks = tasks.map(task => ({
          ...task,
          // Add display properties
          displayDuration: trialTaskUtils.formatDuration(task.timeLimit),
          displayPay: `₹${task.payAmount}`,
          difficultyColor: trialTaskUtils.getDifficultyColor(task.difficulty),
          categoryIcon: trialTaskUtils.getCategoryIcon(task.category),
          estimatedEarning: `₹${task.payAmount}`,
          // Add completion status
          completionStatus: trialTaskUtils.getTaskCompletionStatus(task.id),
          // Add progress indicators
          progressIndicator: trialTaskUtils.getProgressIndicator(task)
        }));
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            trialTasks: enhancedTasks
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get trial tasks:', error);
      throw trialTaskUtils.enhanceError(error, 'Failed to load trial tasks');
    }
  },

  /**
   * Submit trial task work with enhanced payload
   */
  submitTrialTask: async (taskId, workerData, submittedWork, timeSpent, additionalMetrics = {}) => {
    console.log('📤 Submitting trial task:', { taskId, timeSpent });
    
    try {
      // Enhanced validation
      const validation = trialTaskUtils.validateSubmission(taskId, submittedWork, timeSpent);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get session info for proper worker ID handling
      const session = storageUtils.getSession();
      
      // Prepare enhanced payload
      const payload = {
        workerId: trialTaskUtils.determineWorkerId(session, workerData),
        workerData: trialTaskUtils.sanitizeWorkerData(workerData),
        submittedWork: trialTaskUtils.enhanceSubmittedWork(submittedWork, additionalMetrics),
        timeSpent: Math.max(timeSpent || 0, 1), // Ensure minimum 1 minute
        performanceMetrics: {
          ...additionalMetrics,
          submissionTime: new Date().toISOString(),
          browserInfo: trialTaskUtils.getBrowserInfo()
        }
      };

      console.log('📤 Sending submission payload:', {
        taskId,
        workerId: payload.workerId,
        workDataKeys: Object.keys(payload.submittedWork),
        timeSpent: payload.timeSpent
      });

      // Use the new dedicated endpoint
      const response = await apiClient.post(`/trial-tasks/${taskId}/submit`, payload);

      if (apiUtils.isSuccess(response.data)) {
        const result = response.data.data;
        
        // Store submission locally for progress tracking
        trialTaskUtils.storeSubmissionLocally(taskId, result);
        
        // Add enhanced response data
        const enhancedResult = {
          ...result,
          // Add frontend-friendly properties
          scoreBreakdown: trialTaskUtils.formatScoreBreakdown(result.evaluation),
          performanceTier: trialTaskUtils.getPerformanceTier(result.evaluation),
          nextSteps: trialTaskUtils.generateNextSteps(result.evaluation),
          badgeImpact: trialTaskUtils.calculateBadgeImpact(result.evaluation)
        };

        console.log('✅ Trial task submitted successfully:', {
          passed: result.evaluation.passed,
          overallScore: result.evaluation.overallScore
        });

        return {
          ...response.data,
          data: enhancedResult
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit trial task:', error);
      throw trialTaskUtils.enhanceError(error, 'Failed to submit trial task');
    }
  },

  /**
   * Get real-time feedback for ongoing trial task
   */
  getTrialTaskFeedback: async (taskId, workerId, includeHints = false) => {
    console.log('💬 Getting trial task feedback:', { taskId, includeHints });
    
    try {
      const params = { workerId };
      if (includeHints) params.includeHints = true;

      const response = await apiClient.get(`/trial-tasks/${taskId}/feedback`, { params });
      
      if (apiUtils.isSuccess(response.data)) {
        const feedback = response.data.data;
        
        // Enhance feedback with frontend-friendly data
        return {
          ...response.data,
          data: {
            ...feedback,
            // Add visual enhancements
            difficultyIndicator: trialTaskUtils.getDifficultyIndicator(feedback.difficulty),
            timeIndicator: trialTaskUtils.getTimeIndicator(feedback.timeLimit),
            categoryInfo: trialTaskUtils.getCategoryInfo(feedback.category)
          }
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get trial task feedback:', error);
      // Return helpful fallback feedback
      return {
        success: true,
        data: trialTaskUtils.getDefaultFeedback(taskId),
        source: 'fallback'
      };
    }
  },

  /**
   * Get trial task submissions for worker with analytics
   */
  getTrialTaskSubmissions: async (workerId, options = {}) => {
    console.log('📊 Getting trial task submissions:', { workerId, options });
    
    try {
      const params = {
        includeAnalytics: options.includeAnalytics !== false,
        includeRecommendations: options.includeRecommendations !== false
      };

      const response = await apiClient.get(`/trial-tasks/submissions/${workerId}`, { params });
      
      if (apiUtils.isSuccess(response.data)) {
        const data = response.data.data;
        
        // Enhance submissions data
        const enhancedSubmissions = data.submissions?.map(sub => ({
          ...sub,
          // Add display properties
          scoreDisplay: trialTaskUtils.formatScoreDisplay(sub.scores),
          timeDisplay: trialTaskUtils.formatTimeDisplay(sub.timeSpent),
          statusBadge: trialTaskUtils.getStatusBadge(sub.passed)
        })) || [];
        
        return {
          ...response.data,
          data: {
            ...data,
            submissions: enhancedSubmissions
          }
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get trial submissions:', error);
      // Return local progress as fallback
      return trialTaskUtils.getLocalProgress(workerId);
    }
  },

  /**
   * Get system analytics and statistics
   */
  getSystemAnalytics: async () => {
    console.log('📈 Getting system analytics');
    
    try {
      const response = await apiClient.get('/trial-tasks/analytics');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get system analytics:', error);
      throw trialTaskUtils.enhanceError(error, 'Failed to get system analytics');
    }
  },

  /**
   * Health check for trial task system
   */
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/trial-tasks/health');
      return response.data;
    } catch (error) {
      console.error('❌ Trial task system health check failed:', error);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
};

/**
 * Worker API
 */
export const workerAPI = {
  registerWithResume: async (formData) => {
    const response = await apiClient.post('/workers/register-with-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000
    });
    return response.data;
  },

  registerWithQuiz: async (workerData) => {
    const response = await apiClient.post('/workers/register-with-quiz', workerData, {
      timeout: 45000
    });
    return response.data;
  },

  getQuizQuestions: async (category = null) => {
    const response = await apiClient.get('/workers/quiz-questions', {
      params: category ? { category } : {}
    });
    return response.data;
  },

  getProfile: async (workerId) => {
    const response = await apiClient.get(`/workers/${workerId}`);
    return response.data;
  },

  updateProfile: async (workerId, updates) => {
    const response = await apiClient.put(`/workers/${workerId}`, updates);
    return response.data;
  },

  getAllWorkers: async (filters = {}) => {
    const response = await apiClient.get('/workers', { params: filters });
    return response.data;
  },

  verifySession: async (token) => {
    const response = await apiClient.get('/workers/verify-session', { 
      params: { token } 
    });
    return response.data;
  },

  getWorkerStats: async (workerId) => {
    const response = await apiClient.get(`/workers/${workerId}/stats`);
    return response.data;
  },

  getBadgeInfo: async () => {
    const response = await apiClient.get('/workers/badges');
    return response.data;
  },

  getTaskCategories: async () => {
    const response = await apiClient.get('/workers/task-categories');
    return response.data;
  },

  /**
   * Register worker with trial tasks (Simple Form Path)
   */
  registerWithTrialTasks: async (workerData) => {
    console.log('📡 API Call: registerWithTrialTasks', workerData);
    
    try {
      const response = await apiClient.post('/workers/register-with-trial-tasks', workerData, {
        timeout: 45000 // Allow time for evaluation
      });
      console.log('✅ registerWithTrialTasks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ registerWithTrialTasks error:', error);
      throw error;
    }
  },

  // DEPRECATED: Use trialTaskAPI.getTrialTasks() instead
  getTrialTasks: async (category = null) => {
    console.warn('⚠️ DEPRECATED: Use trialTaskAPI.getTrialTasks() instead');
    return trialTaskAPI.getTrialTasks({ category });
  },

  // DEPRECATED: Use trialTaskAPI.submitTrialTask() instead
  submitTrialTask: async (taskId, workerData, submittedWork, timeSpent) => {
    console.warn('⚠️ DEPRECATED: Use trialTaskAPI.submitTrialTask() instead');
    return trialTaskAPI.submitTrialTask(taskId, workerData, submittedWork, timeSpent);
  },

  // DEPRECATED: Use trialTaskAPI.getTrialTaskSubmissions() instead
  getTrialTaskSubmissions: async (workerId) => {
    console.warn('⚠️ DEPRECATED: Use trialTaskAPI.getTrialTaskSubmissions() instead');
    return trialTaskAPI.getTrialTaskSubmissions(workerId);
  },

  // Get worker applications (wrapper for taskAPI function)
  getApplications: async (workerId, filters = {}) => {
    console.log('📡 API Call: workerAPI.getApplications', { workerId, filters });
    try {
      // Use the existing taskAPI function for worker applications
      return await taskAPI.getWorkerApplications(workerId, filters);
    } catch (error) {
      console.error('❌ workerAPI.getApplications error:', error);
      throw error;
    }
  }
};

/**
 * Employer API (NEW FOR PHASE 3)
 */
export const employerAPI = {
  // Registration and profile management
  register: async (employerData) => {
    const response = await apiClient.post('/employers/register', employerData);
    return response.data;
  },

  getProfile: async (employerId) => {
    const response = await apiClient.get(`/employers/${employerId}`);
    return response.data;
  },

  updateProfile: async (employerId, updates) => {
    const response = await apiClient.put(`/employers/${employerId}`, updates);
    return response.data;
  },

  getStats: async (employerId) => {
    const response = await apiClient.get(`/employers/${employerId}/stats`);
    return response.data;
  },

  // Verification (admin)
  verifyEmployer: async (employerId, verified, note) => {
    const response = await apiClient.post(`/employers/${employerId}/verify`, {
      verified,
      verificationNote: note
    });
    return response.data;
  },

  // Get all employers (admin)
  getAllEmployers: async (filters = {}) => {
    const response = await apiClient.get('/employers', { params: filters });
    return response.data;
  },

  // Configuration endpoints
  getEmployerTypes: async () => {
    const response = await apiClient.get('/employers/config/employer-types');
    return response.data;
  },

  getBusinessCategories: async () => {
    const response = await apiClient.get('/employers/config/business-categories');
    return response.data;
  },

  // Session verification
  verifySession: async (token) => {
    const response = await apiClient.get('/employers/verify-session', { 
      params: { token } 
    });
    return response.data;
  }
};

/**
 * Task API - Updated for Real Backend Integration
 */
export const taskAPI = {
  // Get marketplace tasks with proper backend integration
  // Replace the getMarketplaceTasks function in api.js with this FIXED version:

// Get marketplace tasks with proper backend integration
getMarketplaceTasks: async (workerId, searchQuery = '', filters = {}) => {
  console.log('📡 API Call: getMarketplaceTasks', { workerId, searchQuery, filters });
  
  const params = {
    workerId,
    page: 1,
    limit: 20
  };
  
  if (searchQuery && searchQuery.trim()) {
    params.search = searchQuery.trim();
  }
  
  // Only add filter parameters that have actual values
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      if (typeof value === 'boolean') {
        params[key] = value;
      } else if (key.includes('Rate') || key.includes('Budget') || key.includes('Hours')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
          params[key] = numValue;
        }
      } else if (typeof value === 'string' && value.trim() !== '') {
        params[key] = value.trim();
      }
    }
  });

  console.log('📡 Cleaned API params:', params);
  
  try {
    // Try bronze tasks first if business focus is enabled
    if (filters.businessFocus) {
      const response = await apiClient.get('/bronze-tasks/all', { params });
      console.log('✅ API Response received (bronze tasks):', response.data);
      return response.data;
    } else {
      const response = await apiClient.get('/tasks', { params });
      console.log('✅ API Response received (general tasks):', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('❌ API Error in getMarketplaceTasks:', error);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Backend server is not running. Please start the server on port 5001.');
    } else if (error.response?.status === 404) {
      throw new Error('Tasks API endpoint not found. Please check backend routes.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 400) {
      const details = error.response?.data?.details || [];
      const errorMessages = details.map(d => d.msg).join(', ');
      throw new Error(`Validation error: ${errorMessages || 'Invalid request parameters'}`);
    } else {
      throw error;
    }
  }
},
  // Get all tasks (with optional filters) - Matches your backend GET /api/tasks
  getTasks: async (filters = {}) => {
    console.log('📡 API Call: getTasks', filters);
    
    try {
      const response = await apiClient.get('/tasks', { params: filters });
      console.log('✅ getTasks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTasks error:', error);
      throw error;
    }
  },

  // Get single task details - Matches your backend GET /api/tasks/:id
  getTask: async (taskId, workerId = null) => {
    console.log('📡 API Call: getTask', { taskId, workerId });
    
    const params = {};
    if (workerId) {
      params.workerId = workerId; // For compatibility scoring
    }
    
    try {
      const response = await apiClient.get(`/tasks/${taskId}`, { params });
      console.log('✅ getTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTask error:', error);
      throw error;
    }
  },

  // Create new task - Matches your backend POST /api/tasks
  createTask: async (taskData) => {
    console.log('📡 API Call: createTask', taskData);
    
    try {
      const response = await apiClient.post('/tasks', taskData, {
        timeout: 45000 // Allow time for AI analysis
      });
      console.log('✅ createTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createTask error:', error);
      throw error;
    }
  },

  // Apply for task - Matches your backend POST /api/tasks/:id/apply
  applyForTask: async (taskId, workerId, message, proposedRate = null) => {
    console.log('📡 API Call: applyForTask', { taskId, workerId, message });
    
    const payload = {
      workerId,
      message: message || `I'm interested in working on this task. I have the required skills and experience.`
    };
    
    if (proposedRate) {
      payload.proposedRate = proposedRate;
    }
    
    try {
      const response = await apiClient.post(`/tasks/${taskId}/apply`, payload);
      console.log('✅ applyForTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ applyForTask error:', error);
      throw error;
    }
  },

  // Update application status - Matches your backend PUT /api/tasks/:taskId/applications/:applicationId
  updateApplicationStatus: async (taskId, applicationId, status, note = null) => {
    console.log('📡 API Call: updateApplicationStatus', { taskId, applicationId, status });
    
    const payload = { status };
    if (note) {
      payload.note = note;
    }
    
    try {
      const response = await apiClient.put(`/tasks/${taskId}/applications/${applicationId}`, payload);
      console.log('✅ updateApplicationStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ updateApplicationStatus error:', error);
      throw error;
    }
  },

  // Get employer tasks - Matches your backend GET /api/tasks/employer/:employerId
  getEmployerTasks: async (employerId, filters = {}) => {
    console.log('📡 API Call: getEmployerTasks', { employerId, filters });
    
    try {
      const response = await apiClient.get(`/tasks/employer/${employerId}`, { 
        params: filters 
      });
      console.log('✅ getEmployerTasks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getEmployerTasks error:', error);
      throw error;
    }
  },

  // Get worker applications - Matches your backend GET /api/tasks/worker/:workerId/applications
  getWorkerApplications: async (workerId, filters = {}) => {
    console.log('📡 API Call: getWorkerApplications', { workerId, filters });
    
    try {
      const response = await apiClient.get(`/tasks/worker/${workerId}/applications`, { 
        params: filters 
      });
      console.log('✅ getWorkerApplications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getWorkerApplications error:', error);
      throw error;
    }
  },

  // Get task categories - Matches your backend GET /api/tasks/categories/list
  getCategories: async () => {
    console.log('📡 API Call: getCategories');
    
    try {
      const response = await apiClient.get('/tasks/categories/list');
      console.log('✅ getCategories response:', response.data);
      
      // Transform backend format to frontend format if needed
      if (response.data.success && response.data.data.categories) {
        return {
          ...response.data,
          data: {
            categories: response.data.data.categories.map(cat => ({
              value: cat.id, // Backend uses 'id', frontend expects 'value'
              label: cat.name, // Backend uses 'name', frontend expects 'label'
              description: cat.description,
              avgRate: cat.averageRate,
              badgeRequired: cat.badgeRequired,
              taskCount: cat.taskCount
            }))
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ getCategories error:', error);
      throw error;
    }
  },

  // Update task - Matches your backend PUT /api/tasks/:id (if implemented)
  updateTask: async (taskId, updates) => {
    console.log('📡 API Call: updateTask', { taskId, updates });
    
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, updates);
      console.log('✅ updateTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ updateTask error:', error);
      throw error;
    }
  },

  getBronzeTasksByCategory: async (category, filters = {}) => {
    console.log('📡 API Call: getBronzeTasksByCategory', { category, filters });
    
    // Clean up filters to only send non-empty values
    const cleanedFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (typeof value === 'boolean' && value === true) {
          cleanedFilters[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          cleanedFilters[key] = value.trim();
        } else if ((key.includes('Rate') || key.includes('Budget')) && !isNaN(parseFloat(value))) {
          cleanedFilters[key] = parseFloat(value);
        }
      }
    });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${category}`, { 
        params: cleanedFilters 
      });
      console.log('✅ getBronzeTasksByCategory response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBronzeTasksByCategory error:', error);
      throw error;
    }
  },

  getBronzeTaskApplications: async (taskId, filters = {}) => {
    console.log('📡 API Call: getBronzeTaskApplications', { taskId, filters });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/applications`, { 
        params: filters 
      });
      console.log('✅ getBronzeTaskApplications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBronzeTaskApplications error:', error);
      throw error;
    }
  },

  updateBronzeTaskApplicationStatus: async (taskId, applicationId, status, note = '') => {
    console.log('📡 API Call: updateBronzeTaskApplicationStatus', { taskId, applicationId, status });
    
    try {
      const response = await apiClient.put(`/bronze-tasks/${taskId}/applications/${applicationId}/status`, {
        status,
        note
      });
      console.log('✅ updateBronzeTaskApplicationStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ updateBronzeTaskApplicationStatus error:', error);
      throw error;
    }
  },

  completeBronzeTask: async (taskId, workerId, rating = 5, feedback = '') => {
    console.log('📡 API Call: completeBronzeTask', { taskId, workerId, rating });
    
    try {
      const response = await apiClient.post(`/bronze-tasks/${taskId}/complete`, {
        workerId,
        rating,
        feedback
      });
      console.log('✅ completeBronzeTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ completeBronzeTask error:', error);
      throw error;
    }
  },

  getWhatsAppConnection: async (taskId) => {
    console.log('📡 API Call: getWhatsAppConnection', taskId);
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/whatsapp`);
      console.log('✅ getWhatsAppConnection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getWhatsAppConnection error:', error);
      throw error;
    }
  },

  getBusinessSupportCategories: async () => {
    console.log('📡 API Call: getBusinessSupportCategories');
    
    try {
      const response = await apiClient.get('/bronze-tasks/categories');
      console.log('✅ getBusinessSupportCategories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBusinessSupportCategories error:', error);
      
      // Return fallback categories if API fails
      return {
        success: true,
        data: {
          categories: [
            {
              id: 'data-entry',
              name: 'Data Entry & Organization',
              description: 'Digital data input, spreadsheet management, and database organization',
              taskCount: 0
            },
            {
              id: 'content-creation',
              name: 'Content & Communication',
              description: 'Business content writing, social media, and customer communication',
              taskCount: 0
            },
            {
              id: 'customer-service',
              name: 'Customer Service & Research',
              description: 'Customer support, lead generation, and market research tasks',
              taskCount: 0
            },
            {
              id: 'basic-design',
              name: 'Basic Design & Visual Content',
              description: 'Simple graphic design using tools like Canva for business needs',
              taskCount: 0
            },
            {
              id: 'basic-finance',
              name: 'Basic Finance & Admin',
              description: 'Simple bookkeeping, invoicing, and administrative tasks',
              taskCount: 0
            },
            {
              id: 'research-analysis',
              name: 'Research & Analysis',
              description: 'Information gathering, competitor research, and basic analysis',
              taskCount: 0
            }
          ],
          businessFocus: true
        }
      };
    }
  },

  getBronzeTasksByCategory: async (category, filters = {}) => {
    console.log('📡 API Call: getBronzeTasksByCategory', { category, filters });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${category}`, { 
        params: filters 
      });
      console.log('✅ getBronzeTasksByCategory response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBronzeTasksByCategory error:', error);
      throw error;
    }
  },

  applyForBronzeTask: async (taskId, workerId, message = '') => {
    console.log('📡 API Call: applyForBronzeTask', { taskId, workerId });
    
    try {
      const response = await apiClient.post(`/bronze-tasks/${taskId}/apply`, {
        workerId,
        message: message || `I'm interested in this business support task and believe I have the necessary skills to complete it successfully.`
      });
      console.log('✅ applyForBronzeTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ applyForBronzeTask error:', error);
      throw error;
    }
  },

  getWorkerBronzeTaskApplications: async (workerId, filters = {}) => {
    console.log('📡 API Call: getWorkerBronzeTaskApplications', { workerId, filters });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/worker/${workerId}/applications`, { 
        params: filters 
      });
      console.log('✅ getWorkerBronzeTaskApplications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getWorkerBronzeTaskApplications error:', error);
      throw error;
    }
  },

  getWorkerBronzeTaskMetrics: async (workerId, category = null) => {
    console.log('📡 API Call: getWorkerBronzeTaskMetrics', { workerId, category });
    
    const params = {};
    if (category) params.category = category;
    
    try {
      const response = await apiClient.get(`/bronze-tasks/worker/${workerId}/metrics`, { 
        params 
      });
      console.log('✅ getWorkerBronzeTaskMetrics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getWorkerBronzeTaskMetrics error:', error);
      throw error;
    }
  },

  createBronzeTask: async (taskData) => {
    console.log('📡 API Call: createBronzeTask', taskData);
    
    try {
      const response = await apiClient.post('/bronze-tasks', taskData);
      console.log('✅ createBronzeTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createBronzeTask error:', error);
      throw error;
    }
  },

  getEmployerBronzeTaskDashboard: async (employerId) => {
    console.log('📡 API Call: getEmployerBronzeTaskDashboard', employerId);
    
    try {
      const response = await apiClient.get(`/bronze-tasks/employer/${employerId}/dashboard`);
      console.log('✅ getEmployerBronzeTaskDashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getEmployerBronzeTaskDashboard error:', error);
      throw error;
    }
  },

  getWorkerBronzeTaskDashboard: async (workerId) => {
    console.log('📡 API Call: getWorkerBronzeTaskDashboard', workerId);
    
    try {
      const response = await apiClient.get(`/bronze-tasks/worker/${workerId}/dashboard`);
      console.log('✅ getWorkerBronzeTaskDashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getWorkerBronzeTaskDashboard error:', error);
      throw error;
    }
  },

  // Basic Worker Registration APIs
  registerBasicWorker: async (formData) => {
    console.log('📡 API Call: registerBasicWorker');
    
    try {
      const response = await fetch('/api/basic-workers/register-basic', {
        method: 'POST',
        body: formData // FormData for file upload
      });
      const result = await response.json();
      console.log('✅ registerBasicWorker response:', result);
      return result;
    } catch (error) {
      console.error('❌ registerBasicWorker error:', error);
      throw error;
    }
  },

  getBasicWorkerProfile: async (workerId) => {
    console.log('📡 API Call: getBasicWorkerProfile', workerId);
    
    try {
      const response = await apiClient.get(`/basic-workers/${workerId}/profile`);
      console.log('✅ getBasicWorkerProfile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBasicWorkerProfile error:', error);
      throw error;
    }
  },

  getBadgeCategories: async () => {
    console.log('📡 API Call: getBadgeCategories');
    
    try {
      const response = await apiClient.get('/basic-workers/badge-categories');
      console.log('✅ getBadgeCategories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBadgeCategories error:', error);
      throw error;
    }
  },

  bulkAcceptApplications: async (applicationIds) => {
    console.log('📡 API Call: bulkAcceptApplications', applicationIds);
    
    try {
      const response = await apiClient.post('/bronze-tasks/bulk/accept-applications', {
        applicationIds
      });
      console.log('✅ bulkAcceptApplications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ bulkAcceptApplications error:', error);
      throw error;
    }
  },

  sendWhatsAppWebhook: async (event, taskId, message, sender) => {
    console.log('📡 API Call: sendWhatsAppWebhook', { event, taskId, sender });
    
    try {
      const response = await apiClient.post('/bronze-tasks/webhooks/whatsapp', {
        event,
        taskId,
        message,
        sender
      });
      console.log('✅ sendWhatsAppWebhook response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sendWhatsAppWebhook error:', error);
      throw error;
    }
  },

  checkBronzeTaskHealth: async () => {
    console.log('📡 API Call: checkBronzeTaskHealth');
    
    try {
      const response = await apiClient.get('/bronze-tasks/health');
      console.log('✅ checkBronzeTaskHealth response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ checkBronzeTaskHealth error:', error);
      throw error;
    }
  },
  
  
  // Delete task - Matches your backend DELETE /api/tasks/:id (if implemented)
  deleteTask: async (taskId) => {
    console.log('📡 API Call: deleteTask', taskId);
    
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      console.log('✅ deleteTask response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ deleteTask error:', error);
      throw error;
    }
  },

  // NEW: Enhanced Task Detail APIs
  
  // Get detailed task information with attachments and submissions
  getBronzeTaskDetails: async (taskId) => {
    console.log('📡 API Call: getBronzeTaskDetails', { taskId });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/details`);
      console.log('✅ getBronzeTaskDetails response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBronzeTaskDetails error:', error);
      throw error;
    }
  },

  // Download task attachment file
  downloadTaskAttachment: async (taskId, attachmentId) => {
    console.log('📡 API Call: downloadTaskAttachment', { taskId, attachmentId });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/attachments/${attachmentId}/download`, {
        responseType: 'blob' // Important for file downloads
      });
      console.log('✅ downloadTaskAttachment response received');
      return response.data;
    } catch (error) {
      console.error('❌ downloadTaskAttachment error:', error);
      throw error;
    }
  },

  // Submit work for a task
  createTaskSubmission: async (applicationId, formData) => {
    console.log('📡 API Call: createTaskSubmission', { applicationId });
    
    try {
      const response = await apiClient.post(`/task-submissions/${applicationId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ createTaskSubmission response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createTaskSubmission error:', error);
      throw error;
    }
  },

  // Get submission details
  getTaskSubmission: async (submissionId, userId) => {
    console.log('📡 API Call: getTaskSubmission', { submissionId, userId });
    
    try {
      const response = await apiClient.get(`/task-submissions/${submissionId}?userId=${userId}`);
      console.log('✅ getTaskSubmission response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTaskSubmission error:', error);
      throw error;
    }
  },

  // Review submission (Employer only)
  reviewTaskSubmission: async (submissionId, reviewData, userId) => {
    console.log('📡 API Call: reviewTaskSubmission', { submissionId, reviewData });
    
    try {
      const response = await apiClient.put(`/task-submissions/${submissionId}/review?userId=${userId}`, reviewData);
      console.log('✅ reviewTaskSubmission response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ reviewTaskSubmission error:', error);
      throw error;
    }
  },

  // Download submission file
  downloadSubmissionFile: async (submissionId, fileId, userId) => {
    console.log('📡 API Call: downloadSubmissionFile', { submissionId, fileId });
    
    try {
      const response = await apiClient.get(`/task-submissions/${submissionId}/files/${fileId}/download?userId=${userId}`, {
        responseType: 'blob'
      });
      console.log('✅ downloadSubmissionFile response received');
      return response.data;
    } catch (error) {
      console.error('❌ downloadSubmissionFile error:', error);
      throw error;
    }
  },

  // Get submissions for a task (Employer view)
  getTaskSubmissions: async (taskId, userId, status = null) => {
    console.log('📡 API Call: getTaskSubmissions', { taskId, userId, status });
    
    const params = { userId };
    if (status) params.status = status;
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/submissions`, { params });
      console.log('✅ getTaskSubmissions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTaskSubmissions error:', error);
      throw error;
    }
  },

  // Upload task attachments (Employer only - can be done anytime)
  uploadTaskAttachments: async (taskId, formData) => {
    console.log('📡 API Call: uploadTaskAttachments', { taskId });
    
    try {
      const response = await apiClient.post(`/bronze-tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ uploadTaskAttachments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ uploadTaskAttachments error:', error);
      throw error;
    }
  },

  // CHAT API FUNCTIONS
  
  // Get or create chat for a task
  getTaskChat: async (taskId) => {
    console.log('📡 API Call: getTaskChat', { taskId });
    
    try {
      const response = await apiClient.get(`/bronze-tasks/${taskId}/chat`);
      console.log('✅ getTaskChat response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTaskChat error:', error);
      throw error;
    }
  },

  // Send a message in task chat
  sendChatMessage: async (taskId, content, messageType = 'text') => {
    console.log('📡 API Call: sendChatMessage', { taskId, content, messageType });
    
    try {
      const response = await apiClient.post(`/bronze-tasks/${taskId}/chat/messages`, {
        content,
        messageType
      });
      console.log('✅ sendChatMessage response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sendChatMessage error:', error);
      throw error;
    }
  },

  // Mark messages as read
  markChatMessagesAsRead: async (taskId) => {
    console.log('📡 API Call: markChatMessagesAsRead', { taskId });
    
    try {
      const response = await apiClient.put(`/bronze-tasks/${taskId}/chat/read`);
      console.log('✅ markChatMessagesAsRead response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ markChatMessagesAsRead error:', error);
      throw error;
    }
  }
};

/**
 * Rating API - Star-based mutual rating system
 */
export const ratingAPI = {
  // Submit a rating for a completed task
  submitRating: async (applicationId, stars) => {
    console.log('📡 API Call: submitRating', { applicationId, stars });
    
    try {
      const response = await apiClient.post('/ratings/submit', {
        applicationId,
        stars
      });
      console.log('✅ submitRating response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ submitRating error:', error);
      throw error;
    }
  },

  // Get ratings for a user
  getRatings: async (userId, userType) => {
    console.log('📡 API Call: getRatings', { userId, userType });
    
    try {
      const response = await apiClient.get(`/ratings/${userId}?userType=${userType}`);
      console.log('✅ getRatings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRatings error:', error);
      throw error;
    }
  },

  // Get rating overview for task acceptance
  getRatingOverview: async (userId, userType) => {
    console.log('📡 API Call: getRatingOverview', { userId, userType });
    
    try {
      const response = await apiClient.get(`/ratings/overview/${userId}?userType=${userType}`);
      console.log('✅ getRatingOverview response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRatingOverview error:', error);
      throw error;
    }
  },

  // Check if user can rate a specific task
  checkCanRate: async (applicationId) => {
    console.log('📡 API Call: checkCanRate', applicationId);
    
    try {
      const response = await apiClient.get(`/ratings/can-rate/${applicationId}`);
      console.log('✅ checkCanRate response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ checkCanRate error:', error);
      throw error;
    }
  },

  // Get pending ratings for current user
  getPendingRatings: async () => {
    console.log('📡 API Call: getPendingRatings');
    
    try {
      const response = await apiClient.get('/ratings/pending');
      console.log('✅ getPendingRatings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getPendingRatings error:', error);
      throw error;
    }
  },

  // Get platform rating statistics (admin)
  getRatingStatistics: async () => {
    console.log('📡 API Call: getRatingStatistics');
    
    try {
      const response = await apiClient.get('/ratings/statistics');
      console.log('✅ getRatingStatistics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRatingStatistics error:', error);
      throw error;
    }
  },

  // Get rating details by ID
  getRatingDetails: async (ratingId) => {
    console.log('📡 API Call: getRatingDetails', ratingId);
    
    try {
      const response = await apiClient.get(`/ratings/details/${ratingId}`);
      console.log('✅ getRatingDetails response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRatingDetails error:', error);
      throw error;
    }
  }
};

/**
 * DigiLocker API - Aadhaar verification through government portal
 */
export const digilockerAPI = {
  // Initiate DigiLocker verification
  initiateVerification: async (tempUserId, userType = 'worker') => {
    console.log('📡 API Call: initiateDigiLockerVerification', { tempUserId, userType });
    
    try {
      const response = await apiClient.post('/auth/digilocker/initiate', {
        tempUserId,
        userType
      });
      console.log('✅ initiateDigiLockerVerification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ initiateDigiLockerVerification error:', error);
      throw error;
    }
  },

  // Check DigiLocker verification status
  checkVerificationStatus: async (userId) => {
    console.log('📡 API Call: checkDigiLockerStatus', userId);
    
    try {
      const response = await apiClient.get(`/auth/digilocker/status/${userId}`);
      console.log('✅ checkDigiLockerStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ checkDigiLockerStatus error:', error);
      throw error;
    }
  },

  // Mock verification for development
  mockVerification: async (userId, aadhaarNumber) => {
    console.log('📡 API Call: mockDigiLockerVerification', { userId, aadhaarNumber });
    
    try {
      const response = await apiClient.post('/auth/digilocker/mock-verify', {
        userId,
        aadhaarNumber
      });
      console.log('✅ mockDigiLockerVerification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ mockDigiLockerVerification error:', error);
      throw error;
    }
  },

  // Health check for DigiLocker service
  healthCheck: async () => {
    console.log('📡 API Call: digilockerHealthCheck');
    
    try {
      const response = await apiClient.get('/auth/digilocker/health');
      console.log('✅ digilockerHealthCheck response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ digilockerHealthCheck error:', error);
      throw error;
    }
  }
};

/**
 * AI API (EXISTING)
 */
export const aiAPI = {
  analyzeResume: async (resumeText, workerName) => {
    const response = await apiClient.post('/ai/analyze-resume', {
      resumeText,
      workerName
    });
    return response.data;
  },

  getAssessmentQuestions: async (category = null) => {
    const response = await apiClient.get('/ai/skill-assessment-questions', {
      params: category ? { category } : {}
    });
    return response.data;
  },

  evaluateAssessment: async (answers, workerName) => {
    const response = await apiClient.post('/ai/evaluate-skill-assessment', {
      answers,
      workerName
    });
    return response.data;
  },

  getBadgeInfo: async (badge) => {
    const response = await apiClient.get(`/ai/badge-info/${badge}`);
    return response.data;
  },

  testConnection: async () => {
    const response = await apiClient.get('/ai/test-connection');
    return response.data;
  },

  // NEW: Task analysis endpoints
  analyzeTask: async (taskData) => {
    const response = await apiClient.post('/ai/analyze-task', taskData);
    return response.data;
  },

  suggestTaskImprovements: async (taskData) => {
    const response = await apiClient.post('/ai/suggest-task-improvements', taskData);
    return response.data;
  }
};

export const bronzeTaskUtils = {
  /**
   * Format bronze task for display
   */
  formatBronzeTaskForDisplay: (task) => {
    return {
      ...task,
      payAmount: parseFloat(task.payAmount),
      duration: parseInt(task.duration),
      estimatedHours: Math.round(task.duration / 60),
      hourlyRate: Math.round(parseFloat(task.payAmount) / (task.duration / 60)),
      formattedCategory: task.category.toLowerCase().replace('_', '-'),
      categoryDisplay: task.category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    };
  },

  /**
   * Get application status color
   */
  getApplicationStatusColor: (status) => {
    const colors = {
      APPLIED: '#f59e0b',
      ACCEPTED: '#10b981',
      REJECTED: '#ef4444',
      COMPLETED: '#3b82f6'
    };
    return colors[status] || '#6b7280';
  },

  /**
   * Get application status text
   */
  getApplicationStatusText: (status) => {
    const texts = {
      APPLIED: 'Pending Review',
      ACCEPTED: 'Accepted - In Progress',
      REJECTED: 'Application Rejected',
      COMPLETED: 'Task Completed'
    };
    return texts[status] || status;
  },

  /**
   * Calculate task progress percentage
   */
  calculateTaskProgress: (application) => {
    const statusProgress = {
      APPLIED: 25,
      ACCEPTED: 50,
      IN_PROGRESS: 75,
      COMPLETED: 100
    };
    return statusProgress[application.status] || 0;
  },

  /**
   * Get next action for application
   */
  getNextAction: (application, userType) => {
    if (userType === 'employer') {
      switch (application.status) {
        case 'APPLIED':
          return { action: 'review', text: 'Review Application', color: 'primary' };
        case 'ACCEPTED':
          return { action: 'complete', text: 'Complete Task', color: 'success' };
        case 'COMPLETED':
          return { action: 'none', text: 'Task Finished', color: 'muted' };
        default:
          return { action: 'none', text: 'No Action', color: 'muted' };
      }
    } else if (userType === 'worker') {
      switch (application.status) {
        case 'APPLIED':
          return { action: 'wait', text: 'Awaiting Review', color: 'warning' };
        case 'ACCEPTED':
          return { action: 'work', text: 'Start Working', color: 'success' };
        case 'COMPLETED':
          return { action: 'none', text: 'Payment Received', color: 'success' };
        default:
          return { action: 'none', text: 'No Action', color: 'muted' };
      }
    }
    return { action: 'none', text: 'Unknown', color: 'muted' };
  },

  /**
   * Format earnings display
   */
  formatEarnings: (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount}`;
    }
  },

  /**
   * Get time since application
   */
  getTimeSinceApplication: (appliedAt) => {
    const now = new Date();
    const applied = new Date(appliedAt);
    const diffMs = now - applied;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  },

  /**
   * Get WhatsApp message templates
   */
  getWhatsAppTemplates: (taskTitle, workerName, employerName) => {
    return {
      taskAccepted: `🎉 Great news! Your application for "${taskTitle}" has been accepted. You're now connected with ${employerName}. Please coordinate task details here.`,
      taskStarted: `👋 Hi ${workerName}! Welcome to the ${taskTitle} project. Feel free to ask any questions about the requirements.`,
      taskCompleted: `✅ Task "${taskTitle}" has been completed successfully. Payment will be released shortly. Thank you for your excellent work!`,
      paymentReleased: `💰 Payment released! ₹{amount} has been transferred to your account for "${taskTitle}". Thank you for working with us!`
    };
  },

  /**
   * Validate bronze task data
   */
  validateBronzeTaskData: (taskData) => {
    const errors = [];

    if (!taskData.title || taskData.title.trim().length < 10) {
      errors.push('Title must be at least 10 characters long');
    }

    if (!taskData.description || taskData.description.trim().length < 50) {
      errors.push('Description must be at least 50 characters long');
    }

    if (!taskData.category) {
      errors.push('Category is required');
    }

    if (!taskData.duration || taskData.duration < 60 || taskData.duration > 480) {
      errors.push('Duration must be between 1-8 hours (60-480 minutes)');
    }

    if (!taskData.payAmount || taskData.payAmount < 100 || taskData.payAmount > 10000) {
      errors.push('Payment amount must be between ₹100-₹10,000');
    }

    const validCategories = [
      'DATA_ENTRY', 'CONTENT_CREATION', 'CUSTOMER_SERVICE', 
      'RESEARCH', 'BASIC_DESIGN', 'BASIC_FINANCE'
    ];
    if (taskData.category && !validCategories.includes(taskData.category)) {
      errors.push('Invalid category selected');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Generate task completion summary
   */
  generateCompletionSummary: (task, application, payment) => {
    return {
      taskTitle: task.title,
      workerName: application.worker.name,
      duration: task.duration,
      estimatedHours: Math.round(task.duration / 60),
      paymentAmount: parseFloat(task.payAmount),
      completedAt: new Date(),
      rating: application.rating || 5,
      feedback: application.feedback || 'Task completed successfully',
      paymentStatus: payment?.status || 'COMPLETED',
      transactionId: payment?.transactionId || 'MOCK_TXN_' + Date.now()
    };
  }
};

export const bronzeTaskRealTime = {
  /**
   * Subscribe to task updates
   */
  subscribeToTaskUpdates: (taskId, callback) => {
    // Placeholder for WebSocket connection
    console.log(`🔄 Subscribing to updates for task ${taskId}`);
    
    // Simulate real-time updates with polling for now
    const interval = setInterval(async () => {
      try {
        const applications = await taskAPI.getBronzeTaskApplications(taskId);
        callback(applications);
      } catch (error) {
        console.warn('Failed to fetch real-time updates:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Return cleanup function
    return () => {
      console.log(`🔄 Unsubscribing from updates for task ${taskId}`);
      clearInterval(interval);
    };
  },

  /**
   * Subscribe to WhatsApp updates
   */
  subscribeToWhatsAppUpdates: (taskId, callback) => {
    console.log(`📱 Subscribing to WhatsApp updates for task ${taskId}`);
    
    // Simulate WhatsApp message polling
    const interval = setInterval(async () => {
      try {
        const whatsapp = await taskAPI.getWhatsAppConnection(taskId);
        callback(whatsapp);
      } catch (error) {
        console.warn('Failed to fetch WhatsApp updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log(`📱 Unsubscribing from WhatsApp updates for task ${taskId}`);
      clearInterval(interval);
    };
  }
};



/**
 * File upload utilities (EXISTING)
 */
export const fileUtils = {
  validateResumeFile: (file) => {
    const errors = [];
    
    if (!file) {
      errors.push('Please select a file to upload');
      return { valid: false, errors };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be PDF, DOC, DOCX, or TXT format');
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Invalid file extension');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  createResumeFormData: (file, workerData) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('name', workerData.name);
    formData.append('phone', workerData.phone);
    if (workerData.email) {
      formData.append('email', workerData.email);
    }
    return formData;
  }
};

/**
 * Quiz utilities (EXISTING - DEPRECATED)
 */
export const quizUtils = {
  validateQuizAnswers: (answers, questions) => {
    const errors = [];
    
    if (!Array.isArray(answers)) {
      errors.push('Answers must be an array');
      return { valid: false, errors };
    }

    if (answers.length === 0) {
      errors.push('Please answer at least one question');
      return { valid: false, errors };
    }

    const requiredQuestions = questions.filter(q => q.required).map(q => q.id);
    const answeredQuestions = answers.map(a => a.questionId);
    
    const missingRequired = requiredQuestions.filter(q => !answeredQuestions.includes(q));
    if (missingRequired.length > 0) {
      errors.push(`Please answer all required questions. Missing: ${missingRequired.join(', ')}`);
    }

    answers.forEach((answer, index) => {
      if (!answer.questionId) {
        errors.push(`Answer ${index + 1}: Missing question ID`);
      }
      
      if (answer.type === 'single-choice' && !answer.selectedOption) {
        errors.push(`Please select an answer for question: ${answer.question || answer.questionId}`);
      }
      
      if (answer.type === 'multi-select' && (!answer.selectedOptions || answer.selectedOptions.length === 0)) {
        errors.push(`Please select at least one option for question: ${answer.question || answer.questionId}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  calculateProgress: (currentQuestion, totalQuestions) => {
    return Math.round((currentQuestion / totalQuestions) * 100);
  },

  formatTimeRemaining: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  createQuizSubmission: (answers, workerData, timeTaken) => {
    if (!workerData.name) {
      throw new Error('Worker name is required');
    }
    if (!workerData.phone) {
      throw new Error('Worker phone is required');
    }

    const payload = {
      name: workerData.name.trim(),
      phone: workerData.phone.trim(),
      email: workerData.email ? workerData.email.trim() : undefined,
      answers: answers.map(answer => {
        const formattedAnswer = {
          questionId: answer.questionId,
          section: answer.section,
          type: answer.type,
          question: answer.question
        };

        if (answer.type === 'single-choice' && answer.selectedOption) {
          formattedAnswer.selectedOption = answer.selectedOption;
        }

        if (answer.type === 'multi-select' && answer.selectedOptions) {
          formattedAnswer.selectedOptions = answer.selectedOptions;
        }

        if (answer.maxPoints) {
          formattedAnswer.maxPoints = answer.maxPoints;
        }

        return formattedAnswer;
      }),
      timeTaken: timeTaken || 0
    };

    if (!payload.email) {
      delete payload.email;
    }

    return payload;
  },

  _deprecated: true,
  _message: 'quizUtils is deprecated. Use trialTaskAPI instead.'
};

/**
 * Trial Task Utilities - FIXED INITIALIZATION
 * All utility functions for trial task handling
 */
export const trialTaskUtils = {
  // Validation helpers
  validateSubmission: (taskId, submittedWork, timeSpent) => {
    const errors = [];
    
    if (!taskId || typeof taskId !== 'string') {
      errors.push('Valid task ID is required');
    }
    
    if (!submittedWork || typeof submittedWork !== 'object') {
      errors.push('Submitted work data is required');
    }
    
    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      errors.push('Valid time spent is required');
    }

    // Task-specific validation
    if (taskId.includes('data_entry')) {
      const hasEntries = Object.keys(submittedWork).some(key => 
        key.startsWith('entry_') && submittedWork[key]
      );
      if (!hasEntries) {
        errors.push('At least one data entry is required');
      }
    }

    if (taskId.includes('content')) {
      if (!submittedWork.content || submittedWork.content.trim().length < 50) {
        errors.push('Content must be at least 50 characters long');
      }
    }

    if (taskId.includes('organization')) {
      const hasOrgData = Object.keys(submittedWork).some(key => 
        key.startsWith('org_') && submittedWork[key]
      );
      if (!hasOrgData) {
        errors.push('Organization data is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Session management
  determineWorkerId: (session, workerData) => {
    if (session.workerId) {
      return session.workerId;
    }
    
    if (workerData && workerData.phone) {
      return `trial_${workerData.phone.replace(/\D/g, '')}`;
    }
    
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  sanitizeWorkerData: (workerData) => {
    if (!workerData) return {};
    
    return {
      name: workerData.name?.trim() || '',
      phone: workerData.phone?.replace(/\D/g, '') || '',
      email: workerData.email?.trim().toLowerCase() || '',
      educationLevel: workerData.educationLevel || '',
      availableHours: parseInt(workerData.availableHours) || 3,
      previousWork: workerData.previousWork?.trim() || ''
    };
  },

  enhanceSubmittedWork: (submittedWork, additionalMetrics) => {
    return {
      ...submittedWork,
      submissionMetrics: {
        fieldCount: Object.keys(submittedWork).length,
        totalCharacters: JSON.stringify(submittedWork).length,
        ...additionalMetrics
      }
    };
  },

  getBrowserInfo: () => {
    if (typeof window === 'undefined') return {};
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timestamp: Date.now()
    };
  },

  // Display helpers
  formatDuration: (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  },

  getDifficultyColor: (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b', 
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  },

  getCategoryIcon: (category) => {
    const icons = {
      'DATA_ENTRY': '📊',
      'CONTENT': '✍️',
      'ORGANIZATION': '📋',
      'COMMUNICATION': '💬',
      'RESEARCH': '🔍'
    };
    return icons[category] || '📝';
  },

  getTaskCompletionStatus: (taskId) => {
    try {
      const progress = JSON.parse(localStorage.getItem('nanojobs_trial_progress') || '{}');
      return progress[taskId] ? 'completed' : 'not_started';
    } catch {
      return 'not_started';
    }
  },

  getProgressIndicator: (task) => {
    return {
      difficulty: task.difficulty,
      estimatedTime: task.timeLimit,
      payAmount: task.payAmount,
      passingScore: task.accuracyThreshold
    };
  },

  // Local storage helpers
  storeSubmissionLocally: (taskId, result) => {
    try {
      const progress = JSON.parse(localStorage.getItem('nanojobs_trial_progress') || '{}');
      progress[taskId] = {
        ...result,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('nanojobs_trial_progress', JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to store submission locally:', error);
    }
  },

  getLocalProgress: (workerId) => {
    try {
      const progress = JSON.parse(localStorage.getItem('nanojobs_trial_progress') || '{}');
      const submissions = Object.entries(progress).map(([taskId, data]) => ({
        taskId,
        ...data
      }));
      
      return {
        success: true,
        data: {
          submissions,
          source: 'local'
        }
      };
    } catch (error) {
      console.warn('Failed to get local progress:', error);
      return {
        success: true,
        data: {
          submissions: [],
          source: 'local_fallback'
        }
      };
    }
  },

  // UI helpers
  formatTimeRemaining: (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  formatEarnings: (amount) => {
    return `₹${amount.toLocaleString()}`;
  },

  getSkillLevelColor: (score) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 80) return '#3b82f6'; // blue
    if (score >= 70) return '#f59e0b'; // yellow
    if (score >= 60) return '#ef4444'; // red
    return '#6b7280'; // gray
  },

  // Error handling
  enhanceError: (error, defaultMessage) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (!error.message) {
      error.message = defaultMessage;
    }
    
    // Add user-friendly error types
    if (error.code === 'ECONNREFUSED') {
      error.userMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.response?.status === 400) {
      error.userMessage = 'Please check your submission and try again.';
    } else if (error.response?.status === 500) {
      error.userMessage = 'Server error. Please try again in a moment.';
    } else {
      error.userMessage = error.message || defaultMessage;
    }

    return error;
  },

  // Placeholder methods for frontend compatibility
  formatScoreBreakdown: (evaluation) => evaluation,
  getPerformanceTier: (evaluation) => ({ tier: 'good', color: '#3b82f6', message: 'Great work!' }),
  generateNextSteps: (evaluation) => [],
  calculateBadgeImpact: (evaluation) => null,
  formatScoreDisplay: (scores) => scores,
  formatTimeDisplay: (timeSpent) => `${timeSpent} min`,
  getStatusBadge: (passed) => passed ? 'PASSED' : 'RETRY',
  getDifficultyIndicator: (difficulty) => difficulty,
  getTimeIndicator: (timeLimit) => `${timeLimit} minutes`,
  getCategoryInfo: (category) => ({ category }),
  getDefaultFeedback: (taskId) => ({ message: 'Keep going!' })
};

// Default export
export default {
  authAPI,
  workerAPI,
  employerAPI,
  trialTaskAPI,
  ratingAPI,
  digilockerAPI,
  aiAPI,
  paymentAPI,
  taskAPI,
  apiUtils,
  fileUtils,
  quizUtils,
  trialTaskUtils,
  storageUtils,
  bronzeTaskUtils,
  bronzeTaskRealTime
};