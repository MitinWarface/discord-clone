'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface HealthStatus {
  status: 'ok' | 'error'
  message: string
  database?: string
  timestamp?: string
  error?: string
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser()
      setIsLoggedIn(!!user)
    }

    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setHealth(data)
      } catch (error) {
        setHealth({
          status: 'error',
          message: 'Failed to connect to API',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Discord Clone 2.0
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Полнофункциональная копия Discord с современными технологиями: Next.js 16, TypeScript, Supabase и Vercel
          </p>

          {/* Начало работы */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href={isLoggedIn ? '/channels/@me' : '/register'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Войти в приложение
            </a>
            <button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
              </svg>
              Узнать больше
            </button>
          </div>
        </div>

        {/* Статус системы */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Статус системы</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3">Проверка подключения...</span>
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    health.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-lg">
                    {health.status === 'ok' ? '✅ Система работает' : '❌ Ошибка подключения'}
                  </span>
                </div>

                <div className="bg-gray-700 rounded p-4">
                  <p className="text-sm text-gray-300 mb-2">Сообщение:</p>
                  <p className="font-mono text-sm">{health.message}</p>
                </div>

                {health.database && (
                  <div className="bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-300 mb-2">База данных:</p>
                    <p className="font-mono text-sm">
                      {health.database === 'connected' ? '✅ Подключена' : '❌ Ошибка'}
                    </p>
                  </div>
                )}

                {health.error && (
                  <div className="bg-red-900 border border-red-700 rounded p-4">
                    <p className="text-sm text-red-300 mb-2">Ошибка:</p>
                    <p className="font-mono text-sm text-red-200">{health.error}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Следующие шаги */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Следующие шаги</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">1. Настройка Supabase</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Создайте проект на <a href="https://supabase.com" className="text-blue-400 hover:underline">supabase.com</a></li>
                <li>• Выполните SQL из файла <code className="bg-gray-700 px-2 py-1 rounded">supabase-setup.sql</code></li>
                <li>• Обновите переменные в <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code></li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400">2. Развертывание на Vercel</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Подключите репозиторий к Vercel</li>
                <li>• Добавьте переменные окружения в Settings</li>
                <li>• Автоматическое развертывание готово</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">3. Разработка функций</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Аутентификация пользователей</li>
                <li>• Создание серверов и каналов</li>
                <li>• Реал-тайм чат с markdown</li>
                <li>• Эмодзи-реакции на сообщения</li>
                <li>• Система друзей</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">4. Запуск разработки</h3>
              <div className="bg-gray-700 rounded p-4 font-mono text-sm">
                npm run dev
              </div>
              <p className="text-gray-300 mt-2">
                Сервер запустится на <code className="bg-gray-700 px-2 py-1 rounded">http://localhost:3000</code>
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">5. Настройка ботов</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Создайте ботов в Discord Developer Portal</li>
                <li>• Интегрируйте API для автоматизации</li>
                <li>• Добавьте команды и события</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-lime-400">6. Тестирование и оптимизация</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Запустите тесты с Jest и Cypress</li>
                <li>• Оптимизируйте производительность</li>
                <li>• Проверьте безопасность приложения</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Возможности приложения */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold mb-6">Возможности приложения</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Серверы и каналы</h3>
              <p className="text-gray-300">Создавайте и управляйте серверами, организуйте каналы для общения по темам.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Реал-тайм чат</h3>
              <p className="text-gray-300">Общайтесь в текстовых каналах с мгновенными сообщениями и поддержкой markdown.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Система друзей</h3>
              <p className="text-gray-300">Добавляйте друзей, управляйте запросами и общайтесь в приватных чатах.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">😀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Эмодзи-реакции</h3>
              <p className="text-gray-300">Выражайте эмоции с помощью реакций на сообщения в реальном времени.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Голосовые каналы</h3>
              <p className="text-gray-300">Присоединяйтесь к голосовым каналам для аудио общения с друзьями.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Роли и разрешения</h3>
              <p className="text-gray-300">Управляйте ролями пользователей и настройками разрешений на сервере.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">История сообщений</h3>
              <p className="text-gray-300">Просматривайте историю сообщений и ищите по ключевым словам.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Видео-чаты</h3>
              <p className="text-gray-300">Проводите видеоконференции и стримы с высоким качеством.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Боты и интеграции</h3>
              <p className="text-gray-300">Интегрируйте ботов для автоматизации и улучшения функциональности.</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Модерация контента</h3>
              <p className="text-gray-300">Инструменты для модерации сообщества и управления контентом.</p>
            </div>
          </div>
        </div>

        {/* Технологии */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold mb-6">Технологии</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Next.js 16', color: 'bg-blue-600' },
              { name: 'TypeScript', color: 'bg-blue-500' },
              { name: 'Tailwind CSS', color: 'bg-cyan-500' },
              { name: 'Supabase', color: 'bg-green-600' },
              { name: 'Vercel', color: 'bg-black' },
              { name: 'PostgreSQL', color: 'bg-blue-700' },
              { name: 'React 19', color: 'bg-blue-400' },
              { name: 'Node.js', color: 'bg-green-500' },
              { name: 'Jest', color: 'bg-red-500' },
              { name: 'Cypress', color: 'bg-gray-600' },
            ].map((tech) => (
              <div key={tech.name} className={`${tech.color} rounded-lg p-4 text-center`}>
                <span className="font-semibold">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
