'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { canKickMembers, canBanMembers } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Ban {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface Member {
  id: string;
  user_id: string;
  role_id: string | null;
  joined_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  roles: {
    name: string;
    color: string;
  } | null;
}

interface ModerationPanelProps {
  serverId: string;
  userId: string;
  onClose: () => void;
}

export default function ModerationPanel({ serverId, userId, onClose }: ModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'bans'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [canKick, setCanKick] = useState(false);
  const [canBan, setCanBan] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('permanent');

  useEffect(() => {
    checkPermissions();
    if (activeTab === 'members') {
      loadMembers();
    } else {
      loadBans();
    }
  }, [serverId, userId, activeTab]);

  const checkPermissions = async () => {
    const [kickPerm, banPerm] = await Promise.all([
      canKickMembers(userId, serverId),
      canBanMembers(userId, serverId)
    ]);
    setCanKick(kickPerm);
    setCanBan(banPerm);
  };

  const loadMembers = async () => {
    if (!supabase) {
      toast.error('Supabase не инициализирован');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          ),
          roles (
            name,
            color
          )
        `)
        .eq('server_id', serverId)
        .neq('user_id', userId) // Exclude current user
        .order('joined_at');

      if (error) {
        console.error('Error loading members:', error);
        toast.error('Ошибка при загрузке участников');
      } else {
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке участников');
    } finally {
      setLoading(false);
    }
  };

  const loadBans = async () => {
    if (!supabase) {
      toast.error('Supabase не инициализирован');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('server_bans')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('server_id', serverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bans:', error);
        toast.error('Ошибка при загрузке банов');
      } else {
        setBans(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке банов');
    } finally {
      setLoading(false);
    }
  };

  const kickUser = async (targetUserId: string) => {
    if (!confirm('Вы уверены, что хотите выгнать этого участника?') || !supabase) return;

    try {
      const { error } = await supabase
        .rpc('kick_server_user', {
          p_server_id: serverId,
          p_user_id: targetUserId,
          p_kicked_by: userId,
          p_reason: null
        });

      if (error) {
        console.error('Error kicking user:', error);
        toast.error('Ошибка при выгонянии участника');
      } else {
        toast.success('Участник выгнан');
        loadMembers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при выгонянии участника');
    }
  };

  const banUser = async () => {
    if (!selectedUser || !supabase) return;

    try {
      let durationHours = null;
      if (banDuration !== 'permanent') {
        durationHours = parseInt(banDuration);
      }

      const { error } = await supabase
        .rpc('ban_server_user', {
          p_server_id: serverId,
          p_user_id: selectedUser.user_id,
          p_banned_by: userId,
          p_reason: banReason || null,
          p_duration_hours: durationHours
        });

      if (error) {
        console.error('Error banning user:', error);
        toast.error('Ошибка при блокировке участника');
      } else {
        toast.success('Участник заблокирован');
        setSelectedUser(null);
        setBanReason('');
        setBanDuration('permanent');
        loadMembers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при блокировке участника');
    }
  };

  const unbanUser = async (targetUserId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .rpc('unban_server_user', {
          p_server_id: serverId,
          p_user_id: targetUserId,
          p_unbanned_by: userId
        });

      if (error) {
        console.error('Error unbanning user:', error);
        toast.error('Ошибка при разблокировке');
      } else {
        toast.success('Участник разблокирован');
        loadBans();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при разблокировке');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Модерация сервера</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-t ${
            activeTab === 'members'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Участники ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('bans')}
          className={`px-4 py-2 rounded-t ${
            activeTab === 'bans'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Заблокированные ({bans.length})
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <img
                  src={member.profiles?.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                  alt={member.profiles?.display_name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white font-medium">{member.profiles?.display_name}</div>
                  <div className="text-gray-400 text-sm">@{member.profiles?.username}</div>
                </div>
                {member.roles && (
                  <div
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: member.roles.color }}
                  >
                    {member.roles.name}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {canKick && (
                  <button
                    onClick={() => kickUser(member.user_id)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded"
                  >
                    Выгнать
                  </button>
                )}
                {canBan && (
                  <button
                    onClick={() => setSelectedUser(member)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Заблокировать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bans Tab */}
      {activeTab === 'bans' && (
        <div className="space-y-2">
          {bans.map((ban) => (
            <div key={ban.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <img
                  src={ban.profiles?.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                  alt={ban.profiles?.display_name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white font-medium">{ban.profiles?.display_name}</div>
                  <div className="text-gray-400 text-sm">@{ban.profiles?.username}</div>
                  {ban.reason && (
                    <div className="text-gray-500 text-xs">Причина: {ban.reason}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400">
                  {ban.expires_at ? `до ${new Date(ban.expires_at).toLocaleDateString('ru-RU')}` : 'Навсегда'}
                </div>
                {canBan && (
                  <button
                    onClick={() => unbanUser(ban.user_id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  >
                    Разблокировать
                  </button>
                )}
              </div>
            </div>
          ))}
          {bans.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Нет заблокированных пользователей
            </div>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[400px]">
            <h3 className="text-xl font-bold mb-4">Заблокировать участника</h3>
            <p className="text-gray-300 mb-4">
              Заблокировать <strong>{selectedUser.profiles?.display_name}</strong>?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Причина</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Необязательно"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Длительность</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="permanent">Навсегда</option>
                  <option value="1">1 час</option>
                  <option value="24">1 день</option>
                  <option value="168">1 неделя</option>
                  <option value="720">1 месяц</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setBanReason('');
                  setBanDuration('permanent');
                }}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={banUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Заблокировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}