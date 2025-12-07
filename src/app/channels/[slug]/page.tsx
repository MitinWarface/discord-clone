'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChannelsMePage() {
  const { slug } = useParams();
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
    return false;
  });

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3">
        {/* Home button */}
        <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-600 transition-colors">
          <svg className="w-7 h-5 text-white" fill="currentColor" viewBox="0 0 28 20">
            <path d="M20.6644 20C20.6644 20 21.3944 19.2656 21.3944 18.1992C21.3944 17.1328 20.6644 16.3984 20.6644 16.3984C20.6644 16.3984 19.9344 17.1328 19.9344 18.1992C19.9344 19.2656 20.6644 20 20.6644 20ZM14.7016 20C14.7016 20 15.4316 19.2656 15.4316 18.1992C15.4316 17.1328 14.7016 16.3984 14.7016 16.3984C14.7016 16.3984 13.9716 17.1328 13.9716 18.1992C13.9716 19.2656 14.7016 20 14.7016 20ZM8.7388 20C8.7388 20 9.4688 19.2656 9.4688 18.1992C9.4688 17.1328 8.7388 16.3984 8.7388 16.3984C8.7388 16.3984 8.0088 17.1328 8.0088 18.1992C8.0088 19.2656 8.7388 20 8.7388 20Z"/>
            <path d="M2.6644 20C2.6644 20 3.3944 19.2656 3.3944 18.1992C3.3944 17.1328 2.6644 16.3984 2.6644 16.3984C2.6644 16.3984 1.9344 17.1328 1.9344 18.1992C1.9344 19.2656 2.6644 20 2.6644 20ZM26.6644 20C26.6644 20 27.3944 19.2656 27.3944 18.1992C27.3944 17.1328 26.6644 16.3984 26.6644 16.3984C26.6644 16.3984 25.9344 17.1328 25.9344 18.1992C25.9344 19.2656 26.6644 20 26.6644 20Z"/>
            <path d="M0 10.1992C0 8.01424 1.01424 6.1992 2.6644 5.1328C4.31456 4.0664 6.6644 3.1992 9.9976 2.1992C13.3308 1.1992 16.6644 0.6656 20 0.6656C23.3356 0.6656 26.6692 1.1992 30.0024 2.1992C33.3356 3.1992 35.6854 4.0664 37.3356 5.1328C38.9858 6.1992 40 8.01424 40 10.1992V20H0V10.1992Z"/>
          </svg>
        </div>
        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-600 rounded mb-2"></div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Друзья</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            <div className={`flex items-center p-2 rounded cursor-pointer ${slug === '@me' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}>
              <svg className={`w-6 h-6 mr-3 ${slug === '@me' ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"/>
              </svg>
              <span className={slug === '@me' ? 'text-white' : 'text-gray-300'}>Друзья</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
              <span className="text-gray-300">Запросы общения</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
              <svg className="w-6 h-6 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-gray-300">Nitro</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 6.55 1 6 1S5 1.45 5 2v2H4c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6h1c.55 0 1-.45 1-1s-.45-1-1-1h-1V4c0-.55-.45-1-1-1s-1 .45-1 1v2H7z"/>
              </svg>
              <span className="text-gray-300">Магазин</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
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
          <h1 className="text-xl font-semibold">Друзья</h1>
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
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'pending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Ожидание
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeTab === 'blocked' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Заблокированные
              </button>
            </div>

            {/* Friends List */}
            {filteredFriends.length === 0 ? (
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