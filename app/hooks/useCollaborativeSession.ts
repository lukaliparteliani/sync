'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBroadcastChannel } from 'react-broadcast-sync';
import { User, Message, CounterState, CollaborativeState, BroadcastAction } from '../types';
import { generateRandomUsername, generateTabId } from '../utils/randomNames';

const TYPING_TIMEOUT = 2000;
const USER_CLEANUP_INTERVAL = 5000;
const USER_INACTIVE_THRESHOLD = 10000;
const MESSAGE_CLEANUP_INTERVAL = 1000;

export function useCollaborativeSession() {
  const tabId = useRef(generateTabId());
  const userId = useRef(`user-${tabId.current}`);
  const username = useRef(generateRandomUsername());
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasInitialized = useRef(false);

  const [users, setUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [counter, setCounter] = useState<CounterState>({
    value: 0,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { messages, postMessage, clearReceivedMessages } = useBroadcastChannel(
    'collaborative-session',
    {
      sourceName: tabId.current,
    }
  );

  const cleanupExpiredMessages = useCallback(() => {
    const now = Date.now();
    setChatMessages(prev => prev.filter(msg => !msg.expiresAt || msg.expiresAt > now));
  }, []);

  const cleanupInactiveUsers = useCallback(() => {
    const now = Date.now();
    setUsers(prev => prev.filter(user =>
      user.id === userId.current || (now - user.lastActivity) < USER_INACTIVE_THRESHOLD
    ));
  }, []);

  const sendMessage = useCallback((content: string, expiresInSeconds?: number) => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      userId: userId.current,
      username: username.current,
      content,
      timestamp: Date.now(),
      expiresAt: expiresInSeconds ? Date.now() + (expiresInSeconds * 1000) : undefined,
    };

    postMessage('MESSAGE_SEND', { type: 'MESSAGE_SEND', payload: message });
    setChatMessages(prev => [...prev, message]);

    const updatedUser: User = {
      id: userId.current,
      username: username.current,
      lastActivity: Date.now(),
      isTyping: false,
      tabId: tabId.current,
    };
    postMessage('USER_UPDATE', { type: 'USER_UPDATE', payload: updatedUser });
    setUsers(prev =>
      prev.map(user => user.id === userId.current ? updatedUser : user)
    );
  }, [postMessage]);

  const deleteMessage = useCallback((messageId: string) => {
    postMessage('MESSAGE_DELETE', { type: 'MESSAGE_DELETE', payload: { messageId, userId: userId.current } });
    setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [postMessage]);

  const updateCounter = useCallback((increment: boolean) => {
    const newValue = counter.value + (increment ? 1 : -1);
    const update = {
      value: newValue,
      userId: userId.current,
      username: username.current,
    };

    postMessage('COUNTER_UPDATE', { type: 'COUNTER_UPDATE', payload: update });
    setCounter({
      value: newValue,
      lastUpdatedBy: username.current,
      lastUpdatedAt: Date.now(),
    });

    const updatedUser: User = {
      id: userId.current,
      username: username.current,
      lastActivity: Date.now(),
      isTyping: false,
      tabId: tabId.current,
    };
    postMessage('USER_UPDATE', { type: 'USER_UPDATE', payload: updatedUser });
    setUsers(prev =>
      prev.map(user => user.id === userId.current ? updatedUser : user)
    );
  }, [postMessage, counter.value]);

  const markTyping = useCallback((isTyping: boolean) => {
    if (isTyping) {
      postMessage('TYPING_START', { type: 'TYPING_START', payload: { userId: userId.current } });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        postMessage('TYPING_STOP', { type: 'TYPING_STOP', payload: { userId: userId.current } });
      }, TYPING_TIMEOUT);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      postMessage('TYPING_STOP', { type: 'TYPING_STOP', payload: { userId: userId.current } });
    }

    const updatedUser: User = {
      id: userId.current,
      username: username.current,
      lastActivity: Date.now(),
      isTyping: false,
      tabId: tabId.current,
    };
    postMessage('USER_UPDATE', { type: 'USER_UPDATE', payload: updatedUser });
    setUsers(prev =>
      prev.map(user => user.id === userId.current ? updatedUser : user)
    );
  }, [postMessage]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const currentUser: User = {
        id: userId.current,
        username: username.current,
        lastActivity: Date.now(),
        isTyping: false,
        tabId: tabId.current,
      };
      setUsers([currentUser]);
      postMessage('USER_JOIN', { type: 'USER_JOIN', payload: currentUser });
      postMessage('REQUEST_STATE', { type: 'REQUEST_STATE', payload: { requesterId: userId.current } });
    }

    const handleBeforeUnload = () => {
      postMessage('USER_LEAVE', { type: 'USER_LEAVE', payload: { userId: userId.current } });
    };

    const handleVisibilityChange = () => {
      const updatedUser: User = {
        id: userId.current,
        username: username.current,
        lastActivity: Date.now(),
        isTyping: false,
        tabId: tabId.current,
      };
      postMessage('USER_UPDATE', { type: 'USER_UPDATE', payload: updatedUser });
      setUsers(prev =>
        prev.map(user => user.id === userId.current ? updatedUser : user)
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const cleanupInterval = setInterval(cleanupInactiveUsers, USER_CLEANUP_INTERVAL);
    const messageCleanupInterval = setInterval(cleanupExpiredMessages, MESSAGE_CLEANUP_INTERVAL);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(cleanupInterval);
      clearInterval(messageCleanupInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [postMessage, cleanupInactiveUsers, cleanupExpiredMessages]);

  useEffect(() => {
    if (messages.length === 0) return;

    messages.forEach((msg: any) => {
      const action = msg.message as BroadcastAction;

      if (msg.source === tabId.current &&
          ['MESSAGE_SEND', 'COUNTER_UPDATE'].includes(action.type)) {
        return;
      }

      switch (action.type) {
        case 'USER_JOIN':
          setUsers(prev => {
            const exists = prev.some(u => u.id === action.payload.id);
            if (exists) return prev;
            return [...prev, action.payload];
          });
          break;

        case 'USER_LEAVE':
          setUsers(prev => prev.filter(u => u.id !== action.payload.userId));
          setTypingUsers(prev => prev.filter(id => id !== action.payload.userId));
          break;

        case 'USER_UPDATE':
          setUsers(prev => prev.map(user =>
            user.id === action.payload.id
              ? { ...user, ...action.payload }
              : user
          ));
          break;

        case 'MESSAGE_SEND':
          setChatMessages(prev => {
            const exists = prev.some(m => m.id === action.payload.id);
            if (exists) return prev;
            return [...prev, action.payload];
          });
          break;

        case 'MESSAGE_DELETE':
          if (action.payload.userId !== userId.current) {
            setChatMessages(prev => prev.filter(msg => msg.id !== action.payload.messageId));
          }
          break;

        case 'COUNTER_UPDATE':
          setCounter({
            value: action.payload.value,
            lastUpdatedBy: action.payload.username,
            lastUpdatedAt: Date.now(),
          });
          break;

        case 'TYPING_START':
          if (action.payload.userId !== userId.current) {
            setTypingUsers(prev => {
              if (prev.includes(action.payload.userId)) return prev;
              return [...prev, action.payload.userId];
            });
          }
          break;

        case 'TYPING_STOP':
          setTypingUsers(prev => prev.filter(id => id !== action.payload.userId));
          break;

        case 'REQUEST_STATE':
          if (action.payload.requesterId !== userId.current) {
            setUsers(currentUsers => {
              setChatMessages(currentMessages => {
                setCounter(currentCounter => {
                  setTypingUsers(currentTypingUsers => {
                    const currentState: CollaborativeState = {
                      users: currentUsers,
                      messages: currentMessages,
                      counter: currentCounter,
                      typingUsers: currentTypingUsers,
                    };
                    postMessage('STATE_SYNC', { type: 'STATE_SYNC', payload: currentState });
                    return currentTypingUsers;
                  });
                  return currentCounter;
                });
                return currentMessages;
              });
              return currentUsers;
            });
          }
          break;

        case 'STATE_SYNC':
          setUsers(prev => {
            const merged = [...prev];
            action.payload.users.forEach((user: User) => {
              if (!merged.some(u => u.id === user.id)) {
                merged.push(user);
              }
            });
            return merged;
          });

          if (chatMessages.length === 0) {
            setChatMessages(action.payload.messages);
            setCounter(action.payload.counter);
          }
          setTypingUsers(action.payload.typingUsers.filter((id: string) => id !== userId.current));
          break;
      }
    });

    clearReceivedMessages();
  }, [messages, postMessage, clearReceivedMessages]);

  return {
    users,
    messages: chatMessages,
    counter,
    typingUsers,
    currentUserId: userId.current,
    currentUsername: username.current,
    sendMessage,
    deleteMessage,
    updateCounter,
    markTyping,
  };
}