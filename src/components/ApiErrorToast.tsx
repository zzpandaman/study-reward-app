import React, { useState, useEffect } from 'react';
import { subscribeApiError, clearApiError } from '../utils/api-error';
import './ApiErrorToast.css';

const TOAST_DURATION = 4000;

const ApiErrorToast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return subscribeApiError((msg) => setMessage(msg));
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      clearApiError();
      setMessage(null);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="api-error-toast" role="alert">
      <span className="api-error-toast-icon">⚠️</span>
      <span className="api-error-toast-message">{message}</span>
      <button
        type="button"
        className="api-error-toast-close"
        onClick={() => {
          clearApiError();
          setMessage(null);
        }}
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
};

export default ApiErrorToast;
