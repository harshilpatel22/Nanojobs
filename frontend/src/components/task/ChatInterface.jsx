import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatInterface.module.css';
import Button from '../common/Button';
import { Send, MessageCircle, User, Users } from 'lucide-react';
import { taskAPI } from '../../utils/api';

/**
 * ChatInterface Component - Encrypted messaging for task collaboration
 * Features: Real-time messaging, message encryption, role-based UI
 */
const ChatInterface = ({ taskId, userId, userRole, isActive = true }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat on component mount
  useEffect(() => {
    if (taskId && userId) {
      loadChat();
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [taskId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 5 seconds for real-time experience
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      loadChat(true); // Silent refresh
    }, 5000);

    // Also refresh when window gains focus
    const handleFocus = () => {
      loadChat(true);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [taskId, userId, isActive]);

  // Load chat and messages
  const loadChat = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await taskAPI.getTaskChat(taskId, userId);
      
      if (response.success) {
        const newMessages = response.data.chat.messages || [];
        const currentMessageCount = newMessages.length;
        
        setChat(response.data.chat);
        setMessages(newMessages);
        setError('');
        
        // Detect new messages for notification
        if (silent && currentMessageCount > lastMessageCount) {
          setHasNewMessages(true);
          // Show browser notification if supported
          if (Notification.permission === 'granted') {
            new Notification('New message in task chat', {
              body: 'You have received a new message',
              icon: '/favicon.ico'
            });
          }
        }
        
        setLastMessageCount(currentMessageCount);
        
        // Mark messages as read when chat is loaded
        if (newMessages.length > 0) {
          markAsRead();
          if (silent) {
            // Clear new message indicator after a delay
            setTimeout(() => setHasNewMessages(false), 3000);
          }
        }
      } else {
        setError(response.message || 'Failed to load chat');
      }
    } catch (err) {
      console.error('❌ Failed to load chat:', err);
      if (!silent) {
        setError('Unable to load chat. Please try again.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setSending(true);
      
      const response = await taskAPI.sendChatMessage(
        taskId, 
        messageContent, 
        'text', 
        userId
      );

      if (response.success) {
        // Add the new message to the local state immediately
        const newMsg = response.data.message;
        setMessages(prev => [...prev, newMsg]);
        setError('');
      } else {
        setError('Failed to send message');
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    try {
      await taskAPI.markChatMessagesAsRead(taskId, userId);
    } catch (err) {
      console.error('❌ Failed to mark messages as read:', err);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Show typing indicator simulation (in a real app, this would be sent to other users)
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    }
    
    // Clear typing indicator after user stops typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get message sender info
  const getMessageSender = (message) => {
    const isCurrentUser = message.senderId === userId;
    const senderRole = message.senderType;
    
    return {
      isCurrentUser,
      name: isCurrentUser ? 'You' : (senderRole === 'employer' ? 'Employer' : 'Worker'),
      role: senderRole,
      icon: senderRole === 'employer' ? Users : User
    };
  };

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.loadingState}>
          <MessageCircle className={styles.loadingIcon} />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>⚠️ {error}</p>
          <Button onClick={() => loadChat()} size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!chat || !isActive) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.unavailableState}>
          <MessageCircle className={styles.unavailableIcon} />
          <p>Chat is not available</p>
          <p className={styles.unavailableSubtext}>
            {!isActive ? 'Chat is only available for active tasks' : 'Unable to access chat for this task'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <MessageCircle className={styles.headerIcon} />
          <div>
            <h3 className={styles.headerTitle}>
              Task Chat
              {hasNewMessages && (
                <span className={styles.newMessageIndicator}>
                  🔴 New
                </span>
              )}
            </h3>
            <p className={styles.headerSubtitle}>
              Secure encrypted messaging
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.userRole}>
            {userRole === 'employer' ? '👔 Employer' : '👤 Worker'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className={styles.messagesContainer} ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <MessageCircle className={styles.emptyIcon} />
            <p>No messages yet</p>
            <p className={styles.emptySubtext}>Start a conversation about this task</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => {
              const sender = getMessageSender(message);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showSender = !prevMessage || prevMessage.senderId !== message.senderId;
              
              return (
                <div
                  key={message.id}
                  className={`${styles.messageGroup} ${
                    sender.isCurrentUser ? styles.messageGroupRight : styles.messageGroupLeft
                  }`}
                >
                  {showSender && (
                    <div className={styles.messageSender}>
                      <div className={styles.senderInfo}>
                        <sender.icon className={styles.senderIcon} />
                        <span className={styles.senderName}>{sender.name}</span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`${styles.messageBubble} ${
                      sender.isCurrentUser ? styles.messageBubbleOwn : styles.messageBubbleOther
                    }`}
                  >
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                    <div className={styles.messageTime}>
                      {formatMessageTime(message.createdAt)}
                      {sender.isCurrentUser && (
                        <span className={styles.messageStatus}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingBubble}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInput}>
        <div className={styles.inputContainer}>
          <textarea
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className={styles.messageTextarea}
            rows={1}
            disabled={sending}
            maxLength={1000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
            icon={Send}
            size="sm"
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <div className={styles.inputFooter}>
          <span className={styles.charCount}>
            {newMessage.length}/1000
          </span>
          <span className={styles.encryptionNotice}>
            🔒 Messages are encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;