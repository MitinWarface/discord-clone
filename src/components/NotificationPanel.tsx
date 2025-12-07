'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'mention' | 'message' | 'friend_request' | 'server_invite' | 'system';
  title: string;
  content: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Subscribe to new notifications
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const notificationsChannel = supabase!
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('Новое уведомление!');
        })
        .subscribe();

      return () => {
        supabase!.removeChannel(notificationsChannel);
      };
    };

    loadUser();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase!
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase!
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const { error } = await supabase!
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase!
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Уведомление удалено');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '🔔';
      case 'message':
        return '💬';
      case 'friend_request':
        return '👥';
      case 'server_invite':
        return '📨';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'mention':
      case 'message':
        if (notification.data?.channel_id) {
          window.location.href = `/channels/${notification.data.server_id || '@me'}#message-${notification.data.message_id}`;
        }
        break;
      case 'friend_request':
        window.location.href = '/channels/@me';
        break;
      case 'server_invite':
        if (notification.data?.invite_code) {
          window.location.href = `/invite/${notification.data.invite_code}`;
        }
        break;
    }

    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-96 h-full bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Уведомления</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Отметить все прочитанными
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-gray-400 text-center">У вас нет уведомлений</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-gray-750' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      {notification.content && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}