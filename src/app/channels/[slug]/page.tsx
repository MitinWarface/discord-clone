'use client'

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChannelsMePage() {
  const { slug } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('online');

  useEffect(() => {
    document.title = 'Discord | Друзья';

    const getFriends = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase!
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) console.error('Error fetching friends:', error);
      else setFriends(data || []);
    };

    getFriends();
  }, []);

  const filteredFriends = friends.filter(friend => {
    if (activeTab === 'online') return true; // Assume all are online for now
    if (activeTab === 'all') return true;
    if (activeTab === 'blocked') return false; // Placeholder
    if (activeTab === 'add-friend') return false; // No friends to show
    return false;
  });

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3">
        {/* Home button */}
        <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-600 transition-colors">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-600 rounded mb-2"></div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">
            {pathname === '/channels/me' ? 'Друзья' : 'Друзья'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            <div className={`flex items-center p-2 rounded cursor-pointer ${pathname === '/channels/me' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}>
              <svg className={`w-6 h-6 mr-3 ${pathname === '/channels/me' ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"/>
              </svg>
              <span className={pathname === '/channels/me' ? 'text-white' : 'text-gray-300'}>Друзья</span>
            </div>
            <div className={`flex items-center p-2 rounded cursor-pointer ${pathname === '/message-requests' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`} onClick={() => router.push('/message-requests')}>
              <svg className={`w-6 h-6 mr-3 ${pathname === '/message-requests' ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
              <span className={pathname === '/message-requests' ? 'text-white' : 'text-gray-300'}>Запросы общения</span>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">
            {pathname === '/channels/me' ? 'Друзья' : 'Друзья'}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Tabs */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('online')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'online' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                В сети — {friends.length}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'blocked' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Заблокированные
              </button>
              <button
                onClick={() => setActiveTab('add-friend')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'add-friend' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Добавить в друзья
              </button>
            </div>

            {/* Friends List */}
            {activeTab === 'add-friend' ? (
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Добавить в друзья</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Имя пользователя#0000"
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                    Отправить запрос
                  </button>
                </div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-24 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 376 162">
                  <path d="M0 0h376v162H0z" opacity=".1"/>
                  <path d="M188 81c-20.5 0-37-16.5-37-37s16.5-37 37-37 37 16.5 37 37-16.5 37-37 37Zm0-55c-11.6 0-21 9.4-21 21s9.4 21 21 21 21-9.4 21-21-9.4-21-21-21Z"/>
                  <path d="M188 162c-41.4 0-75-33.6-75-75 0-8.3 6.7-15 15-15s15 6.7 15 15c0 24.8 20.2 45 45 45s45-20.2 45-45c0-8.3 6.7-15 15-15s15 6.7 15 15c0 41.4-33.6 75-75 75Z"/>
                </svg>
                <p className="text-gray-400 text-center">У вас нет друзей, которые сейчас в сети.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center p-3 rounded hover:bg-gray-700 transition-colors">
                    <div className="relative mr-3">
                      <img
                        src={'/default-avatar.png'}
                        alt={friend.friend_id}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{friend.friend_id}</div>
                      <div className="text-gray-400 text-sm">В сети</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"/>
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M10 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm2 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" clipRule="evenodd"/>
                        </svg>
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
          {friends.slice(0, 5).map((friend) => (
            <div key={friend.id} className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
              <div className="relative mr-3">
                <img
                  src={'/default-avatar.png'}
                  alt={friend.friend_id}
                  className="w-6 h-6 rounded-full"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-800"></div>
              </div>
              <span className="text-gray-300 text-sm truncate">{friend.friend_id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}