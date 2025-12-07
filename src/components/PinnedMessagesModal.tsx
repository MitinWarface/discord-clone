'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface PinnedMessagesModalProps {
  channelId: string;
  onClose: () => void;
}

export default function PinnedMessagesModal({ channelId, onClose }: PinnedMessagesModalProps) {
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPinnedMessages();
  }, [channelId]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase!
        .from('pinned_messages')
        .select(`
          *,
          messages (
            id,
            content,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('channel_id', channelId)
        .order('pinned_at', { ascending: false });

      if (error) {
        console.error('Error loading pinned messages:', error);
        toast.error('Ошибка при загрузке закрепленных сообщений');
        return;
      }

      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке закрепленных сообщений');
    } finally {
      setLoading(false);
    }
  };

  const unpinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase!
        .from('pinned_messages')
        .delete()
        .eq('message_id', messageId);

      if (error) {
        console.error('Error unpinning message:', error);
        toast.error('Ошибка при откреплении сообщения');
        return;
      }

      toast.success('Сообщение откреплено');
      loadPinnedMessages(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при откреплении сообщения');
    }
  };

  const jumpToMessage = (messageId: string) => {
    // Close modal and scroll to message
    onClose();
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('bg-yellow-900', 'bg-opacity-50');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-900', 'bg-opacity-50');
        }, 2000);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold">Закрепленные сообщения</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
              <p className="text-gray-400 text-center">В этом канале нет закрепленных сообщений</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {pinnedMessages.map((pin) => (
                <div key={pin.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <img
                        src={pin.messages?.profiles?.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                        alt={pin.messages?.profiles?.display_name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-white font-medium text-sm">
                        {pin.messages?.profiles?.display_name || pin.messages?.profiles?.username}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(pin.messages?.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => jumpToMessage(pin.message_id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Перейти
                      </button>
                      <button
                        onClick={() => unpinMessage(pin.message_id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Открепить
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm prose prose-invert max-w-none">
                    <ReactMarkdown>{pin.messages?.content || 'Сообщение недоступно'}</ReactMarkdown>
                  </div>
                  <div className="text-gray-500 text-xs mt-2">
                    Закреплено {new Date(pin.pinned_at).toLocaleString('ru-RU')}
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