'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import styles from './Chat.module.css';

interface ChatProps {
  messages: Message[];
  users: User[];
  typingUsers: string[];
  currentUserId: string;
  currentUsername: string;
  onSendMessage: (content: string, expiresInSeconds?: number) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function Chat({
  messages,
  users,
  typingUsers,
  currentUserId,
  currentUsername,
  onSendMessage,
  onDeleteMessage,
  onTyping,
}: ChatProps) {
  const [messageInput, setMessageInput] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [, forceUpdate] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const hasExpiringMessages = messages.some(msg => msg.expiresAt && msg.expiresAt > Date.now());
    if (hasExpiringMessages) {
      const interval = setInterval(() => {
        forceUpdate(prev => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage) return;

    const expirationSeconds = expiresIn ? parseInt(expiresIn, 10) : undefined;
    onSendMessage(trimmedMessage, expirationSeconds);

    setMessageInput('');
    setExpiresIn('');
    setIsTyping(false);
    onTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getExpirationText = (expiresAt?: number) => {
    if (!expiresAt) return null;

    const now = Date.now();
    const remainingSeconds = Math.ceil((expiresAt - now) / 1000);

    if (remainingSeconds <= 0) return 'Expired';
    if (remainingSeconds < 60) return `Expires in ${remainingSeconds}s`;
    return `Expires in ${Math.ceil(remainingSeconds / 60)}m`;
  };

  const getTypingUsersText = () => {
    const typingUsernames = typingUsers
      .map(userId => users.find(u => u.id === userId)?.username)
      .filter(Boolean);

    if (typingUsernames.length === 0) return null;
    if (typingUsernames.length === 1) return `${typingUsernames[0]} is typing...`;
    if (typingUsernames.length === 2) return `${typingUsernames.join(' and ')} are typing...`;
    return `${typingUsernames.length} users are typing...`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Chat</h2>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwnMessage = message.userId === currentUserId;
            const expirationText = getExpirationText(message.expiresAt);
            const isExpired = message.expiresAt && message.expiresAt <= Date.now();

            return (
              <div
                key={message.id}
                className={`${styles.messageWrapper} ${isOwnMessage ? styles.ownMessage : ''}`}
              >
                <div className={`${styles.message} ${isExpired ? styles.expired : ''}`}>
                  <div className={styles.messageHeader}>
                    <span className={styles.username}>{message.username}</span>
                    <span className={styles.timestamp}>{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className={styles.messageContent}>
                    {isExpired ? (
                      <span className={styles.expiredText}>Message has expired</span>
                    ) : (
                      message.content
                    )}
                  </div>
                  {expirationText && !isExpired && (
                    <div className={styles.expiration}>{expirationText}</div>
                  )}
                  {isOwnMessage && !isExpired && (
                    <button
                      onClick={() => onDeleteMessage(message.id)}
                      className={styles.deleteBtn}
                      aria-label="Delete message"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className={styles.typingIndicator}>
          {getTypingUsersText()}
        </div>
      )}

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={styles.input}
            rows={1}
          />
          <div className={styles.inputControls}>
            <input
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              placeholder="Expire in (sec)"
              className={styles.expirationInput}
              min="1"
              max="3600"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className={styles.sendButton}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}