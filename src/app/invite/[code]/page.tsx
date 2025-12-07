'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function InvitePage() {
  const { code } = useParams();
  const router = useRouter();
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && code) {
      loadInviteData();
    }
  }, [user, code]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${code}`);
      return;
    }
    setUser(user);
  };

  const loadInviteData = async () => {
    if (!supabase || !code) return;

    try {
      // Get invite details with server info
      const { data: invite, error } = await supabase
        .from('server_invites')
        .select(`
          *,
          servers (
            id,
            name,
            icon_url,
            owner_id
          )
        `)
        .eq('code', code as string)
        .maybeSingle();

      if (error) {
        console.error('Error loading invite:', error);
        toast.error('Приглашение не найдено или недействительно');
        router.push('/channels/@me');
        return;
      }

      if (!invite) {
        toast.error('Приглашение не найдено');
        router.push('/channels/@me');
        return;
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast.error('Приглашение истекло');
        router.push('/channels/@me');
        return;
      }

      // Check if invite has reached max uses
      if (invite.max_uses && invite.uses >= invite.max_uses) {
        toast.error('Приглашение достигло максимального количества использований');
        router.push('/channels/@me');
        return;
      }

      // Check if user is already a member
      const { data: membership } = await supabase
        .from('server_members')
        .select('*')
        .eq('server_id', invite.server_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        toast.success('Вы уже состоите в этом сервере');
        router.push(`/channels/${invite.server_id}`);
        return;
      }

      setInviteData(invite);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при загрузке приглашения');
      router.push('/channels/@me');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!supabase || !inviteData || !user) return;

    setAccepting(true);
    try {
      // Use RPC function to accept invite
      const { data: serverId, error } = await supabase
        .rpc('accept_server_invite', {
          p_invite_code: code as string,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error accepting invite:', error);
        toast.error('Ошибка при принятии приглашения');
      } else {
        toast.success(`Добро пожаловать на сервер "${inviteData.servers.name}"!`);
        router.push(`/channels/${serverId}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при принятии приглашения');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка приглашения...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Приглашение недействительно</h1>
          <p className="text-gray-400 mb-6">Это приглашение не существует, истекло или достигло лимита использований.</p>
          <button
            onClick={() => router.push('/channels/@me')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Вернуться к друзьям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {inviteData.servers.icon_url ? (
            <img
              src={inviteData.servers.icon_url}
              alt={inviteData.servers.name}
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {inviteData.servers.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Приглашение на сервер
        </h1>

        <h2 className="text-xl text-gray-300 mb-6">
          {inviteData.servers.name}
        </h2>

        <div className="text-sm text-gray-400 mb-6 space-y-1">
          {inviteData.max_uses && (
            <p>Использований: {inviteData.uses} / {inviteData.max_uses}</p>
          )}
          {inviteData.expires_at && (
            <p>Истекает: {new Date(inviteData.expires_at).toLocaleString('ru-RU')}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={acceptInvite}
            disabled={accepting}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {accepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Присоединение...
              </>
            ) : (
              'Присоединиться к серверу'
            )}
          </button>

          <button
            onClick={() => router.push('/channels/@me')}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}