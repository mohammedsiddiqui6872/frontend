import { useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react';
import { NotificationItem } from '../../hooks/useNotifications';

interface NotificationToastProps {
  notification: NotificationItem;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }[notification.type];

  const Icon = {
    info: Bell,
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle
  }[notification.type];

  return (
    <div className={`notification-toast ${bgColor} text-white p-4 rounded-lg shadow-lg flex items-start gap-3 animate-slideIn`}>
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold">{notification.title}</h4>
        <p className="text-sm opacity-90">{notification.message}</p>
      </div>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X size={18} />
      </button>
    </div>
  );
};