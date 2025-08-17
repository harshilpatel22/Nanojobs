import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  User, 
  Award, 
  TrendingUp, 
  LogOut, 
  Star,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Coins,
  Briefcase,
  Calendar,
  BarChart3,
  Gift,
  Flame,
  Eye,
  FileText,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import { workerAPI, taskAPI, apiUtils } from '../utils/api';

import styles from './WorkerDashboard.module.css';

// Simple Bot Avatar Component
const BotAvatar = ({ size = 40 }) => {
  return (
    <div className={styles.botAvatar} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="18" fill="#0066FF" />
        <circle cx="16" cy="17" r="2" fill="white" />
        <circle cx="24" cy="17" r="2" fill="white" />
        <path d="M 14 24 Q 20 28 26 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="18" y="8" width="4" height="6" rx="2" fill="#FFB800" />
      </svg>
    </div>
  );
};

// Circular Progress Component
const CircularProgress = ({ progress, size = 80, strokeWidth = 6, color = '#0066FF' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressWrapper} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.progressRing}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={styles.progressCircle}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className={styles.progressText}>
        <span className={styles.progressValue}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const isNumber = !isNaN(end);
    const endValue = isNumber ? parseInt(end) : 0;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * endValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

/**
 * Enhanced Worker Dashboard
 * Beautiful, gamified dashboard with NanoBot mascot and modern UI
 */

const WorkerDashboard = ({ workerId, onLogout }) => {
  const navigate = useNavigate();
  const handleBrowseNewTask = () => navigate('/tasks');

  // Fetch worker profile
  const { data: workerData, isLoading, error } = useQuery(
    ['worker-profile', workerId],
    () => workerAPI.getProfile(workerId),
    {
      enabled: !!workerId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch worker profile:', error);
        toast.error('Failed to load profile');
      }
    }
  );

  // Fetch accepted tasks for worker
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery(
    ['worker-applications', workerId],
    () => workerAPI.getApplications(workerId, { status: 'ACCEPTED' }),
    {
      enabled: !!workerId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch applications:', error);
      }
    }
  );

  // Fetch worker dashboard data (includes completed tasks)
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['worker-dashboard', workerId],
    () => taskAPI.getWorkerBronzeTaskDashboard(workerId),
    {
      enabled: !!workerId,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch dashboard data:', error);
      }
    }
  );

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen message="Loading your dashboard..." />;
  }

  if (error || !workerData?.success) {
    return (
      <div className={styles.errorContainer}>
        <h2>Unable to Load Dashboard</h2>
        <p>There was an error loading your profile. Please try refreshing the page.</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  const { worker, badgeInfo } = workerData.data;

  return (
    <div className={styles.container}>
      {/* Modern Header */}
      <div className={styles.header}>
        <div className={styles.greeting}>
          <BotAvatar size={48} />
          <div className={styles.greetingText}>
            <h1>Welcome back, {worker.name}!</h1>
            <p>Ready to earn today?</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          icon={LogOut} 
          onClick={handleLogout}
          className={styles.logoutButton}
        >
          Logout
        </Button>
      </div>

      {/* Hero Stats Section */}
      <div className={styles.heroStats}>
        <div className={styles.mainStat}>
          <div className={styles.mainStatIcon}>
            <Coins size={32} />
          </div>
          <div className={styles.mainStatContent}>
            <div className={styles.mainStatValue}>
              ₹<AnimatedCounter end={worker.stats?.totalEarnings || 0} />
            </div>
            <div className={styles.mainStatLabel}>Total Earnings</div>
            <div className={styles.mainStatTrend}>
              <TrendingUp size={14} />
              <span>+12% this month</span>
            </div>
          </div>
        </div>
        
        <div className={styles.quickStats}>
          <div className={styles.quickStat}>
            <div className={styles.quickStatValue}>
              <AnimatedCounter end={worker.stats?.tasksCompleted || 0} />
            </div>
            <div className={styles.quickStatLabel}>Tasks Done</div>
          </div>
          <div className={styles.quickStat}>
            <div className={styles.quickStatValue}>
              {worker.rating?.averageRating ? worker.rating.averageRating.toFixed(1) : '5.0'}
            </div>
            <div className={styles.quickStatLabel}>Rating</div>
          </div>
          <div className={styles.quickStat}>
            <div className={styles.quickStatValue}>7</div>
            <div className={styles.quickStatLabel}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* Profile Overview */}
      <Card className={styles.profileCard}>
        <CardBody>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.userDetails}>
                <h3>{worker.name}</h3>
                <p>{worker.phone}</p>
                {worker.email && <p>{worker.email}</p>}
              </div>
            </div>
            
            <div className={styles.badgeContainer}>
              <div 
                className={styles.badge}
                style={{
                  backgroundColor: badgeInfo?.bgColor || '#0066FF',
                  color: badgeInfo?.textColor || 'white',
                  borderColor: badgeInfo?.color || '#0066FF'
                }}
              >
                <Award size={16} />
                <span>{worker.badge || 'BRONZE'} LEVEL</span>
              </div>
            </div>
          </div>

          <div className={styles.levelProgress}>
            <div className={styles.progressInfo}>
              <span className={styles.progressLabel}>Level Progress</span>
              <span className={styles.progressPercent}>
                {Math.min(Math.round(((worker.stats?.tasksCompleted || 0) / 10) * 100), 100)}%
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{
                  width: `${Math.min(((worker.stats?.tasksCompleted || 0) / 10) * 100, 100)}%`
                }}
              />
            </div>
            <div className={styles.progressNote}>
              {10 - ((worker.stats?.tasksCompleted || 0) % 10)} more tasks to next level
            </div>
          </div>

          {worker.skills && worker.skills.length > 0 && (
            <div className={styles.skillsSection}>
              <h4>Skills</h4>
              <div className={styles.skillsList}>
                {worker.skills.map((skill, index) => (
                  <span key={index} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardBody>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.earningsIcon}`}>
                <BarChart3 size={20} />
              </div>
              <span className={styles.statTrend}>+12%</span>
            </div>
            <div className={styles.statValue}>
              ₹<AnimatedCounter end={worker.stats?.totalEarnings || 5600} />
            </div>
            <div className={styles.statLabel}>Total Earnings</div>
          </CardBody>
        </Card>

        <Card className={styles.statCard}>
          <CardBody>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.tasksIcon}`}>
                <CheckCircle2 size={20} />
              </div>
              <Trophy size={14} className={styles.statBadge} />
            </div>
            <div className={styles.statValue}>
              <AnimatedCounter end={worker.stats?.tasksCompleted || 4} />
            </div>
            <div className={styles.statLabel}>Tasks Completed</div>
          </CardBody>
        </Card>

        <Card className={styles.statCard}>
          <CardBody>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.ratingIcon}`}>
                <Star size={20} />
              </div>
            </div>
            <div className={styles.statValue}>
              {worker.rating?.averageRating ? worker.rating.averageRating.toFixed(1) : '5.0'}
            </div>
            <div className={styles.statLabel}>Average Rating</div>
          </CardBody>
        </Card>

        <Card className={styles.statCard}>
          <CardBody>
            <div className={styles.statHeader}>
              <div className={`${styles.statIcon} ${styles.streakIcon}`}>
                <Flame size={20} />
              </div>
            </div>
            <div className={styles.statValue}>7</div>
            <div className={styles.statLabel}>Day Streak</div>
          </CardBody>
        </Card>
      </div>

      {/* Action Section */}
      <Card className={styles.actionCard}>
        <CardBody>
          <div className={styles.actionHeader}>
            <h2>Ready for your next task?</h2>
            <p>Browse available tasks that match your skill level</p>
          </div>
          
          <div className={styles.actionButtons}>
            <Button 
              onClick={handleBrowseNewTask} 
              size="lg" 
              className={styles.primaryAction}
            >
              <Eye size={20} />
              Browse Tasks
            </Button>
            
            <div className={styles.actionStats}>
              <div className={styles.actionStat}>
                <Clock size={16} />
                <span>Avg. 45 min tasks</span>
              </div>
              <div className={styles.actionStat}>
                <Gift size={16} />
                <span>₹{badgeInfo?.hourlyRange?.split('-')[1] || '200'}/hour</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Accepted Tasks */}
      {applicationsData?.success && applicationsData?.data?.applications?.filter(app => app.status === 'ACCEPTED')?.length > 0 && (
        <Card className={styles.acceptedTasksCard}>
          <CardHeader>
            <h3><FileText size={20} /> Your Accepted Tasks</h3>
            <p>Tasks you've been accepted for and can start working on</p>
          </CardHeader>
          <CardBody>
            <div className={styles.acceptedTasksList}>
              {applicationsData.data.applications
                .filter(app => app.status === 'ACCEPTED' && app.task)
                .slice(0, 3)
                .map((application) => (
                  <div key={application.id} className={styles.acceptedTaskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskHeader}>
                        <h4 className={styles.taskTitle}>{application.task.title}</h4>
                        <div className={styles.taskMeta}>
                          <span className={styles.taskPay}>₹{application.task.payAmount}</span>
                          <span className={styles.taskDuration}>{application.task.estimatedHours}h</span>
                        </div>
                      </div>
                      <p className={styles.taskDescription}>
                        {application.task.description?.substring(0, 100)}...
                      </p>
                      <div className={styles.taskStatus}>
                        <span className={styles.statusAccepted}>Accepted</span>
                        <span className={styles.appliedDate}>
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.taskActions}>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/tasks/${application.task.id}`)}
                        className={styles.detailsButton}
                      >
                        <ExternalLink size={16} />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              
              {applicationsData.data.applications.filter(app => app.status === 'ACCEPTED').length > 3 && (
                <div className={styles.viewAllTasks}>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/tasks')} 
                  >
                    View All Accepted Tasks ({applicationsData.data.applications.filter(app => app.status === 'ACCEPTED').length})
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Completed Tasks Section */}
      {dashboardData?.success && dashboardData?.data?.completedTasks?.length > 0 && (
        <Card className={styles.completedTasksCard}>
          <CardHeader>
            <h3><CheckCircle2 size={20} /> Completed Tasks</h3>
            <p>Your successfully completed tasks and earnings history</p>
          </CardHeader>
          <CardBody>
            <div className={styles.completedTasksStats}>
              <div className={styles.completedStat}>
                <div className={styles.statValue}>
                  {dashboardData.data.stats?.completedTasks || 0}
                </div>
                <div className={styles.statLabel}>Tasks Completed</div>
              </div>
              <div className={styles.completedStat}>
                <div className={styles.statValue}>
                  ₹{dashboardData.data.stats?.totalEarnings || 0}
                </div>
                <div className={styles.statLabel}>Total Earned</div>
              </div>
              <div className={styles.completedStat}>
                <div className={styles.statValue}>
                  ₹{Math.round(dashboardData.data.stats?.averageTaskValue || 0)}
                </div>
                <div className={styles.statLabel}>Avg per Task</div>
              </div>
            </div>
            
            <div className={styles.completedTasksList}>
              {dashboardData.data.completedTasks
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className={styles.completedTaskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskHeader}>
                        <h4 className={styles.taskTitle}>{task.title}</h4>
                        <div className={styles.taskMeta}>
                          <span className={styles.taskPay}>₹{task.payAmount}</span>
                          <span className={styles.taskCategory}>{task.category}</span>
                        </div>
                      </div>
                      <div className={styles.taskDetails}>
                        <span className={styles.employer}>
                          👤 {task.employer.name}
                          {task.employer.isVerified && <span className={styles.verified}>✓</span>}
                        </span>
                        <span className={styles.completedDate}>
                          Completed: {task.payment.completedAt ? 
                            new Date(task.payment.completedAt).toLocaleDateString() : 
                            new Date(task.appliedAt).toLocaleDateString()
                          }
                        </span>
                      </div>
                      <div className={styles.paymentInfo}>
                        <span className={`${styles.paymentStatus} ${styles[task.payment.status?.toLowerCase()]}`}>
                          {task.payment.status === 'COMPLETED' ? '💰 Paid' : '⏳ Processing'}
                        </span>
                        {task.payment.transactionId && (
                          <span className={styles.transactionId}>
                            ID: {task.payment.transactionId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {dashboardData.data.completedTasks.length > 5 && (
                <div className={styles.viewAllCompleted}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Could navigate to a dedicated completed tasks page
                      console.log('View all completed tasks');
                    }}
                  >
                    View All Completed ({dashboardData.data.completedTasks.length})
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.quickActionGrid}>
          <button className={styles.quickActionItem}>
            <Calendar size={24} />
            <span>View Schedule</span>
          </button>
          <button className={styles.quickActionItem}>
            <BarChart3 size={24} />
            <span>Analytics</span>
          </button>
          <button className={styles.quickActionItem}>
            <Trophy size={24} />
            <span>Achievements</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;