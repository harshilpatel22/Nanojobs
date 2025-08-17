import React, { useState, useEffect } from 'react';
import styles from './TaskDetailPage.module.css';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChatInterface from '../components/task/ChatInterface';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { taskAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
/**
 * TaskDetailPage Component
 * Unified page for both employers and workers to manage accepted tasks
 * Features:
 * - Task details with attachments
 * - File downloads
 * - Worker submission interface
 * - Employer review interface
 * - Real-time status updates
 */
const TaskDetailPage = ({ taskId, userId, userRole }) => {
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [submissionData, setSubmissionData] = useState({
    submissionType: 'mixed',
    textContent: '',
    links: '',
    files: [],
    fileDescriptions: ''
  });
  const [reviewData, setReviewData] = useState({
    status: 'UNDER_REVIEW',
    reviewNote: ''
  });
  const [employerUploadData, setEmployerUploadData] = useState({
    files: [],
    descriptions: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch task details
  useEffect(() => {
    fetchTaskDetails();
  }, [taskId, userId]);

  // Auto-refresh task details every 30 seconds (silent mode)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTaskDetails(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [taskId, userId]);

  const fetchTaskDetails = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      console.log('🔍 DEBUG - Fetching task details:', { taskId, userId, userRole, silent });
      const response = await taskAPI.getBronzeTaskDetails(taskId);
      
      if (response.success) {
        console.log('🔍 DEBUG - Task data received:', {
          task: response.data.task,
          userApplication: response.data.task.userApplication,
          hasUserApplication: !!response.data.task.userApplication,
          silent
        });
        setTask(response.data.task);
        // Clear any existing error on successful fetch
        setError('');
      } else {
        if (!silent) {
          setError(response.message || 'Failed to fetch task details');
        }
      }
    } catch (err) {
      console.error('❌ DEBUG - Task fetch error:', err);
      if (!silent) {
        setError('Network error occurred');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSubmissionData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  // Remove selected file
  const removeFile = (index) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Handle employer file selection
  const handleEmployerFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setEmployerUploadData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  // Remove employer file
  const removeEmployerFile = (index) => {
    setEmployerUploadData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Upload employer attachments
  const handleEmployerFileUpload = async () => {
    if (employerUploadData.files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('descriptions', employerUploadData.descriptions);
      
      // Add files
      employerUploadData.files.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await taskAPI.uploadTaskAttachments(taskId, formData);

      if (response.success) {
        setSuccess('Files uploaded successfully!');
        fetchTaskDetails(); // Refresh task details
        // Clear form
        setEmployerUploadData({
          files: [],
          descriptions: ''
        });
      } else {
        setError(response.message || 'Failed to upload files');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Submit work (Worker)
  const handleSubmitWork = async () => {
    console.log('🔍 DEBUG - Submit work called:', {
      task: task,
      userApplication: task.userApplication,
      applicationId: task.userApplication?.id,
      userId: userId,
      userRole: userRole
    });
    
    if (!task.userApplication?.id) {
      console.log('❌ DEBUG - Application ID not found:', {
        hasTask: !!task,
        hasUserApplication: !!task.userApplication,
        userApplication: task.userApplication,
        taskKeys: task ? Object.keys(task) : 'no task'
      });
      setError('Application ID not found');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Create FormData object for file uploads
      const formData = new FormData();
      formData.append('submissionType', submissionData.submissionType);
      formData.append('textContent', submissionData.textContent);
      formData.append('links', submissionData.links);
      formData.append('fileDescriptions', submissionData.fileDescriptions);

      // Add files to FormData
      submissionData.files.forEach((file) => {
        formData.append('submissions', file);
      });

      const response = await taskAPI.createTaskSubmission(
        task.userApplication.id,
        formData
      );

      if (response.success) {
        setSuccess('Work submitted successfully!');
        fetchTaskDetails(); // Refresh task details
        // Clear form
        setSubmissionData({
          submissionType: 'mixed',
          textContent: '',
          links: '',
          files: [],
          fileDescriptions: ''
        });
      } else {
        setError(response.message || 'Failed to submit work');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Review submission (Employer)
  const handleReviewSubmission = async (submissionId) => {
    try {
      setUploading(true);
      setError('');

      const response = await taskAPI.reviewTaskSubmission(
        submissionId,
        reviewData,
        userId
      );

      if (response.success) {
        setSuccess('Submission reviewed successfully!');
        fetchTaskDetails(); // Refresh task details
        setReviewData({ status: 'UNDER_REVIEW', reviewNote: '' });
      } else {
        setError(response.message || 'Failed to review submission');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Download task attachment
  const downloadTaskAttachment = async (attachmentId, filename) => {
    try {
      await taskAPI.downloadTaskAttachment(taskId, attachmentId, filename);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  // Download submission file
  const downloadSubmissionFile = async (submissionId, fileId, filename) => {
    try {
      await taskAPI.downloadSubmissionFile(submissionId, fileId, filename, userId);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'APPLIED': return styles.statusApplied;
      case 'ACCEPTED': return styles.statusAccepted;
      case 'COMPLETED': return styles.statusCompleted;
      case 'REJECTED': return styles.statusRejected;
      case 'SUBMITTED': return styles.statusSubmitted;
      case 'APPROVED': return styles.statusApproved;
      case 'REVISION_REQUESTED': return styles.statusRevision;
      default: return styles.statusDefault;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p className={styles.loadingText}>Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.errorContainer}>
        <Card className={styles.errorCard}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Task Not Found</h3>
            <p className={styles.errorMessage}>The requested task could not be found.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/tasks')}
              className={styles.backButton}
            />
            <div className={styles.taskInfo}>
              <h1 className={styles.title}>{task.title}</h1>
              <p className={styles.category}>{task.categoryDisplay}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Button 
              variant="ghost" 
              icon={RefreshCw} 
              onClick={() => fetchTaskDetails()}
              className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
              disabled={loading}
              title={refreshing ? "Auto-refreshing..." : "Refresh task data"}
            />
            <div className={`${styles.status} ${getStatusClass(task.userApplication?.status || 'AVAILABLE')}`}>
              {task.userApplication?.status || 'AVAILABLE'}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.alertIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successAlert}>
            <span className={styles.alertIcon}>✅</span>
            <span>{success}</span>
          </div>
        )}

        <div className={styles.layout}>
          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Tab Navigation */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'attachments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('attachments')}
              >
                Files
              </button>
              {userRole === 'applicant' && (
                <button
                  className={`${styles.tab} ${activeTab === 'submit' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('submit')}
                >
                  Submit Work
                </button>
              )}
              {userRole === 'employer' && (
                <button
                  className={`${styles.tab} ${activeTab === 'submissions' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('submissions')}
                >
                  Submissions
                </button>
              )}
              {task && !loading && (
                ((userRole === 'applicant' && task.userApplication?.status === 'ACCEPTED') || 
                 (userRole === 'employer' && task.allApplications?.some(app => app.status === 'ACCEPTED')))
              ) ? (
                <button
                  className={`${styles.tab} ${activeTab === 'chat' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  💬 Chat
                </button>
              ) : null}
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className={styles.tabContent}>
                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Task Description</h3>
                  <div className={styles.description}>
                    <p>{task.description}</p>
                  </div>
                </Card>

                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Requirements</h3>
                  <div className={styles.requirements}>
                    <div className={styles.requirementItem}>
                      <span className={styles.requirementLabel}>Duration:</span>
                      <span>{task.estimatedHours} hours</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={styles.requirementLabel}>Payment:</span>
                      <span>₹{task.payAmount}</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={styles.requirementLabel}>Difficulty:</span>
                      <span className={styles.badge}>{task.difficulty}</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={styles.requirementLabel}>Industry:</span>
                      <span className={styles.badge}>{task.industry}</span>
                    </div>
                  </div>
                  
                  {task.skillTags && task.skillTags.length > 0 && (
                    <div className={styles.skillTags}>
                      <span className={styles.requirementLabel}>Required Skills:</span>
                      <div className={styles.tags}>
                        {task.skillTags.map((skill, index) => (
                          <span key={index} className={styles.tag}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className={styles.tabContent}>
                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Task Attachments</h3>
                  <p className={styles.sectionSubtitle}>Files provided by the employer</p>
                  
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className={styles.attachmentsList}>
                      {task.attachments.map((attachment) => (
                        <div key={attachment.id} className={styles.attachmentItem}>
                          <div className={styles.attachmentInfo}>
                            <div className={styles.fileIcon}>📎</div>
                            <div className={styles.fileDetails}>
                              <p className={styles.fileName}>{attachment.fileName}</p>
                              <p className={styles.fileMetadata}>
                                {formatFileSize(attachment.fileSize)} • {attachment.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => downloadTaskAttachment(
                              attachment.id,
                              attachment.fileName
                            )}
                            className={styles.downloadBtn}
                          >
                            📥 Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📄</div>
                      <p>No attachments provided for this task</p>
                    </div>
                  )}
                </Card>

                {/* Employer File Upload Section */}
                {userRole === 'employer' && (
                  <Card className={styles.detailCard}>
                    <h3 className={styles.sectionTitle}>Upload Additional Files</h3>
                    <p className={styles.sectionSubtitle}>Add more files to help workers complete this task</p>
                    
                    <div className={styles.employerUploadForm}>
                      {/* File Upload */}
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Upload Files</label>
                        <div className={styles.fileUploadArea}>
                          <input
                            type="file"
                            multiple
                            onChange={handleEmployerFileSelect}
                            className={styles.fileInput}
                            id="employer-file-upload"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                          />
                          <label htmlFor="employer-file-upload" className={styles.fileUploadLabel}>
                            <div className={styles.uploadIcon}>📁</div>
                            <p className={styles.uploadText}>Click to upload files or drag and drop</p>
                            <p className={styles.uploadSubtext}>
                              PDF, Word, Excel, PowerPoint, Images, ZIP (Max 10MB per file)
                            </p>
                          </label>
                        </div>

                        {/* Selected Files */}
                        {employerUploadData.files.length > 0 && (
                          <div className={styles.selectedFiles}>
                            <p className={styles.filesLabel}>Selected Files ({employerUploadData.files.length})</p>
                            {employerUploadData.files.map((file, index) => (
                              <div key={index} className={styles.fileItem}>
                                <div className={styles.fileInfo}>
                                  <span className={styles.fileIcon}>📄</span>
                                  <div className={styles.fileDetails}>
                                    <p className={styles.fileName}>{file.name}</p>
                                    <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeEmployerFile(index)}
                                  className={styles.removeBtn}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* File Descriptions */}
                        {employerUploadData.files.length > 0 && (
                          <div className={styles.formGroup}>
                            <label className={styles.label}>File Descriptions (Optional)</label>
                            <input
                              type="text"
                              placeholder="Brief descriptions for files, separated by commas..."
                              value={employerUploadData.descriptions}
                              onChange={(e) => setEmployerUploadData(prev => ({ ...prev, descriptions: e.target.value }))}
                              className={styles.input}
                            />
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      {employerUploadData.files.length > 0 && (
                        <Button
                          onClick={handleEmployerFileUpload}
                          disabled={uploading}
                          className={styles.uploadBtn}
                          size="lg"
                        >
                          {uploading ? (
                            <span>Uploading...</span>
                          ) : (
                            <span>📤 Upload Files</span>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Submit Work Tab (Worker Only) */}
            {userRole === 'applicant' && activeTab === 'submit' && (
              <div className={styles.tabContent}>
                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Submit Your Work</h3>
                  <p className={styles.sectionSubtitle}>Upload files, add text, or provide links</p>
                  
                  {/* Current Submission Status */}
                  {task.userApplication?.submission && (
                    <div className={styles.submissionStatus}>
                      <div className={styles.statusHeader}>
                        <span className={styles.statusIcon}>👁️</span>
                        <span className={styles.statusLabel}>Current Submission</span>
                        <span className={`${styles.statusBadge} ${getStatusClass(task.userApplication.submission.status)}`}>
                          {task.userApplication.submission.status}
                        </span>
                      </div>
                      <p className={styles.statusText}>
                        Submitted on {new Date(task.userApplication.submission.submittedAt).toLocaleDateString()}
                      </p>
                      {task.userApplication.submission.reviewNote && (
                        <div className={styles.feedback}>
                          <span className={styles.feedbackLabel}>Employer Feedback:</span>
                          <p className={styles.feedbackText}>{task.userApplication.submission.reviewNote}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.submissionForm}>
                    {/* Submission Type */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Submission Type</label>
                      <select
                        value={submissionData.submissionType}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, submissionType: e.target.value }))}
                        className={styles.select}
                      >
                        <option value="file">Files Only</option>
                        <option value="text">Text Only</option>
                        <option value="link">Links Only</option>
                        <option value="mixed">Mixed (Files + Text + Links)</option>
                      </select>
                    </div>

                    {/* Text Content */}
                    {(submissionData.submissionType === 'text' || submissionData.submissionType === 'mixed') && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Text Content</label>
                        <textarea
                          placeholder="Describe your work, provide explanations, or add notes..."
                          value={submissionData.textContent}
                          onChange={(e) => setSubmissionData(prev => ({ ...prev, textContent: e.target.value }))}
                          className={styles.textarea}
                          rows={6}
                        />
                      </div>
                    )}

                    {/* Links */}
                    {(submissionData.submissionType === 'link' || submissionData.submissionType === 'mixed') && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Links (Dropbox, Google Drive, etc.)</label>
                        <textarea
                          placeholder="Enter links separated by new lines..."
                          value={submissionData.links}
                          onChange={(e) => setSubmissionData(prev => ({ ...prev, links: e.target.value }))}
                          className={styles.textarea}
                          rows={3}
                        />
                      </div>
                    )}

                    {/* File Upload */}
                    {(submissionData.submissionType === 'file' || submissionData.submissionType === 'mixed') && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Upload Files</label>
                        <div className={styles.fileUploadArea}>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className={styles.fileInput}
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                          />
                          <label htmlFor="file-upload" className={styles.fileUploadLabel}>
                            <div className={styles.uploadIcon}>📁</div>
                            <p className={styles.uploadText}>Click to upload files or drag and drop</p>
                            <p className={styles.uploadSubtext}>
                              PDF, Word, Excel, PowerPoint, Images, ZIP (Max 20MB)
                            </p>
                          </label>
                        </div>

                        {/* Selected Files */}
                        {submissionData.files.length > 0 && (
                          <div className={styles.selectedFiles}>
                            <p className={styles.filesLabel}>Selected Files ({submissionData.files.length})</p>
                            {submissionData.files.map((file, index) => (
                              <div key={index} className={styles.fileItem}>
                                <div className={styles.fileInfo}>
                                  <span className={styles.fileIcon}>📄</span>
                                  <div className={styles.fileDetails}>
                                    <p className={styles.fileName}>{file.name}</p>
                                    <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFile(index)}
                                  className={styles.removeBtn}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* File Descriptions */}
                        {submissionData.files.length > 0 && (
                          <div className={styles.formGroup}>
                            <label className={styles.label}>File Descriptions (Optional)</label>
                            <input
                              type="text"
                              placeholder="Brief description for each file, separated by commas..."
                              value={submissionData.fileDescriptions}
                              onChange={(e) => setSubmissionData(prev => ({ ...prev, fileDescriptions: e.target.value }))}
                              className={styles.input}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitWork}
                      disabled={uploading}
                      className={styles.submitBtn}
                      size="lg"
                    >
                      {uploading ? (
                        <span>Submitting...</span>
                      ) : (
                        <span>📤 Submit Work</span>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Submissions Tab (Employer Only) */}
            {userRole === 'employer' && activeTab === 'submissions' && (
              <div className={styles.tabContent}>
                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Worker Submissions</h3>
                  <p className={styles.sectionSubtitle}>Review and manage submitted work</p>
                  
                  {task.allApplications && task.allApplications.filter(app => app.submission).length > 0 ? (
                    <div className={styles.submissionsList}>
                      {task.allApplications
                        .filter(app => app.submission)
                        .map((application) => (
                          <div key={application.id} className={styles.submissionCard}>
                            <div className={styles.submissionHeader}>
                              <div className={styles.workerInfo}>
                                <div className={styles.workerAvatar}>👤</div>
                                <div className={styles.workerDetails}>
                                  <h4 className={styles.workerName}>{application.worker.name}</h4>
                                  <p className={styles.workerStats}>
                                    {application.worker.tasksCompleted} tasks completed • 
                                    ⭐ {application.worker.averageRating?.toFixed(1) || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <span className={`${styles.statusBadge} ${getStatusClass(application.submission.status)}`}>
                                {application.submission.status}
                              </span>
                            </div>

                            {/* Submission Content */}
                            <div className={styles.submissionContent}>
                              {application.submission.textContent && (
                                <div className={styles.submissionSection}>
                                  <label className={styles.sectionLabel}>Text Submission</label>
                                  <div className={styles.textSubmission}>
                                    <p>{application.submission.textContent}</p>
                                  </div>
                                </div>
                              )}

                              {application.submission.files && application.submission.files.length > 0 && (
                                <div className={styles.submissionSection}>
                                  <label className={styles.sectionLabel}>Submitted Files</label>
                                  <div className={styles.submissionFiles}>
                                    {application.submission.files.map((file) => (
                                      <div key={file.id} className={styles.submissionFile}>
                                        <div className={styles.fileInfo}>
                                          <span className={styles.fileIcon}>📄</span>
                                          <div className={styles.fileDetails}>
                                            <p className={styles.fileName}>{file.fileName}</p>
                                            <p className={styles.fileMetadata}>
                                              {formatFileSize(file.fileSize)} • {file.description}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => downloadSubmissionFile(
                                            application.submission.id,
                                            file.id,
                                            file.fileName
                                          )}
                                          className={styles.downloadBtn}
                                        >
                                          📥 Download
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Review Interface */}
                              {application.submission.status === 'SUBMITTED' && (
                                <div className={styles.reviewSection}>
                                  <label className={styles.sectionLabel}>Review Submission</label>
                                  <div className={styles.reviewForm}>
                                    <div className={styles.reviewControls}>
                                      <select
                                        value={reviewData.status}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                                        className={styles.select}
                                      >
                                        <option value="UNDER_REVIEW">Under Review</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REVISION_REQUESTED">Request Revision</option>
                                        <option value="REJECTED">Rejected</option>
                                      </select>
                                      <Button
                                        onClick={() => handleReviewSubmission(application.submission.id)}
                                        disabled={uploading}
                                        className={styles.reviewBtn}
                                      >
                                        {uploading ? 'Processing...' : 'Submit Review'}
                                      </Button>
                                    </div>
                                    <textarea
                                      placeholder="Add feedback or notes for the worker..."
                                      value={reviewData.reviewNote}
                                      onChange={(e) => setReviewData(prev => ({ ...prev, reviewNote: e.target.value }))}
                                      className={styles.textarea}
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>💬</div>
                      <p>No submissions yet</p>
                      <p className={styles.emptySubtext}>Workers will submit their work here</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Chat Tab (For Accepted Tasks) */}
            {activeTab === 'chat' && (
              <div className={styles.tabContent}>
                <Card className={styles.detailCard}>
                  <h3 className={styles.sectionTitle}>Task Chat</h3>
                  <p className={styles.sectionSubtitle}>
                    Secure encrypted messaging between employer and worker
                  </p>
                  
                  <div className={styles.chatWrapper}>
                    <ChatInterface
                      taskId={taskId}
                      userId={userId}
                      userRole={userRole}
                      isActive={
                        task && !loading && (
                          (userRole === 'applicant' && task.userApplication?.status === 'ACCEPTED') || 
                          (userRole === 'employer' && task.allApplications?.some(app => app.status === 'ACCEPTED'))
                        )
                      }
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Task Info Card */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Task Information</h3>
              <div className={styles.taskMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>💰</span>
                  <span className={styles.metaValue}>₹{task.payAmount}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>🕐</span>
                  <span className={styles.metaValue}>{task.estimatedHours} hours</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>📅</span>
                  <span className={styles.metaValue}>{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                
                {/* Payment Status */}
                <div className={styles.paymentStatus}>
                  <h4 className={styles.statusTitle}>Payment Status</h4>
                  <div className={styles.statusInfo}>
                    <span className={`${styles.statusBadge} ${getStatusClass(task.payment.status)}`}>
                      {task.payment.status}
                    </span>
                    {task.payment.transactionId && (
                      <span className={styles.transactionId}>
                        {task.payment.transactionId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Employer/Worker Info */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>
                {userRole === 'employer' ? 'Your Task' : 'Employer'}
              </h3>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>👤</div>
                <div className={styles.userDetails}>
                  <p className={styles.userName}>{task.employer.name}</p>
                  {task.employer.isVerified && (
                    <div className={styles.verifiedBadge}>
                      <span className={styles.verifyIcon}>✅</span>
                      <span>Verified</span>
                    </div>
                  )}
                  {task.employer.phone && (
                    <div className={styles.contactInfo}>
                      <span className={styles.phoneIcon}>📞</span>
                      <span>{task.employer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Task Progress Status */}
            <Card className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Task Progress</h3>
              <div className={styles.progressStats}>
                <div className={styles.progressItem}>
                  <span className={styles.progressLabel}>Status:</span>
                  <span className={`${styles.progressStatus} ${getStatusClass(task.userApplication?.status || 'AVAILABLE')}`}>
                    {task.userApplication?.status || 'AVAILABLE'}
                  </span>
                </div>
                <div className={styles.progressItem}>
                  <span className={styles.progressLabel}>Applied:</span>
                  <span className={styles.progressValue}>
                    {task.userApplication?.appliedAt 
                      ? new Date(task.userApplication.appliedAt).toLocaleDateString()
                      : 'Not applied'
                    }
                  </span>
                </div>
                {task.userApplication?.submission && (
                  <div className={styles.progressItem}>
                    <span className={styles.progressLabel}>Submitted:</span>
                    <span className={styles.progressValue}>
                      {new Date(task.userApplication.submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;