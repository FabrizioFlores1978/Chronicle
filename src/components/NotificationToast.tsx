import React from 'react';
import { useEpub } from '../context/EpubContext';
import { CheckCircle2, AlertCircle, Info, Sparkles, X, ArrowRight } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification, dismissNotification } = useEpub();

  if (!notification) return null;

  const hasAction = Boolean(notification.action);

  const handleToastClick = () => {
    if (notification.action) {
      notification.action.onClick();
      dismissNotification();
    }
  };

  return (
    <div className="toast-container">
      <div
        className={`toast toast-${notification.type} ${hasAction ? 'toast-interactive' : ''}`}
        onClick={hasAction ? handleToastClick : undefined}
        role={hasAction ? 'button' : 'alert'}
        tabIndex={hasAction ? 0 : undefined}
      >
        <span className="toast-icon">
          {notification.type === 'success' && <CheckCircle2 size={18} />}
          {notification.type === 'error' && <AlertCircle size={18} />}
          {notification.type === 'info' && <Info size={18} />}
          {notification.type === 'update' && <Sparkles size={18} />}
        </span>

        <div className="toast-body">
          {notification.title && <div className="toast-title">{notification.title}</div>}
          <div className="toast-message">{notification.message}</div>
        </div>

        {notification.action && (
          <button
            type="button"
            className="btn btn-primary btn-sm toast-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              notification.action?.onClick();
              dismissNotification();
            }}
          >
            <span>{notification.action.label}</span>
            <ArrowRight size={13} />
          </button>
        )}

        <button
          type="button"
          className="toast-close-btn"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation();
            dismissNotification();
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

