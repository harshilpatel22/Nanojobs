import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  User, 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
  Send,
  DollarSign,
  Shield,
  FileText,
  MessageCircle,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../common/Button';
import Card, { CardHeader, CardBody } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { taskAPI, apiUtils } from '../../utils/api';

import styles from './ApplicationManagement.module.css';

/**
 * Application Management Component
 * Handles the complete employer workflow for bronze tasks:
 * 1. View applications
 * 2. Accept/reject workers  
 * 3. MessageCircle integration
 * 4. Complete tasks and release payments
 */

const ApplicationManagement = ({ taskId, employerId, onClose, onTaskComplete }) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showMessageCircle, setShowMessageCircle] = useState(false);
  const [completionData, setCompletionData] = useState({
    rating: 5,
    feedback: ''
  });

  // Fetch task applications
  const { data: applicationsData, isLoading, error, refetch } = useQuery(
    ['bronze-task-applications', taskId],
    () => taskAPI.getBronzeTaskApplications(taskId),
    {
      enabled: !!taskId,
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error) => {
        console.error('Failed to fetch applications:', error);
        toast.error('Failed to load applications');
      }
    }
  );

  // Fetch MessageCircle connection details for accepted tasks
  const { data: whatsappData } = useQuery(
    ['whatsapp-connection', taskId],
    () => taskAPI.getWhatsAppConnection(taskId),
    {
      enabled: !!taskId && !!applicationsData?.data?.applications?.some(app => app.status === 'ACCEPTED'), // ✅ FIXED
      refetchInterval: 10000,
      retry: false
    }
  );
  // Update application status mutation
  const updateStatusMutation = useMutation(
    ({ applicationId, status, note }) => 
      taskAPI.updateBronzeTaskApplicationStatus(taskId, applicationId, status, note),
    {
      onSuccess: (data, variables) => {
        const { status } = variables;
        toast.success(data.message || `Application ${status.toLowerCase()} successfully`);
        
        // Show WhatsApp connection if accepted
        if (status === 'ACCEPTED' && data.data.whatsappConnection) {
          setShowMessageCircle(true);
          toast.success('🎉 Worker accepted! WhatsApp connection established.');
        }
        
        refetch();
        queryClient.invalidateQueries(['employer-tasks']);
      },
      onError: (error) => {
        console.error('Failed to update application status:', error);
        toast.error('Failed to update application status');
      }
    }
  );

  // Complete task mutation
  const completeTaskMutation = useMutation(
    ({ workerId, rating, feedback }) => 
      taskAPI.completeBronzeTask(taskId, workerId, rating, feedback),
    {
      onSuccess: (data) => {
        toast.success('🎉 Task completed and payment released!');
        refetch();
        queryClient.invalidateQueries(['employer-tasks']);
        
        if (onTaskComplete) {
          onTaskComplete(data.data);
        }
      },
      onError: (error) => {
        console.error('Failed to complete task:', error);
        toast.error('Failed to complete task');
      }
    }
  );

  /**
   * Check if task has an accepted application
   */
  /**
 * Check if task has an accepted application
 */
const hasAcceptedApplication = () => {
  return applicationsData?.data?.applications?.some(app => app.status === 'ACCEPTED') || false;
};

  /**
   * Get accepted application
   */
  const getAcceptedApplication = () => {
    return applicationsData?.data?.applications?.find(app => app.status === 'ACCEPTED');
  };

  /**
   * Handle accept application
   */
  const handleAcceptApplication = (application) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status: 'ACCEPTED',
      note: `Worker ${application.worker.name} accepted for this task`
    });
  };

  /**
   * Handle reject application
   */
  const handleRejectApplication = (application) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status: 'REJECTED',
      note: `Application rejected`
    });
  };

  /**
   * Handle complete task
   */
  const handleCompleteTask = () => {
    const acceptedApp = getAcceptedApplication();
    if (!acceptedApp) {
      toast.error('No accepted worker found');
      return;
    }

    completeTaskMutation.mutate({
      workerId: acceptedApp.worker.id,
      rating: completionData.rating,
      feedback: completionData.feedback || 'Task completed successfully'
    });
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const statusConfig = {
      APPLIED: { color: 'var(--warning)', bg: 'rgba(255, 184, 0, 0.15)', text: 'Applied', icon: Clock },
      ACCEPTED: { color: 'var(--success)', bg: 'rgba(0, 200, 150, 0.15)', text: 'Accepted', icon: CheckCircle },
      REJECTED: { color: 'var(--error)', bg: 'rgba(229, 62, 62, 0.15)', text: 'Rejected', icon: XCircle },
      COMPLETED: { color: 'var(--primary)', bg: 'rgba(0, 102, 255, 0.15)', text: 'Completed', icon: Award }
    };

    const config = statusConfig[status] || statusConfig.APPLIED;
    const IconComponent = config.icon;
    
    return (
      <span 
        className={styles.statusBadge}
        style={{ 
          color: config.color, 
          backgroundColor: config.bg,
          border: `1px solid ${config.color}40`
        }}
      >
        <IconComponent size={12} />
        {config.text}
      </span>
    );
  };

  /**
   * Get badge styling
   */
  const getBadgeStyle = (badge) => {
    const badgeStyles = {
      BRONZE: { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)' },
      SILVER: { color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)' },
      GOLD: { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
      PLATINUM: { color: '#E5E4E2', bg: 'rgba(229, 228, 226, 0.15)' }
    };

    return badgeStyles[badge] || badgeStyles.BRONZE;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  if (error) {
    return (
      <Card className={styles.errorCard}>
        <CardBody>
          <div className={styles.errorContent}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h3>Failed to Load Applications</h3>
            <p>Unable to fetch applications for this task.</p>
            <Button onClick={refetch} icon={RefreshCw}>
              Try Again
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { applications, stats, bronzeTask } = applicationsData?.data || {};
  const acceptedApp = getAcceptedApplication();
  const whatsappConnection = whatsappData?.data?.whatsapp;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h2>Manage Applications</h2>
          <p>{bronzeTask?.title}</p>
          <div className={styles.taskMeta}>
            <span>💰 ₹{bronzeTask?.payAmount?.toLocaleString()}</span>
            <span>📋 {applications?.length || 0} applications</span>
            {acceptedApp && (
              <span className={styles.acceptedIndicator}>
                ✅ Worker accepted
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Statistics */}
      <Card className={styles.statsCard}>
        <CardBody>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.totalApplications || 0}</div>
              <div className={styles.statLabel}>Total Applications</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.byStatus?.APPLIED || 0}</div>
              <div className={styles.statLabel}>Pending Review</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.byStatus?.ACCEPTED || 0}</div>
              <div className={styles.statLabel}>Accepted</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats?.byStatus?.COMPLETED || 0}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* WhatsApp Connection (if task accepted) */}
      {acceptedApp && whatsappConnection && (
        <Card className={styles.whatsappCard}>
          <CardHeader
            title="🎉 Worker Connected!"
            subtitle={`${acceptedApp.worker.name} is now working on your task`}
            action={
              <Button 
                variant="success" 
                icon={MessageCircle}
                onClick={() => setShowMessageCircle(!showMessageCircle)}
              >
                WhatsApp Chat
              </Button>
            }
          />
          {showMessageCircle && (
            <CardBody>
              <div className={styles.whatsappDetails}>
                <div className={styles.whatsappHeader}>
                  <MessageCircle size={24} />
                  <div>
                    <h4>{whatsappConnection.groupName}</h4>
                    <p>Secure communication channel</p>
                  </div>
                </div>
                
                <div className={styles.participants}>
                  <h5>Participants:</h5>
                  {whatsappConnection.participants?.map((participant, index) => (
                    <div key={index} className={styles.participant}>
                      <User size={16} />
                      <span>{participant.name}</span>
                      <span className={styles.role}>({participant.role})</span>
                    </div>
                  ))}
                </div>

                <div className={styles.instructions}>
                  <h5>Instructions:</h5>
                  <div className={styles.instructionsList}>
  {(typeof whatsappConnection.instructions === 'string' 
    ? whatsappConnection.instructions.split('\n') 
    : Array.isArray(whatsappConnection.instructions) 
      ? whatsappConnection.instructions 
      : [whatsappConnection.instructions]
  )?.map((instruction, index) => (
    <div key={index} className={styles.instruction}>
      {instruction}
    </div>
  ))}
</div>
                </div>

                <div className={styles.whatsappActions}>
                  <Button 
                    variant="success" 
                    icon={MessageCircle}
                    onClick={() => window.open(whatsappConnection.inviteLink, '_blank')}
                  >
                    Open WhatsApp Chat
                  </Button>
                  <Button 
                    variant="primary" 
                    icon={CheckCircle}
                    onClick={() => setSelectedApplication({ type: 'complete', app: acceptedApp })}
                  >
                    Task Complete - Release Payment
                  </Button>
                </div>
              </div>
            </CardBody>
          )}
        </Card>
      )}

      {/* Applications List */}
      <Card className={styles.applicationsCard}>
        <CardHeader
          title="Applications"
          subtitle={`${applications?.length || 0} workers applied for this task`}
          action={
            <Button variant="ghost" icon={RefreshCw} onClick={refetch}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          {!applications || applications.length === 0 ? (
            <div className={styles.emptyState}>
              <User size={48} className={styles.emptyIcon} />
              <h3>No Applications Yet</h3>
              <p>Workers haven't applied for this task yet. Check back later.</p>
            </div>
          ) : (
            <div className={styles.applicationsList}>
              {applications.map((application) => (
                <div key={application.id} className={styles.applicationItem}>
                  <div className={styles.applicationHeader}>
                    <div className={styles.workerInfo}>
                      <div className={styles.workerAvatar}>
                        <User size={20} />
                      </div>
                      <div className={styles.workerDetails}>
                        <h4>{application.worker.name}</h4>
                        <div className={styles.workerMeta}>
                          <span 
                            className={styles.badge}
                            style={getBadgeStyle(application.worker.badge)}
                          >
                            <Award size={12} />
                            {application.worker.badge}
                          </span>
                          <span>📈 {application.worker.tasksCompleted} tasks</span>
                          {application.worker.averageRating > 0 && (
                            <span>⭐ {application.worker.averageRating.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.applicationStatus}>
                      {getStatusBadge(application.status)}
                      <span className={styles.appliedTime}>
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.applicationContent}>
                    <div className={styles.workerSkills}>
                      <h5>Skills:</h5>
                      <div className={styles.skillTags}>
                        {application.worker.skills?.map((skill, index) => (
                          <span key={index} className={styles.skillTag}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.applicationMessage}>
                      <h5>Application Message:</h5>
                      <p>{application.message}</p>
                    </div>

                    <div className={styles.workerStats}>
                      <div className={styles.workerStat}>
                        <TrendingUp size={16} />
                        <span>{application.worker.tasksCompleted} completed</span>
                      </div>
                      <div className={styles.workerStat}>
                        <Award size={16} />
                        <span>{application.worker.experienceLevel}</span>
                      </div>
                      {application.worker.averageRating > 0 && (
                        <div className={styles.workerStat}>
                          <Star size={16} />
                          <span>{application.worker.averageRating.toFixed(1)} rating</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.applicationActions}>
                    {application.status === 'APPLIED' && !acceptedApp && (
                      <>
                        <Button
                          variant="success"
                          icon={CheckCircle}
                          onClick={() => handleAcceptApplication(application)}
                          disabled={updateStatusMutation.isLoading}
                        >
                          Accept Worker
                        </Button>
                        <Button
                          variant="outline"
                          icon={XCircle}
                          onClick={() => handleRejectApplication(application)}
                          disabled={updateStatusMutation.isLoading}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {application.status === 'ACCEPTED' && (
                      <div className={styles.acceptedActions}>
                        <Button
                          variant="outline"
                          icon={MessageCircle}
                          onClick={() => setShowMessageCircle(true)}
                        >
                          View MessageCircle
                        </Button>
                        <Button
                          variant="primary"
                          icon={Send}
                          onClick={() => setSelectedApplication({ type: 'complete', app: application })}
                        >
                          Complete Task
                        </Button>
                      </div>
                    )}

                    {application.status === 'COMPLETED' && (
                      <div className={styles.completedStatus}>
                        <CheckCircle size={16} />
                        <span>Task completed and paid</span>
                      </div>
                    )}

                    {application.status === 'REJECTED' && (
                      <div className={styles.rejectedStatus}>
                        <XCircle size={16} />
                        <span>Application rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Task Completion Modal */}
      {selectedApplication?.type === 'complete' && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <Card className={styles.completionCard}>
              <CardHeader
                title="Complete Task & Release Payment"
                subtitle={`Finishing task for ${selectedApplication.app.worker.name}`}
              />
              <CardBody>
                <div className={styles.completionForm}>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentAmount}>
                      <DollarSign size={24} />
                      <div>
                        <div className={styles.amount}>₹{bronzeTask?.payAmount?.toLocaleString()}</div>
                        <div className={styles.amountLabel}>Will be released to worker</div>
                      </div>
                      <Shield size={20} className={styles.secureIcon} />
                    </div>
                  </div>

                  <div className={styles.ratingSection}>
                    <label>Rate the work quality:</label>
                    <div className={styles.starRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`${styles.star} ${star <= completionData.rating ? styles.active : ''}`}
                          onClick={() => setCompletionData(prev => ({ ...prev, rating: star }))}
                        >
                          <Star size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.feedbackSection}>
                    <label>Feedback (optional):</label>
                    <textarea
                      className={styles.feedbackInput}
                      placeholder="How was the work quality? Any feedback for the worker?"
                      value={completionData.feedback}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, feedback: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className={styles.completionActions}>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApplication(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="success"
                      icon={Send}
                      onClick={handleCompleteTask}
                      disabled={completeTaskMutation.isLoading}
                    >
                      {completeTaskMutation.isLoading ? 'Processing...' : 'Complete & Pay'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;