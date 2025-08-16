import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Edit,
  LogOut,
  Building2,
  Star,
  ArrowUp,
  Activity,
  Award,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Crown,
  Sparkles,
  Send,
  Lock,
  Shield,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Settings,
  BarChart3,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ApplicationManagement from '../components/task/ApplicationManagement';
import WhatsAppIntegration from '../components/communication/WhatsappIntegration';

// Import the enhanced API client
import { employerAPI, taskAPI, bronzeTaskUtils } from '../utils/api';

import styles from './EmployerDashboard.module.css';

/**
 * Updated Employer Dashboard with Complete Bronze Task Workflow
 * 
 * Features:
 * - View all bronze tasks with application management
 * - Accept/reject worker applications  
 * - WhatsApp integration for task communication
 * - Complete tasks and release payments
 * - Enhanced payment status tracking
 * - Real-time application updates
 */

const EmployerDashboard = ({ employerId, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showApplicationManagement, setShowApplicationManagement] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppMinimized, setWhatsAppMinimized] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({});
  
  console.log('🏢 EmployerDashboard mounted with employerId:', employerId);

  // Fetch employer profile
  const { data: employerData, isLoading: profileLoading, error: profileError } = useQuery(
    ['employer-profile', employerId],
    () => {
      console.log('📡 Fetching employer profile for:', employerId);
      return employerAPI.getProfile(employerId);
    },
    {
      enabled: !!employerId,
      retry: 1,
      onSuccess: (data) => {
        console.log('✅ Employer profile loaded:', data);
      },
      onError: (error) => {
        console.error('❌ Failed to fetch employer profile:', error);
        toast.error('Failed to load profile');
      }
    }
  );

  // Fetch bronze task dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery(
    ['employer-bronze-dashboard', employerId],
    () => {
      console.log('📡 Fetching employer bronze task dashboard for:', employerId);
      return taskAPI.getEmployerBronzeTaskDashboard(employerId);
    },
    {
      enabled: !!employerId,
      retry: 1,
      refetchInterval: 30000, // Refresh every 30 seconds
      onSuccess: (data) => {
        console.log('✅ Employer dashboard loaded:', data);
        // Update payment status tracking
        if (data?.success && data.data.tasks) {
          updatePaymentStatuses(data.data.tasks);
        }
      },
      onError: (error) => {
        console.error('❌ Failed to fetch dashboard:', error);
        if (error.response?.status !== 404) {
          toast.error('Failed to load dashboard');
        }
      }
    }
  );

  // Fetch employer stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['employer-stats', employerId],
    () => {
      console.log('📡 Fetching employer stats for:', employerId);
      return employerAPI.getStats(employerId);
    },
    {
      enabled: !!employerId,
      retry: 1,
      onSuccess: (data) => {
        console.log('✅ Employer stats loaded:', data);
      },
      onError: (error) => {
        console.error('❌ Failed to fetch employer stats:', error);
      }
    }
  );

  /**
   * Update payment status tracking
   */
  const updatePaymentStatuses = (tasks) => {
    console.log('💰 Updating payment statuses for', tasks.length, 'tasks');
    
    const statuses = {};
    tasks.forEach(task => {
      statuses[task.id] = {
        hasPayment: task.payment.status !== 'PENDING',
        status: task.payment.status,
        amount: task.payment.amount,
        canRelease: task.applications.accepted > 0 && task.payment.status === 'ESCROWED',
        transactionId: task.payment.transactionId,
        completedAt: task.payment.status === 'COMPLETED' ? new Date() : null
      };
    });
    
    setPaymentStatus(statuses);
    console.log('✅ Payment statuses updated:', Object.keys(statuses).length, 'tasks');
  };

  /**
   * Handle view applications
   */
  const handleViewApplications = (task) => {
    console.log('📋 Viewing applications for task:', task.id);
    setSelectedTask(task);
    setShowApplicationManagement(true);
  };

  /**
   * Handle close application management
   */
  const handleCloseApplicationManagement = () => {
    setShowApplicationManagement(false);
    setSelectedTask(null);
    refetchDashboard();
  };

  /**
   * Handle task completion from application management
   */
  const handleTaskComplete = (completionData) => {
    console.log('✅ Task completed:', completionData);
    
    // Update local payment status
    if (selectedTask) {
      setPaymentStatus(prev => ({
        ...prev,
        [selectedTask.id]: {
          ...prev[selectedTask.id],
          status: 'COMPLETED',
          completedAt: new Date(),
          canRelease: false
        }
      }));
    }
    
    // Refresh dashboard data
    refetchDashboard();
    
    // Show success message
    toast.success('🎉 Task completed and payment released!');
    
    // Close application management
    handleCloseApplicationManagement();
  };

  /**
   * Handle show WhatsApp for task
   */
  const handleShowWhatsApp = (task) => {
    console.log('📱 Opening WhatsApp for task:', task.id);
    setSelectedTask(task);
    setShowWhatsApp(true);
    setWhatsAppMinimized(false);
  };

  /**
   * Handle create new task
   */
  const handleCreateTask = () => {
    console.log('📝 Navigating to task creation');
    navigate('/post-task');
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    console.log('🔄 Logging out employer');
    if (onLogout) {
      onLogout();
    }
  };

  /**
   * Get payment status badge
   */
  const getPaymentStatusBadge = (taskId, taskStatus) => {
    const payment = paymentStatus[taskId];
    
    if (!payment) {
      return (
        <span className={styles.paymentBadge} style={{ 
          color: 'var(--text-muted)', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <AlertTriangle size={12} />
          No Payment
        </span>
      );
    }
    
    const statusConfig = {
      PENDING: { color: 'var(--warning)', bg: 'rgba(255, 184, 0, 0.15)', text: 'Payment Pending' },
      ESCROWED: { color: 'var(--primary)', bg: 'rgba(0, 102, 255, 0.15)', text: 'Payment Secured' },
      COMPLETED: { color: 'var(--success)', bg: 'rgba(0, 200, 150, 0.15)', text: 'Payment Released' },
      FAILED: { color: 'var(--error)', bg: 'rgba(229, 62, 62, 0.15)', text: 'Payment Failed' }
    };
    
    const config = statusConfig[payment.status] || statusConfig.PENDING;
    
    return (
      <span 
        className={styles.paymentBadge}
        style={{ 
          color: config.color, 
          backgroundColor: config.bg,
          border: `1px solid ${config.color}40`
        }}
      >
        {payment.status === 'ESCROWED' && <Lock size={12} />}
        {payment.status === 'COMPLETED' && <CheckCircle size={12} />}
        {payment.status === 'FAILED' && <AlertTriangle size={12} />}
        {payment.status === 'PENDING' && <Clock size={12} />}
        {config.text}
      </span>
    );
  };

  /**
   * Get task status display
   */
  const getTaskStatusDisplay = (task) => {
    if (task.applications.completed > 0) {
      return { status: 'COMPLETED', color: 'var(--success)', text: 'Completed' };
    } else if (task.applications.accepted > 0) {
      return { status: 'IN_PROGRESS', color: 'var(--warning)', text: 'In Progress' };
    } else if (task.applications.pending > 0) {
      return { status: 'REVIEW', color: 'var(--info)', text: 'Under Review' };
    } else {
      return { status: 'AVAILABLE', color: 'var(--primary)', text: 'Available' };
    }
  };

  /**
   * Format category for display
   */
  const formatCategory = (category) => {
    if (!category) return 'Unknown';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Show loading spinner
  if (profileLoading || dashboardLoading || statsLoading) {
    return <LoadingSpinner fullscreen message="Loading your dashboard..." />;
  }

  // Show error if profile failed to load
  if (profileError || !employerData?.success) {
    console.error('❌ Profile error:', profileError);
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h2>Unable to Load Dashboard</h2>
          <p>There was an error loading your profile. Please try refreshing the page.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Extract data from API responses
  const { employer } = employerData.data;
  const dashboardStats = dashboardData?.success ? dashboardData.data.stats : {};
  const tasks = dashboardData?.success ? dashboardData.data.tasks : [];
  const generalStats = statsData?.success ? statsData.data.stats : {};

  console.log('📊 Dashboard data:', {
    employer: employer?.name,
    tasksCount: tasks.length,
    hasStats: !!dashboardStats.totalTasks,
    paymentStatuses: Object.keys(paymentStatus).length
  });

  return (
    <div className={styles.container}>
      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.architectureBackground}></div>
        <div className={styles.floatingElements}>
          <div className={styles.floatingElement} style={{ top: '10%', left: '10%' }}>
            <Sparkles size={16} />
          </div>
          <div className={styles.floatingElement} style={{ top: '20%', right: '15%' }}>
            <Crown size={18} />
          </div>
          <div className={styles.floatingElement} style={{ bottom: '25%', left: '8%' }}>
            <Zap size={14} />
          </div>
          <div className={styles.floatingElement} style={{ bottom: '15%', right: '12%' }}>
            <Target size={16} />
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.welcomeSection}>
            <div className={styles.companyInfo}>
              <div className={styles.companyIcon}>
                <Building2 size={32} />
              </div>
              <div className={styles.companyDetails}>
                <h1 className={styles.welcomeTitle}>
                  Welcome back, {employer.companyName || employer.name}!
                </h1>
                <p className={styles.welcomeSubtitle}>
                  Manage your bronze tasks and teams with integrated communication & payments
                </p>
                {employer.isVerified && (
                  <div className={styles.verifiedBadge}>
                    <CheckCircle size={16} />
                    <span>Verified Employer</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <Button 
              onClick={handleCreateTask}
              icon={Plus}
              size="lg"
              className={styles.primaryAction}
            >
              Post Bronze Task
            </Button>
            <Button 
              variant="ghost" 
              icon={LogOut} 
              onClick={handleLogout}
              className={styles.ghostAction}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Stats Dashboard */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statContent}>
                <div className={styles.statIcon}>
                  <Briefcase size={24} />
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statValue}>
                    {dashboardStats.totalTasks || 0}
                  </div>
                  <div className={styles.statLabel}>Bronze Tasks</div>
                  <div className={styles.statChange}>
                    <ArrowUp size={12} />
                    <span>{dashboardStats.activeTasks || 0} active</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statContent}>
                <div className={styles.statIcon}>
                  <Users size={24} />
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statValue}>
                    {dashboardStats.totalApplications || 0}
                  </div>
                  <div className={styles.statLabel}>Applications</div>
                  <div className={styles.statChange}>
                    <Activity size={12} />
                    <span>{dashboardStats.pendingApplications || 0} pending</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statContent}>
                <div className={styles.statIcon}>
                  <Shield size={24} />
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statValue}>
                    ₹{(dashboardStats.escrowedAmount || 0).toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>Escrowed</div>
                  <div className={styles.statChange}>
                    <Lock size={12} />
                    <span>In escrow</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statContent}>
                <div className={styles.statIcon}>
                  <DollarSign size={24} />
                </div>
                <div className={styles.statDetails}>
                  <div className={styles.statValue}>
                    ₹{(dashboardStats.totalSpent || 0).toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>Total Spent</div>
                  <div className={styles.statChange}>
                    <CheckCircle size={12} />
                    <span>{dashboardStats.completedTasks || 0} completed</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Enhanced Tasks Management */}
      <div className={styles.mainContent}>
        <Card className={styles.tasksCard}>
          <CardHeader
            title="Your Bronze Tasks"
            subtitle="Manage business support tasks with integrated workflow"
            action={
              <div className={styles.headerActions}>
                <Button variant="outline" size="sm" onClick={refetchDashboard} icon={RefreshCw}>
                  Refresh
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateTask} icon={Plus}>
                  New Task
                </Button>
              </div>
            }
          />
          <CardBody>
            {tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Briefcase size={48} />
                </div>
                <h3>No bronze tasks posted yet</h3>
                <p>Start by posting your first business support task with secure payment protection</p>
                <Button onClick={handleCreateTask} icon={Plus} className={styles.emptyAction}>
                  Post Your First Bronze Task
                </Button>
              </div>
            ) : (
              <div className={styles.tasksList}>
                {tasks.map((task, index) => {
                  const taskStatus = getTaskStatusDisplay(task);
                  
                  return (
                    <div key={task.id} className={styles.taskItem} style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className={styles.taskMain}>
                        <div className={styles.taskHeader}>
                          <h4 className={styles.taskTitle}>{task.title}</h4>
                          <div className={styles.taskBadges}>
                            <span 
                              className={styles.statusBadge}
                              style={{ 
                                color: taskStatus.color, 
                                backgroundColor: `${taskStatus.color}20`,
                                border: `1px solid ${taskStatus.color}40`
                              }}
                            >
                              {taskStatus.text}
                            </span>
                            {getPaymentStatusBadge(task.id)}
                          </div>
                        </div>
                        
                        <div className={styles.taskMeta}>
                          <div className={styles.taskMetaItem}>
                            <Briefcase size={14} />
                            <span>{formatCategory(task.category)}</span>
                          </div>
                          <div className={styles.taskMetaItem}>
                            <DollarSign size={14} />
                            <span>₹{Number(task.payAmount).toLocaleString()}</span>
                          </div>
                          <div className={styles.taskMetaItem}>
                            <Clock size={14} />
                            <span>{Math.round(task.duration / 60)}h duration</span>
                          </div>
                          {task.payment.transactionId && (
                            <div className={styles.taskMetaItem}>
                              <CreditCard size={14} />
                              <span>{task.payment.transactionId}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.taskStats}>
                          <div className={styles.taskStat}>
                            <Users size={16} />
                            <span>{task.applications.total} applications</span>
                          </div>
                          {task.applications.pending > 0 && (
                            <div className={styles.taskStat}>
                              <Clock size={16} />
                              <span>{task.applications.pending} pending review</span>
                            </div>
                          )}
                          {task.applications.accepted > 0 && (
                            <div className={styles.taskStat}>
                              <CheckCircle size={16} />
                              <span>{task.applications.accepted} working</span>
                            </div>
                          )}
                          <div className={styles.taskStat}>
                            <Calendar size={16} />
                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.taskActions}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          icon={Users}
                          onClick={() => handleViewApplications(task)}
                        >
                          Applications ({task.applications.total})
                        </Button>
                        
                        {task.applications.accepted > 0 && (
                          <Button 
                            variant="success" 
                            size="sm"
                            icon={MessageSquare}
                            onClick={() => handleShowWhatsApp(task)}
                          >
                            WhatsApp
                          </Button>
                        )}
                        
                        {task.applications.pending > 0 && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewApplications(task)}
                          >
                            Review ({task.applications.pending})
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          icon={FileText}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          Task Details
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          icon={BarChart3}
                          onClick={() => toast('Task analytics coming soon!', { icon: 'ℹ️' })}
                        >
                          Analytics
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions with Enhanced Features */}
      <Card className={styles.actionsCard}>
        <CardHeader
          title="Quick Actions"
          subtitle="Streamline your bronze task management"
        />
        <CardBody>
          <div className={styles.actionsList}>
            <div className={styles.actionItem} onClick={handleCreateTask}>
              <div className={styles.actionIcon}>
                <Plus size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Post Bronze Task</h4>
                <p>Create a business support task with automatic payment protection</p>
              </div>
              <div className={styles.actionArrow}>
                <ArrowUp size={16} />
              </div>
            </div>
            
            <div className={styles.actionItem} onClick={() => toast('Payment history coming soon!', { icon: 'ℹ️' })}>
              <div className={styles.actionIcon}>
                <CreditCard size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Payment History</h4>
                <p>View all your bronze task transaction records</p>
              </div>
              <div className={styles.actionArrow}>
                <ArrowUp size={16} />
              </div>
            </div>
            
            <div className={styles.actionItem} onClick={() => toast('Worker directory coming soon!', { icon: 'ℹ️' })}>
              <div className={styles.actionIcon}>
                <Users size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Browse Workers</h4>
                <p>Find and invite skilled bronze-level workers</p>
              </div>
              <div className={styles.actionArrow}>
                <ArrowUp size={16} />
              </div>
            </div>
            
            <div className={styles.actionItem} onClick={() => toast('Settings coming soon!', { icon: 'ℹ️' })}>
              <div className={styles.actionIcon}>
                <Settings size={24} />
              </div>
              <div className={styles.actionContent}>
                <h4>Manage Settings</h4>
                <p>Configure notifications, payments, and preferences</p>
              </div>
              <div className={styles.actionArrow}>
                <ArrowUp size={16} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Application Management Modal */}
      {showApplicationManagement && selectedTask && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <ApplicationManagement
              taskId={selectedTask.id}
              employerId={employerId}
              onClose={handleCloseApplicationManagement}
              onTaskComplete={handleTaskComplete}
            />
          </div>
        </div>
      )}

      {/* WhatsApp Integration */}
      {showWhatsApp && selectedTask && (
        <div className={`${styles.whatsappContainer} ${whatsAppMinimized ? styles.minimized : ''}`}>
          <WhatsAppIntegration
            taskId={selectedTask.id}
            userType="employer"
            userId={employerId}
            onTaskComplete={handleTaskComplete}
            isMinimized={whatsAppMinimized}
            onToggleMinimize={() => setWhatsAppMinimized(!whatsAppMinimized)}
          />
          {!whatsAppMinimized && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowWhatsApp(false)}
              className={styles.closeWhatsApp}
            >
              Close Chat
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;