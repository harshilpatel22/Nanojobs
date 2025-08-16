import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MessageCircle,
  Phone,
  Video,
  Paperclip,
  Send,
  Clock,
  CheckCircle,
  User,
  DollarSign,
  FileText,
  Download,
  ExternalLink,
  Users,
  Shield,
  AlertCircle,
  RefreshCw,
  Minimize2,
  Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../common/Button';
import Card, { CardHeader, CardBody } from '../common/Card';
import { taskAPI, bronzeTaskUtils } from '../../utils/api';

import styles from './WhatsAppIntegration.module.css';

/**
 * WhatsApp Integration Component
 * Simulates WhatsApp communication for bronze task workflow
 * Shows secure communication channel between employer and worker
 */

const WhatsAppIntegration = ({ 
  taskId, 
  userType = 'employer', // 'employer' or 'worker'
  userId,
  onTaskComplete,
  isMinimized = false,
  onToggleMinimize
}) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mockMessages, setMockMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Fetch WhatsApp connection details
  const { data: whatsappData, isLoading, refetch } = useQuery(
    ['whatsapp-connection', taskId],
    () => taskAPI.getWhatsAppConnection(taskId),
    {
      enabled: !!taskId,
      refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
      onSuccess: (data) => {
        if (data.success && data.data.whatsapp) {
          initializeMockMessages(data.data.whatsapp, data.data.task);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch WhatsApp connection:', error);
        setConnectionStatus('disconnected');
      }
    }
  );

  // Send message mutation (mock)
  const sendMessageMutation = useMutation(
    (messageData) => taskAPI.sendWhatsAppWebhook('message_received', taskId, messageData.text, messageData.sender),
    {
      onSuccess: () => {
        setNewMessage('');
        // Add message to local state for immediate UI update
        const message = {
          id: Date.now(),
          text: newMessage,
          sender: userType,
          timestamp: new Date(),
          type: 'text',
          status: 'sent'
        };
        setMockMessages(prev => [...prev, message]);
        
        // Simulate other user typing response
        setTimeout(() => {
          simulateResponse();
        }, 2000);
      },
      onError: (error) => {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
      }
    }
  );

  /**
   * Initialize mock messages based on task data
   */
  const initializeMockMessages = (whatsapp, task) => {
    if (mockMessages.length > 0) return; // Already initialized

    const initialMessages = [
      {
        id: 1,
        text: `🎉 Welcome to the task workspace for "${task.title}"!`,
        sender: 'system',
        timestamp: new Date(Date.now() - 10000),
        type: 'system'
      },
      {
        id: 2,
        text: `💰 Payment of ₹${task.payAmount?.toLocaleString()} is secured in escrow`,
        sender: 'system',
        timestamp: new Date(Date.now() - 9000),
        type: 'system'
      },
      {
        id: 3,
        text: whatsapp.instructions,
        sender: 'system',
        timestamp: new Date(Date.now() - 8000),
        type: 'system'
      }
    ];

    // Add participant introductions
    whatsapp.participants?.forEach((participant, index) => {
      if (participant.role !== userType) {
        initialMessages.push({
          id: 10 + index,
          text: `👋 Hi! I'm ${participant.name} (${participant.role}). Looking forward to working together!`,
          sender: participant.role,
          timestamp: new Date(Date.now() - 7000 + (index * 1000)),
          type: 'text',
          status: 'delivered'
        });
      }
    });

    setMockMessages(initialMessages);
  };

  /**
   * Simulate response from other user
   */
  const simulateResponse = () => {
    const otherUserType = userType === 'employer' ? 'worker' : 'employer';
    
    const responses = {
      employer: [
        "Thanks for the message! I'll review the details and get started.",
        "I have a question about the requirements. Could you clarify?",
        "Work is progressing well. I'll share updates soon.",
        "Task is almost complete. Will submit for review shortly.",
        "Thank you for the clear instructions!"
      ],
      worker: [
        "Received your message. The work looks good so far!",
        "Please feel free to ask if you need any clarifications.",
        "I'll review your submission and provide feedback.",
        "Great work! Everything looks perfect.",
        "Payment will be released once we confirm completion."
      ]
    };

    const randomResponse = responses[otherUserType][Math.floor(Math.random() * responses[otherUserType].length)];
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response = {
        id: Date.now(),
        text: randomResponse,
        sender: otherUserType,
        timestamp: new Date(),
        type: 'text',
        status: 'delivered'
      };
      setMockMessages(prev => [...prev, response]);
    }, 3000);
  };

  /**
   * Handle send message
   */
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      text: newMessage,
      sender: userType
    });
  };

  /**
   * Handle file upload simulation
   */
  const handleFileUpload = () => {
    const fileMessage = {
      id: Date.now(),
      text: "📎 File uploaded: task_progress.pdf",
      sender: userType,
      timestamp: new Date(),
      type: 'file',
      status: 'sent',
      fileName: 'task_progress.pdf',
      fileSize: '2.4 MB'
    };
    
    setMockMessages(prev => [...prev, fileMessage]);
    toast.success('File uploaded successfully');
  };

  /**
   * Handle task completion
   */
  const handleTaskComplete = () => {
    if (userType === 'employer' && onTaskComplete) {
      onTaskComplete();
    } else {
      // Worker indicates task is complete
      const completionMessage = {
        id: Date.now(),
        text: "✅ Task completed! Please review and release payment when satisfied.",
        sender: userType,
        timestamp: new Date(),
        type: 'completion',
        status: 'sent'
      };
      
      setMockMessages(prev => [...prev, completionMessage]);
      toast.success('Task completion notification sent');
    }
  };

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mockMessages]);

  /**
   * Get user avatar
   */
  const getUserAvatar = (sender) => {
    const colors = {
      employer: '#3b82f6',
      worker: '#10b981',
      system: '#6b7280'
    };
    
    return (
      <div 
        className={styles.userAvatar}
        style={{ backgroundColor: colors[sender] || '#6b7280' }}
      >
        {sender === 'system' ? '🤖' : <User size={16} />}
      </div>
    );
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <Card className={styles.loadingCard}>
        <CardBody>
          <div className={styles.loadingContent}>
            <MessageCircle size={32} className={styles.loadingIcon} />
            <p>Connecting to WhatsApp...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!whatsappData?.success) {
    return (
      <Card className={styles.errorCard}>
        <CardBody>
          <div className={styles.errorContent}>
            <AlertCircle size={32} className={styles.errorIcon} />
            <h3>WhatsApp Connection Not Available</h3>
            <p>This feature is available once a worker is accepted for the task.</p>
            <Button onClick={refetch} icon={RefreshCw}>
              Try Again
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const { whatsapp, task } = whatsappData.data;

  return (
    <Card className={`${styles.whatsappCard} ${isMinimized ? styles.minimized : ''}`}>
      <CardHeader
        title={
          <div className={styles.headerTitle}>
            <MessageCircle size={20} />
            <span>{whatsapp.groupName}</span>
            <div className={styles.connectionStatus}>
              <div className={`${styles.statusDot} ${styles[connectionStatus]}`} />
              <span>{connectionStatus}</span>
            </div>
          </div>
        }
        subtitle={`Secure communication for ₹${task.payAmount?.toLocaleString()} task`}
        action={
          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon={Phone}>
              Call
            </Button>
            <Button variant="ghost" size="sm" icon={Video}>
              Video
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              icon={isMinimized ? Maximize2 : Minimize2}
              onClick={onToggleMinimize}
            >
              {isMinimized ? 'Expand' : 'Minimize'}
            </Button>
          </div>
        }
      />
      
      {!isMinimized && (
        <CardBody className={styles.chatBody}>
          {/* Participants Info */}
          <div className={styles.participantsInfo}>
            <Users size={16} />
            <span>
              {whatsapp.participants?.map(p => p.name).join(', ')} • 
              Secure Chat • Payment Protected
            </span>
            <Shield size={16} className={styles.secureIcon} />
          </div>

          {/* Messages Area */}
          <div className={styles.messagesContainer}>
            {mockMessages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${
                  message.sender === userType ? styles.sent : styles.received
                } ${styles[message.type] || styles.text}`}
              >
                {message.sender !== userType && message.type !== 'system' && (
                  <div className={styles.messageHeader}>
                    {getUserAvatar(message.sender)}
                    <span className={styles.senderName}>
                      {message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}
                    </span>
                  </div>
                )}
                
                <div className={styles.messageContent}>
                  {message.type === 'file' ? (
                    <div className={styles.fileMessage}>
                      <FileText size={20} />
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{message.fileName}</span>
                        <span className={styles.fileSize}>{message.fileSize}</span>
                      </div>
                      <Button variant="ghost" size="sm" icon={Download}>
                        Download
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.messageText}>
                      {message.text}
                    </div>
                  )}
                  
                  <div className={styles.messageFooter}>
                    <span className={styles.timestamp}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.sender === userType && message.status && (
                      <div className={styles.messageStatus}>
                        {message.status === 'sent' && <Clock size={12} />}
                        {message.status === 'delivered' && <CheckCircle size={12} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className={styles.typingIndicator}>
                {getUserAvatar(userType === 'employer' ? 'worker' : 'employer')}
                <div className={styles.typingText}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>typing...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Task Actions */}
          <div className={styles.taskActions}>
            {userType === 'employer' ? (
              <Button 
                variant="success" 
                icon={DollarSign}
                onClick={handleTaskComplete}
                size="sm"
              >
                Complete Task & Release Payment
              </Button>
            ) : (
              <Button 
                variant="primary" 
                icon={CheckCircle}
                onClick={handleTaskComplete}
                size="sm"
              >
                Mark Task as Complete
              </Button>
            )}
            
            <Button 
              variant="outline" 
              icon={ExternalLink}
              onClick={() => window.open(whatsapp.inviteLink, '_blank')}
              size="sm"
            >
              Open in WhatsApp
            </Button>
          </div>

          {/* Message Input */}
          <div className={styles.messageInput}>
            <div className={styles.inputContainer}>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={Paperclip}
                onClick={handleFileUpload}
                className={styles.attachButton}
              >
                Attach
              </Button>
              
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className={styles.textInput}
                disabled={sendMessageMutation.isLoading}
              />
              
              <Button 
                variant="primary" 
                size="sm" 
                icon={Send}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                className={styles.sendButton}
              >
                Send
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNewMessage("Hi! How can I help you today?")}
            >
              👋 Greet
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNewMessage("Could you please provide more details about the requirements?")}
            >
              ❓ Ask Question
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNewMessage("I'll share an update on the progress shortly.")}
            >
              📈 Share Update
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNewMessage("Thank you for your help!")}
            >
              🙏 Thank You
            </Button>
          </div>
        </CardBody>
      )}
    </Card>
  );
};

export default WhatsAppIntegration;