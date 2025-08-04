import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationToast } from './NotificationToast';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  
  return (
    <div className="notification-container fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};