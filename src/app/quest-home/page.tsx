'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Quest {
  id: number;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  completed: boolean;
}

export default function QuestHomePage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      document.title = 'Discord | Задания';
    };

    checkAuth();

    // Load quests - for now using static data, can be extended to load from DB
    const staticQuests: Quest[] = [
      {
        id: 1,
        title: 'Пригласить друга',
        description: 'Пригласите 1 друга в Discord',
        reward: '50 XP',
        progress: 0,
        total: 1,
        completed: false
      },
      {
        id: 2,
        title: 'Отправить сообщение',
        description: 'Отправьте 10 сообщений',
        reward: '25 XP',
        progress: 5,
        total: 10,
        completed: false
      },
      {
        id: 3,
        title: 'Присоединиться к серверу',
        description: 'Присоединитесь к 3 серверам',
        reward: '30 XP',
        progress: 2,
        total: 3,
        completed: false
      },
      {
        id: 4,
        title: 'Добавить реакцию',
        description: 'Добавьте 5 реакций на сообщения',
        reward: '15 XP',
        progress: 5,
        total: 5,
        completed: true
      }
    ];

    setQuests(staticQuests);
    setLoading(false);
  }, [router]);

  const claimReward = (questId: number) => {
    setQuests(quests.map(quest =>
      quest.id === questId
        ? { ...quest, completed: true }
        : quest
    ));
    // Here you would typically send request to backend to claim reward
    alert('Награда получена!');
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
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Задания</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/channels/me')}>
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"/>
              </svg>
              <span className="text-gray-300">Друзья</span>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/message-requests')}>
              <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
              <span className="text-gray-300">Запросы общения</span>
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
            <div className="flex items-center p-2 rounded bg-gray-700 text-white cursor-pointer">
              <svg className="w-6 h-6 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <span>Задания</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Задания</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-gray-400">Загрузка заданий...</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-4">Ежедневные задания</h2>
                  <p className="text-gray-300">Выполняйте задания и получайте награды</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quests.map((quest) => (
                    <div key={quest.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{quest.title}</h3>
                          <p className="text-sm text-gray-300 mb-4">{quest.description}</p>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-yellow-400 font-semibold">{quest.reward}</span>
                            {quest.completed && (
                              <span className="text-green-400 text-sm">✓ Выполнено</span>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl">
                          {quest.completed ? '🎉' : '📋'}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>Прогресс</span>
                          <span>{quest.progress}/{quest.total}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              quest.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {quest.progress >= quest.total && !quest.completed && (
                        <button
                          onClick={() => claimReward(quest.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                        >
                          Получить награду
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-60 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Прогресс</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Общий прогресс</h3>
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {Math.round((quests.filter(q => q.completed).length / quests.length) * 100)}%
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(quests.filter(q => q.completed).length / quests.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {quests.filter(q => q.completed).length} из {quests.length} заданий выполнено
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Награды</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>XP заработано:</span>
                  <span className="text-yellow-400">120</span>
                </div>
                <div className="flex justify-between">
                  <span>Уровень:</span>
                  <span className="text-blue-400">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}