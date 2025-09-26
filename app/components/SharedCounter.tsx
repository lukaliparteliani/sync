'use client';

import React from 'react';
import { CounterState } from '../types';
import styles from './SharedCounter.module.css';

interface SharedCounterProps {
  counter: CounterState;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function SharedCounter({ counter, onIncrement, onDecrement }: SharedCounterProps) {
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;

    return date.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Shared Counter</h2>

      <div className={styles.counterDisplay}>
        <div className={styles.value}>{counter.value}</div>
      </div>

      <div className={styles.controls}>
        <button
          onClick={onDecrement}
          className={styles.decrementBtn}
          aria-label="Decrement counter"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 13H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <button
          onClick={onIncrement}
          className={styles.incrementBtn}
          aria-label="Increment counter"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.metadata}>
        {counter.lastUpdatedBy && (
          <>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last updated by:</span>
              <span className={styles.metaValue}>{counter.lastUpdatedBy}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Updated:</span>
              <span className={styles.metaValue}>{formatTimestamp(counter.lastUpdatedAt)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}