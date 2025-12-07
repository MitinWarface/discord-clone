'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { canManageServer } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Invite {
  id: string;
  code: string;
  created_by: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InviteManagerProps {
  serverId: string;
  userId: string;
  onClose: () => void;
}

export default function InviteManager({ serverId, userId, onClose }: InviteManagerProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<string>('never');

  useEffect(() => {
    checkPermissions();
    loadInvites();
  }, [serverId, userId]);

  const checkPermissions = async () => {
    const hasPermission = await canManageServer(userId, serverId);
    setCanManage(hasPermission);
  };

  const loadInvites = async () => {
    if (!supabase) {
      toast.error('Supabase не инициализирован');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('server_invites')
        .select('*')
        .eq('server_id', serverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invites:', error);
        toast.error('Ошибка при загрузке приглашений');
      } else {
        setInvites(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке приглашений');
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!supabase) return;

    try {
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const hours = parseInt(expiresIn);
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      const maxUsesValue = maxUses ? parseInt(maxUses) : null;

      // Use RPC function to create invite
      const { data, error } = await supabase
        .rpc('create_server_invite', {
          p_server_id: serverId,
          p_created_by: userId,
          p_max_uses: maxUsesValue,
          p_expires_at: expiresAt
        });

      if (error) {
        console.error('Error creating invite:', error);
        toast.error('Ошибка при создании приглашения');
      } else {
        toast.success('Приглашение создано!');
        setMaxUses('');
        setExpiresIn('never');
        setShowCreateInvite(false);
        loadInvites();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при создании приглашения');
    }
  };

  const deleteInvite = async (inviteId: string, inviteCode: string) => {
    if (!confirm(`Удалить приглашение ${inviteCode}?`) || !supabase) return;

    try {
      const { error } = await supabase
        .from('server_invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('Error deleting invite:', error);
        toast.error('Ошибка при удалении приглашения');
      } else {
        toast.success('Приглашение удалено!');
        loadInvites();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при удалении приглашения');
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Ссылка скопирована!');
  };

  const formatExpiresAt = (expiresAt: string | null) => {
    if (!expiresAt) return 'Никогда';

    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} д.`;
    } else if (diffHours > 0) {
      return `${diffHours} ч.`;
    } else {
      return 'Истекло';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">У вас нет прав на управление приглашениями</p>
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Управление приглашениями</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-700 rounded">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="font-mono text-sm bg-gray-600 px-2 py-1 rounded">
                  {invite.code}
                </div>
                <div className="text-sm text-gray-400">
                  Использований: {invite.uses}{invite.max_uses ? `/${invite.max_uses}` : ''}
                </div>
                <div className="text-sm text-gray-400">
                  Истекает: {formatExpiresAt(invite.expires_at)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Создано: {new Date(invite.created_at).toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyInviteLink(invite.code)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                title="Копировать ссылку"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
              <button
                onClick={() => deleteInvite(invite.id, invite.code)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}

        {invites.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Нет активных приглашений
          </div>
        )}
      </div>

      <div className="mt-6">
        {!showCreateInvite ? (
          <button
            onClick={() => setShowCreateInvite(true)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Создать приглашение
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-gray-700 rounded">
            <div>
              <label className="block text-sm font-medium mb-2">Максимум использований</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Оставьте пустым для неограниченного"
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Время жизни</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="never">Никогда</option>
                <option value="1">1 час</option>
                <option value="24">1 день</option>
                <option value="168">7 дней</option>
                <option value="720">30 дней</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createInvite}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateInvite(false);
                  setMaxUses('');
                  setExpiresIn('never');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}