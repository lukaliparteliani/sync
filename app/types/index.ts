export interface User {
  id: string;
  username: string;
  lastActivity: number;
  isTyping: boolean;
  tabId: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  expiresAt?: number;
}

export interface CounterState {
  value: number;
  lastUpdatedBy: string | null;
  lastUpdatedAt: number | null;
}

export interface CollaborativeState {
  users: User[];
  messages: Message[];
  counter: CounterState;
  typingUsers: string[];
}

export type BroadcastAction =
  | { type: 'USER_JOIN'; payload: User }
  | { type: 'USER_LEAVE'; payload: { userId: string } }
  | { type: 'USER_UPDATE'; payload: Partial<User> & { id: string } }
  | { type: 'MESSAGE_SEND'; payload: Message }
  | { type: 'MESSAGE_DELETE'; payload: { messageId: string; userId: string } }
  | { type: 'COUNTER_UPDATE'; payload: { value: number; userId: string; username: string } }
  | { type: 'TYPING_START'; payload: { userId: string } }
  | { type: 'TYPING_STOP'; payload: { userId: string } }
  | { type: 'STATE_SYNC'; payload: CollaborativeState }
  | { type: 'REQUEST_STATE'; payload: { requesterId: string } };