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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [showCreateOwn, setShowCreateOwn] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [serverName, setServerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      document.title = 'Discord | Личные сообщения';

      // Загружаем профиль пользователя
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) console.error('Error fetching profile:', profileError);
      else setUserProfile(profile);

      const getFriends = async () => {
        const { data, error } = await supabase!
          .from('friends')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (error) console.error('Error fetching friends:', error);
        else setFriends(data || []);
      };

      getFriends();
    };

    checkAuth();
  }, [router]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredFriends = friends.filter(friend => {
    if (activeTab === 'online') return true; // Assume all are online for now
    if (activeTab === 'all') return true;
    if (activeTab === 'blocked') return false; // Placeholder
    if (activeTab === 'add-friend') return false; // No friends to show
    return false;
  });

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search users in database using the search_users function
      const { data, error } = await supabase!
        .rpc('search_users', { search_term: query });

      if (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      // Check if request already exists
      const { data: existingRequest } = await supabase!
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
        .single();

      if (existingRequest) {
        alert('Запрос уже отправлен или вы уже друзья!');
        return;
      }

      // Send friend request
      const { error } = await supabase!
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        alert('Ошибка при отправке запроса');
      } else {
        alert('Запрос в друзья отправлен!');
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отправке запроса');
    }
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
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 cursor-pointer hover:bg-green-600 transition-colors" onClick={() => setShowAddServer(true)}>
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>
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
        <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Имя пользователя#0000"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>

                  {searching && (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Поиск...</p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatar}
                              alt={user.display_name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-white font-medium">{user.display_name}</p>
                              <p className="text-gray-400 text-sm">{user.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Добавить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && !searching && searchResults.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                      </svg>
                      <p className="text-gray-400">Пользователь не найден</p>
                      <p className="text-gray-500 text-sm mt-1">Проверьте правильность написания</p>
                    </div>
                  )}
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

      {/* Add Server Modal */}
      {showAddServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[480px] max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Создать сервер</h3>
              <button
                onClick={() => setShowAddServer(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Create My Own */}
              <div
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowAddServer(false);
                  setShowCreateOwn(true);
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Создать мой собственный</h4>
                    <p className="text-gray-300 text-sm">Создайте сервер с нуля</p>
                  </div>
                </div>
              </div>

              {/* Start with Template */}
              <div
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowAddServer(false);
                  setShowTemplates(true);
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Начать с шаблона</h4>
                    <p className="text-gray-300 text-sm">Начните с готового шаблона</p>
                  </div>
                </div>
              </div>

              {/* Join Server */}
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 5h-5v5H7v2h5v5h2v-5h5v-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Присоединиться к серверу</h4>
                    <p className="text-gray-300 text-sm">Войдите на сервер по приглашению</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                Создавая сервер, вы соглашаетесь с <a href="#" className="text-blue-400 hover:underline">Правилами сообщества</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Own Server Modal */}
      {showCreateOwn && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[440px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Расскажите о вашем сервере</h3>
              <button
                onClick={() => {
                  setShowCreateOwn(false);
                  setShowAddServer(true);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Server Icon Upload */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-600 transition-colors">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  Загрузить изображение
                </button>
              </div>

              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium mb-2">НАЗВАНИЕ СЕРВЕРА</label>
                <input
                  type="text"
                  placeholder="Название сервера"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Создавая сервер, вы соглашаетесь с <a href="#" className="text-blue-400 hover:underline">Правилами сообщества</a>
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  setShowCreateOwn(false);
                  setShowAddServer(true);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Назад
              </button>
              <button
                onClick={() => {
                  // TODO: Create server logic
                  alert(`Сервер "${serverName}" создан!`);
                  setServerName('');
                  setShowCreateOwn(false);
                }}
                className={`px-4 py-2 rounded ${
                  serverName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!serverName.trim()}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Выберите шаблон сервера</h3>
              <button
                onClick={() => {
                  setShowTemplates(false);
                  setShowAddServer(true);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Gaming */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-300">Игры</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🎮</span>
                    </div>
                    <h5 className="font-semibold">Игровые друзья</h5>
                    <p className="text-sm text-gray-400">Для игры с друзьями</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🏆</span>
                    </div>
                    <h5 className="font-semibold">Эспорт</h5>
                    <p className="text-sm text-gray-400">Для соревновательных игр</p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-300">Образование</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">📚</span>
                    </div>
                    <h5 className="font-semibold">Учебная группа</h5>
                    <p className="text-sm text-gray-400">Для совместного обучения</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🎓</span>
                    </div>
                    <h5 className="font-semibold">Студенческий клуб</h5>
                    <p className="text-sm text-gray-400">Для студентов</p>
                  </div>
                </div>
              </div>

              {/* Community */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-300">Сообщество</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🌟</span>
                    </div>
                    <h5 className="font-semibold">Фан-сообщество</h5>
                    <p className="text-sm text-gray-400">Для фанатов</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
                    <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🎨</span>
                    </div>
                    <h5 className="font-semibold">Творческое сообщество</h5>
                    <p className="text-sm text-gray-400">Для творческих людей</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button
                onClick={() => {
                  setShowTemplates(false);
                  setShowAddServer(true);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}