'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(setHealth)
      .catch(error => setHealth({
        status: 'error',
        message: 'Failed to connect to API',
        error: error.message
      }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Discord Clone
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Полная копия Discord с использованием Next.js и Supabase
          </p>
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
                <li>• Реал-тайм чат</li>
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
          </div>
        </div>

        {/* Технологии */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold mb-6">Технологии</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Next.js 16', color: 'bg-blue-600' },
              { name: 'TypeScript', color: 'bg-blue-500' },
              { name: 'Tailwind CSS', color: 'bg-cyan-500' },
              { name: 'Supabase', color: 'bg-green-600' },
              { name: 'Vercel', color: 'bg-black' },
              { name: 'PostgreSQL', color: 'bg-blue-700' },
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
