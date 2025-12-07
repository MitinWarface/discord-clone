'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface ChannelSettingsProps {
  channelId: string;
  serverId: string;
  userId: string;
  onClose: () => void;
}

export default function ChannelSettings({ channelId, serverId, userId, onClose }: ChannelSettingsProps) {
  const [channel, setChannel] = useState<any>(null);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChannel();
  }, [channelId]);

  const loadChannel = async () => {
    try {
      const { data, error } = await supabase!
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) {
        console.error('Error loading channel:', error);
        toast.error('Ошибка при загрузке канала');
        return;
      }

      setChannel(data);
      setChannelName(data.name);
      setChannelType(data.type);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке канала');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!channelName.trim()) {
      toast.error('Название канала не может быть пустым');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase!
        .from('channels')
        .update({
          name: channelName.trim(),
          type: channelType,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) {
        console.error('Error updating channel:', error);
        toast.error('Ошибка при обновлении канала');
        return;
      }

      toast.success('Канал обновлен!');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при обновлении канала');
    } finally {
      setSaving(false);
    }
  };

  const deleteChannel = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот канал? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const { error } = await supabase!
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) {
        console.error('Error deleting channel:', error);
        toast.error('Ошибка при удалении канала');
        return;
      }

      toast.success('Канал удален!');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при удалении канала');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Канал не найден</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Настройки канала</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Channel Overview */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Обзор канала</h4>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
            </div>
            <div>
              <h5 className="text-xl font-semibold">#{channel.name}</h5>
              <p className="text-gray-400 text-sm">
                {channel.type === 'text' ? 'Текстовый канал' : 'Голосовой канал'} •
                Создан {new Date(channel.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>

        {/* Channel Name */}
        <div>
          <label className="block text-sm font-medium mb-2">НАЗВАНИЕ КАНАЛА</label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="новый-канал"
          />
        </div>

        {/* Channel Type */}
        <div>
          <label className="block text-sm font-medium mb-2">ТИП КАНАЛА</label>
          <select
            value={channelType}
            onChange={(e) => setChannelType(e.target.value as 'text' | 'voice')}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Текстовый канал</option>
            <option value="voice">Голосовой канал</option>
          </select>
        </div>

        {/* Permissions */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Разрешения</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <span className="font-medium">@everyone</span>
                <p className="text-sm text-gray-400">Базовые разрешения для всех участников</p>
              </div>
              <span className="text-gray-400 text-sm">Наследуются от сервера</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-red-600 pt-6">
          <h4 className="text-lg font-semibold text-red-400 mb-4">Опасная зона</h4>
          <div className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-600 rounded">
              <h5 className="font-semibold text-red-400 mb-2">Удалить канал</h5>
              <p className="text-sm text-gray-300 mb-3">
                После удаления канала восстановить его будет невозможно. Все сообщения будут потеряны.
              </p>
              <button
                onClick={deleteChannel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Удалить канал
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-300 hover:text-white"
        >
          Отмена
        </button>
        <button
          onClick={saveChanges}
          disabled={saving || !channelName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}