import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInactivityTimerOptions {
  timeout: number; // in milliseconds
  onTimeout: () => void;
}

export const useInactivityTimer = ({ timeout, onTimeout }: UseInactivityTimerOptions) => {
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeRemaining(timeout);

    // Clear existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    // Set new timeout
    timeoutIdRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);

    // Update countdown every second
    intervalIdRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeout - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
      }
    }, 1000);
  }, [timeout, onTimeout]);

  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Activity handler
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [resetTimer]);

  return { timeRemaining };
};
