'use client';

import React from 'react';
import { User } from '../types';
import styles from './UserPresence.module.css';

interface UserPresenceProps {
  users: User[];
  currentUserId: string;
  typingUsers: string[];
}

export default function UserPresence({ users, currentUserId, typingUsers }: UserPresenceProps) {
  const formatLastActivity = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 5) return 'Active now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return b.lastActivity - a.lastActivity;
  });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Active Users ({users.length})</h2>
      <div className={styles.userList}>
        {sortedUsers.map(user => {
          const isTyping = typingUsers.includes(user.id);
          const isCurrentUser = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`${styles.userItem} ${isCurrentUser ? styles.currentUser : ''}`}
            >
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.username}>
                    {user.username}
                    {isCurrentUser && <span className={styles.youBadge}> (You)</span>}
                  </span>
                  <span className={styles.activity}>
                    {isTyping ? (
                      <span className={styles.typing}>Typing...</span>
                    ) : (
                      formatLastActivity(user.lastActivity)
                    )}
                  </span>
                </div>
              </div>
              <div className={`${styles.statusIndicator} ${styles.online}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}