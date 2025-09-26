"use client";

import React from "react";
import {useCollaborativeSession} from "../hooks/useCollaborativeSession";
import UserPresence from "./UserPresence";
import SharedCounter from "./SharedCounter";
import Chat from "./Chat";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const {
    users,
    messages,
    counter,
    typingUsers,
    currentUserId,
    currentUsername,
    sendMessage,
    deleteMessage,
    updateCounter,
    markTyping,
  } = useCollaborativeSession();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Cross-Tab Collaboration Dashboard</h1>
      </header>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <UserPresence users={users} currentUserId={currentUserId} typingUsers={typingUsers} />
        </aside>

        <main className={styles.main}>
          <div className={styles.counterSection}>
            <SharedCounter
              counter={counter}
              onIncrement={() => updateCounter(true)}
              onDecrement={() => updateCounter(false)}
            />
          </div>

          <div className={styles.chatSection}>
            <Chat
              messages={messages}
              users={users}
              typingUsers={typingUsers}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
              onTyping={markTyping}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
