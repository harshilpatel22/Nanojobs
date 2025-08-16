import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import toast, { Toaster } from 'react-hot-toast';

// Import styles
import './styles/variables.css';
import './styles/global.css';

// Import API utilities
import { storageUtils, workerAPI, employerAPI } from './utils/api';

// Import Worker pages
import Home from './pages/Home';
import WorkerRegistration from './pages/WorkerRegistration';
import TrialTaskflow from './components/trial-tasks/TrialTaskflow'; // ✅ UPDATED: Using TrialTaskflow instead of SkillAssessment
import WorkerDashboard from './pages/WorkerDashboard';
import TaskMarketplace from './pages/TaskMarketplace';

// Import Employer pages
import EmployerRegistration from './pages/EmployerRegistration';
import EmployerDashboard from './pages/EmployerDashboard';
import TaskPosting from './pages/TaskPosting';

// Import Authentication pages
import Login from './pages/Login';

// Import Task Detail page
import TaskDetailPage from './pages/TaskDetailPage';

// Import common components
import LoadingSpinner from './components/common/LoadingSpinner';

/**
 * Enhanced Main App Component - UPDATED FOR TRIAL TASK SYSTEM
 * Handles routing, authentication state, and global providers for both workers and employers
 * 
 * Updated features:
 * - Trial task flow integration (replaces quiz system)
 * - Dual registration path support (Resume + Simple Form)
 * - Enhanced worker registration flow
 * - Business support task routing
 * - Improved mobile navigation
 */

// Create React Query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        toast.error(message);
      }
    }
  }
});

function App() {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    userType: null, // 'worker' or 'employer'
    userId: null, // User ID (for authentication/TaskDetail)
    workerId: null, // Worker ID (for WorkerDashboard)
    employerId: null, // Employer ID (for EmployerDashboard)
    sessionToken: null
  });

  /**
   * Check authentication status on app load
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Listen for auth expiration events
   */
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthState();
      toast.error('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  /**
   * Clear authentication state
   */
  const clearAuthState = () => {
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      userType: null,
      userId: null,
      workerId: null,
      employerId: null,
      sessionToken: null
    });
  };

  /**
   * Check if user is authenticated and determine user type
   */
  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { sessionToken, workerId, employerId } = storageUtils.getSession();
      
      if (!sessionToken) {
        clearAuthState();
        return;
      }

      // Determine user type and verify session
      let userType = null;
      let userId = null;
      let sessionValid = false;

      if (workerId) {
        // Verify worker session
        try {
          const response = await workerAPI.verifySession(sessionToken);
          if (response.success && response.data.sessionValid) {
            userType = 'worker';
            // Use workerId for dashboard operations, but we need userId for TaskDetail
            // The session token contains userId, so we'll decode it to get the correct userId
            try {
              const tokenPayload = JSON.parse(atob(sessionToken.split('.')[1]));
              userId = tokenPayload.userId; // Use User ID from token for TaskDetail
            } catch (tokenError) {
              console.error('Failed to decode token:', tokenError);
              userId = workerId; // Fallback to workerId
            }
            sessionValid = true;
          }
        } catch (error) {
          console.error('Worker session verification failed:', error);
        }
      } else if (employerId) {
        // Verify employer session
        try {
          const response = await employerAPI.verifySession(sessionToken);
          if (response.success && response.data.sessionValid) {
            userType = 'employer';
            // Use employerId for dashboard operations, but we need userId for TaskDetail
            // The session token contains userId, so we'll decode it to get the correct userId
            try {
              const tokenPayload = JSON.parse(atob(sessionToken.split('.')[1]));
              userId = tokenPayload.userId; // Use User ID from token for TaskDetail
            } catch (tokenError) {
              console.error('Failed to decode token:', tokenError);
              userId = employerId; // Fallback to employerId
            }
            sessionValid = true;
          }
        } catch (error) {
          console.error('Employer session verification failed:', error);
        }
      }

      if (sessionValid) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          userType,
          userId, // User ID from token
          workerId: userType === 'worker' ? workerId : null,
          employerId: userType === 'employer' ? employerId : null,
          sessionToken
        });
      } else {
        // Session invalid, clear storage
        storageUtils.clearSession();
        clearAuthState();
      }

    } catch (error) {
      console.error('Auth check failed:', error);
      storageUtils.clearSession();
      clearAuthState();
    }
  };

  /**
   * Handle successful worker login/registration
   */
  const handleWorkerLoginSuccess = (sessionToken, workerId) => {
    storageUtils.setWorkerSession(sessionToken, workerId);
    storageUtils.clearQuizProgress(); // Clear any old quiz data
    storageUtils.clearTaskFilters(); // Clear any cached filters
    
    // Decode token to get User ID
    let userId = workerId; // fallback
    try {
      const tokenPayload = JSON.parse(atob(sessionToken.split('.')[1]));
      userId = tokenPayload.userId;
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
    
    setAuthState({
      isLoading: false,
      isAuthenticated: true,
      userType: 'worker',
      userId, // User ID from token
      workerId, // Worker ID for dashboard
      employerId: null,
      sessionToken
    });
    toast.success('🎉 Welcome to NanoJobs! Ready to start earning?');
  };

  /**
   * Handle successful employer login/registration
   */
  const handleEmployerLoginSuccess = (sessionToken, employerId) => {
    storageUtils.setEmployerSession(sessionToken, employerId);
    
    // Decode token to get User ID
    let userId = employerId; // fallback
    try {
      const tokenPayload = JSON.parse(atob(sessionToken.split('.')[1]));
      userId = tokenPayload.userId;
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
    
    setAuthState({
      isLoading: false,
      isAuthenticated: true,
      userType: 'employer',
      userId, // User ID from token
      workerId: null,
      employerId, // Employer ID for dashboard
      sessionToken
    });
    toast.success('Welcome to NanoJobs! Start posting tasks to find skilled workers.');
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    storageUtils.clearSession();
    storageUtils.clearQuizProgress();
    storageUtils.clearTaskFilters();
    clearAuthState();
    toast.success('Logged out successfully');
  };

  /**
   * Protected Route Component
   */
  const ProtectedRoute = ({ children, requiredUserType = null }) => {
    if (authState.isLoading) {
      return <LoadingSpinner fullscreen message="Checking authentication..." />;
    }
    
    if (!authState.isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    // Check if user type matches requirement
    if (requiredUserType && authState.userType !== requiredUserType) {
      const redirectPath = authState.userType === 'worker' ? '/dashboard' : '/employer-dashboard';
      return <Navigate to={redirectPath} replace />;
    }
    
    return children;
  };

  /**
   * Public Route Component (redirect if authenticated)
   */
  const PublicRoute = ({ children }) => {
    if (authState.isLoading) {
      return <LoadingSpinner fullscreen message="Loading..." />;
    }
    
    if (authState.isAuthenticated) {
      const redirectPath = authState.userType === 'worker' ? '/dashboard' : '/employer-dashboard';
      return <Navigate to={redirectPath} replace />;
    }
    
    return children;
  };

  /**
   * Auto-redirect based on user type
   */
  const AuthenticatedRedirect = () => {
    if (authState.userType === 'worker') {
      return <Navigate to="/dashboard" replace />;
    } else if (authState.userType === 'employer') {
      return <Navigate to="/employer-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  };

  /**
   * Task Details Wrapper to handle route parameters
   */
  const TaskDetailsWrapper = () => {
    const { taskId } = useParams();
    return (
      <TaskDetailPage 
        taskId={taskId}
        userId={authState.userId}
        userRole={authState.userType === 'worker' ? 'applicant' : 'employer'}
      />
    );
  };

  // Show loading spinner while checking authentication
  if (authState.isLoading) {
    return <LoadingSpinner fullscreen message="Starting NanoJobs..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          {/* Toast notifications container */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background-white)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                maxWidth: '90vw',
                fontFamily: 'var(--font-sans)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--background-white)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error)',
                  secondary: 'var(--background-white)',
                },
              },
              loading: {
                iconTheme: {
                  primary: 'var(--primary)',
                  secondary: 'var(--background-white)',
                },
              },
            }}
          />

          {/* Main application routes */}
          <Routes>
            {/* Home/Landing Page */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              } 
            />

            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login 
                    onWorkerSuccess={handleWorkerLoginSuccess}
                    onEmployerSuccess={handleEmployerLoginSuccess}
                  />
                </PublicRoute>
              } 
            />

            {/* ✅ UPDATED: Worker Registration Routes with Dual Path Support */}
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <WorkerRegistration onSuccess={handleWorkerLoginSuccess} />
                </PublicRoute>
              } 
            />

            <Route 
              path="/register/worker" 
              element={
                <PublicRoute>
                  <WorkerRegistration onSuccess={handleWorkerLoginSuccess} />
                </PublicRoute>
              } 
            />

            {/* ✅ NEW: Standalone Trial Task Flow Route */}
            <Route 
              path="/register/trial-tasks" 
              element={
                <PublicRoute>
                  <TrialTaskflow 
                    onSuccess={handleWorkerLoginSuccess}
                    onBack={() => window.history.back()}
                  />
                </PublicRoute>
              } 
            />

            {/* Employer Registration Route */}
            <Route 
              path="/register/employer" 
              element={
                <PublicRoute>
                  <EmployerRegistration onSuccess={handleEmployerLoginSuccess} />
                </PublicRoute>
              } 
            />

            {/* ✅ REMOVED: Old skill assessment route - replaced by trial tasks integrated in WorkerRegistration */}

            {/* Worker Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredUserType="worker">
                  <WorkerDashboard 
                    workerId={authState.workerId}
                    sessionToken={authState.sessionToken}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              } 
            />

            {/* ✅ UPDATED: Enhanced Task Marketplace for Business Support Tasks */}
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute requiredUserType="worker">
                  <TaskMarketplace 
                    workerId={authState.workerId}
                    sessionToken={authState.sessionToken}
                  />
                </ProtectedRoute>
              } 
            />

            {/* ✅ NEW: Bronze Task Categories Route */}
            <Route 
              path="/tasks/bronze/:category" 
              element={
                <ProtectedRoute requiredUserType="worker">
                  <TaskMarketplace 
                    workerId={authState.workerId}
                    sessionToken={authState.sessionToken}
                  />
                </ProtectedRoute>
              } 
            />

            {/* Employer Protected Routes */}
            <Route 
              path="/employer-dashboard" 
              element={
                <ProtectedRoute requiredUserType="employer">
                  <EmployerDashboard 
                    employerId={authState.employerId}
                    sessionToken={authState.sessionToken}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              } 
            />

            {/* Task Posting Route */}
            <Route 
              path="/post-task" 
              element={
                <ProtectedRoute requiredUserType="employer">
                  <TaskPosting 
                    employerId={authState.employerId}
                    sessionToken={authState.sessionToken}
                  />
                </ProtectedRoute>
              } 
            />

            {/* Redirect authenticated users to appropriate dashboard */}
            <Route 
              path="/auth-redirect" 
              element={
                <ProtectedRoute>
                  <AuthenticatedRedirect />
                </ProtectedRoute>
              } 
            />

            {/* Task Details Route (accessible by both user types) */}
            <Route 
              path="/tasks/:taskId" 
              element={
                <ProtectedRoute>
                  <TaskDetailsWrapper />
                </ProtectedRoute>
              } 
            />


            {/* Profile Settings (accessible by both user types) */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    minHeight: '50vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <h2>Profile Settings</h2>
                    <p>Profile management coming soon!</p>
                    <p>For now, your profile information is managed through the dashboard.</p>
                    <button 
                      onClick={() => window.history.back()}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      Go Back
                    </button>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* Help/Support Routes */}
            <Route 
              path="/help" 
              element={
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center',
                  minHeight: '50vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <h2>Help Center</h2>
                  <p>Comprehensive help documentation coming soon!</p>
                  <p>For immediate support, please contact us directly.</p>
                  <button 
                    onClick={() => window.history.back()}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    Go Back
                  </button>
                </div>
              } 
            />

            <Route 
              path="/contact" 
              element={
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center',
                  minHeight: '50vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <h2>Contact Support</h2>
                  <p>Support contact form coming soon!</p>
                  <p>Email us directly for immediate assistance.</p>
                  <button 
                    onClick={() => window.history.back()}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    Go Back
                  </button>
                </div>
              } 
            />

            {/* Legal Pages */}
            <Route 
              path="/terms" 
              element={
                <div style={{ 
                  padding: '2rem', 
                  maxWidth: '800px',
                  margin: '0 auto',
                  lineHeight: '1.6'
                }}>
                  <h1>Terms of Service</h1>
                  <p>Comprehensive terms of service coming soon!</p>
                  <p>By using NanoJobs, you agree to fair and respectful use of our platform.</p>
                </div>
              } 
            />

            <Route 
              path="/privacy" 
              element={
                <div style={{ 
                  padding: '2rem', 
                  maxWidth: '800px',
                  margin: '0 auto',
                  lineHeight: '1.6'
                }}>
                  <h1>Privacy Policy</h1>
                  <p>Detailed privacy policy coming soon!</p>
                  <p>We are committed to protecting your personal information and data privacy.</p>
                </div>
              } 
            />

            {/* 404 and Catch-all Routes */}
            <Route 
              path="/404" 
              element={
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  minHeight: '50vh', 
                  gap: '1rem',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
                  <h2>Page Not Found</h2>
                  <p>The page you're looking for doesn't exist or has been moved.</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      onClick={() => window.history.back()}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={() => window.location.href = '/'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'transparent',
                        color: 'var(--primary)',
                        border: '2px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              } 
            />

            {/* Catch-all redirect */}
            <Route 
              path="*" 
              element={
                authState.isAuthenticated 
                  ? <AuthenticatedRedirect />
                  : <Navigate to="/404" replace />
              } 
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;