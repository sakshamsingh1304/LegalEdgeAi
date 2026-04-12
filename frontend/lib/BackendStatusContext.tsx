import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface BackendStatus {
  /** 'checking' = initial probe in progress, 'online' = healthy, 'waking' = retrying, 'offline' = failed all retries */
  status: 'checking' | 'online' | 'waking' | 'offline';
}

const BackendStatusContext = createContext<BackendStatus>({ status: 'checking' });

export const useBackendStatus = () => useContext(BackendStatusContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const BackendStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<BackendStatus['status']>('checking');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const probeHealth = async () => {
      const MAX_RETRIES = 5;
      const INITIAL_DELAY = 3000;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout per attempt

          const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
          clearTimeout(timeout);

          if (res.ok) {
            if (isMounted.current) setStatus('online');
            return;
          }
        } catch {
          // Network error or timeout — backend is still waking up
        }

        if (attempt < MAX_RETRIES) {
          if (isMounted.current) setStatus('waking');
          const delay = Math.min(INITIAL_DELAY * Math.pow(1.5, attempt), 15000);
          await new Promise(r => setTimeout(r, delay));
        }
      }

      if (isMounted.current) setStatus('offline');
    };

    probeHealth();

    return () => { isMounted.current = false; };
  }, []);

  return (
    <BackendStatusContext.Provider value={{ status }}>
      {children}
    </BackendStatusContext.Provider>
  );
};
