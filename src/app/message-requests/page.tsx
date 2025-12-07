'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MessageRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Загружаем профиль пользователя
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Создаем профиль, если не найден
        const { data: userData } = await supabase!.auth.getUser();
        if (userData.user) {
          const { error: createError } = await supabase!
            .from('profiles')
            .insert({
              id: userData.user.id,
              username: userData.user.user_metadata?.username || 'User',
              username_base: userData.user.user_metadata?.username || 'User',
              discriminator: 1,
              display_name: userData.user.user_metadata?.username || 'User',
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            // Повторно загружаем профиль
            const { data: newProfile } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (newProfile) setUserProfile(newProfile);
          }
        }
      } else {
        setUserProfile(profile);
      }

      document.title = 'Discord | Запросы общения';

      const getRequests = async () => {
        const { data, error } = await supabase!
          .from('friends')
          .select('*')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (error) console.error('Error fetching requests:', error);
        else setRequests(data || []);
      };

      getRequests();
    };

    checkAuth();
  }, [router]);

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase!
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) console.error('Error accepting request:', error);
    else setRequests(requests.filter(r => r.id !== requestId));
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase!
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (error) console.error('Error rejecting request:', error);
    else setRequests(requests.filter(r => r.id !== requestId));
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3">
        {/* Home button */}
        <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => router.push('/channels/me')}>
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-600 rounded mb-2"></div>
        {/* Add Server Button */}
        <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center mb-2 cursor-pointer hover:bg-green-600 transition-colors">
          <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Запросы общения</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-2 space-y-1">
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/channels/me')}>
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"/>
              </svg>
              <span className="text-gray-300">Друзья</span>
            </div>
            <div className="flex items-center p-2 rounded bg-gray-700 text-white cursor-pointer">
              <svg className="w-6 h-6 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
              <span>Запросы общения</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/store')}>
              <svg className="w-6 h-6 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-gray-300">Nitro</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/shop')}>
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 6.55 1 6 1S5 1.45 5 2v2H4c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6h1c.55 0 1-.45 1-1s-.45-1-1-1h-1V4c0-.55-.45-1-1-1s-1 .45-1 1v2H7z"/>
              </svg>
              <span className="text-gray-300">Магазин</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/quest-home')}>
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <span className="text-gray-300">Задания</span>
            </div>
          </div>
  
          {/* User Profile Panel */}
          {userProfile && (
            <div className="p-2 border-t border-gray-700">
              <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors">
                <div className="relative mr-3">
                  <img
                    src={userProfile.avatar_url || '/default-avatar.png'}
                    alt={userProfile.display_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {userProfile.display_name}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {userProfile.username}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="w-6 h-6 text-gray-400 hover:text-white hover:bg-gray-600 rounded p-1">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </button>
                  <button className="w-6 h-6 text-gray-400 hover:text-white hover:bg-gray-600 rounded p-1">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Запросы общения</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-24 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 376 162">
                  <path d="M0 0h376v162H0z" opacity=".1"/>
                  <path d="M188 81c-20.5 0-37-16.5-37-37s16.5-37 37-37 37 16.5 37 37-16.5 37-37 37Zm0-55c-11.6 0-21 9.4-21 21s9.4 21 21 21 21-9.4 21-21-9.4-21-21-21Z"/>
                  <path d="M188 162c-41.4 0-75-33.6-75-75 0-8.3 6.7-15 15-15s15 6.7 15 15c0 24.8 20.2 45 45 45s45-20.2 45-45c0-8.3 6.7-15 15-15s15 6.7 15 15c0 41.4-33.6 75-75 75Z"/>
                </svg>
                <p className="text-gray-400 text-center">У вас нет запросов на добавление в друзья.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center p-3 rounded hover:bg-gray-700 transition-colors">
                    <div className="relative mr-3">
                      <img
                        src={'/default-avatar.png'}
                        alt={request.user_id}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{request.user_id}</div>
                      <div className="text-gray-400 text-sm">Запрос на добавление в друзья</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Принять
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-60 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Активные контакты</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Placeholder for active contacts */}
        </div>
      </div>
    </div>
  );
}