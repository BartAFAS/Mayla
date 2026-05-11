import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { onNotificationsSnapshot, markAllNotificationsRead, markNotificationRead } from '../services/storage';
import { useState, useEffect } from 'react';
import type { AppNotification } from '../types';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onNotificationsSnapshot(user.id, setNotifications);
    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(user.id);
  };

  const handleClick = async (notification: AppNotification) => {
    await markNotificationRead(notification.id);
    if (notification.momentId) {
      navigate(`/moment/${notification.momentId}`);
    }
  };

  const typeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_moment': return '🆕';
      case 'moment_changed': return '✏️';
      case 'signup': return '✅';
      case 'cancellation': return '❌';
      case 'reminder': return '⏰';
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600">
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-sm text-primary-600 font-medium"
          >
            <CheckCheck className="w-4 h-4" /> Alles gelezen
          </button>
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">Meldingen</h2>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Geen meldingen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                n.read
                  ? 'bg-white border-gray-100'
                  : 'bg-primary-50 border-primary-200'
              }`}
            >
              <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(parseISO(n.timestamp), { addSuffix: true, locale: nl })}
                </p>
              </div>
              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
