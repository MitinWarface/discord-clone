'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ShopPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('nitro');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      document.title = 'Discord | Магазин';
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?category=${activeCategory}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          // Fallback to static data if API fails
          setProducts(getStaticProducts(activeCategory));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(getStaticProducts(activeCategory));
      }
      setLoading(false);
    };

    fetchProducts();
  }, [activeCategory]);

  const getStaticProducts = (category: string) => {
    const allProducts = [
      { id: 1, name: 'Nitro Classic', description: 'Месячная подписка на Nitro', price: 4.99, category: 'nitro', image_url: '⚡' },
      { id: 2, name: 'Nitro Full', description: 'Полная подписка на Nitro', price: 9.99, category: 'nitro', image_url: '💎' },
      { id: 3, name: 'Смайлики Pack', description: 'Набор веселых эмодзи', price: 2.99, category: 'emoji', image_url: '😀' },
      { id: 4, name: 'Космос Pack', description: 'Эмодзи космической тематики', price: 3.99, category: 'emoji', image_url: '🚀' },
      { id: 5, name: 'Арт Стикеры', description: 'Креативные стикеры', price: 1.99, category: 'stickers', image_url: '🎨' },
      { id: 6, name: 'Буст сервера', description: 'Улучшите ваш сервер', price: 4.99, category: 'boosts', image_url: '🚀' },
    ];
    return allProducts.filter(p => p.category === category);
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
          <h2 className="text-sm font-semibold text-gray-300">Магазин</h2>
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
            <div className="flex items-center p-2 rounded bg-gray-700 text-white cursor-pointer">
              <svg className="w-6 h-6 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 6.55 1 6 1S5 1.45 5 2v2H4c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6h1c.55 0 1-.45 1-1s-.45-1-1-1h-1V4c0-.55-.45-1-1-1s-1 .45-1 1v2H7z"/>
              </svg>
              <span>Магазин</span>
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
          <h1 className="text-xl font-semibold">Магазин</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Categories */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveCategory('nitro')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeCategory === 'nitro' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Nitro
              </button>
              <button
                onClick={() => setActiveCategory('emoji')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeCategory === 'emoji' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Эмодзи
              </button>
              <button
                onClick={() => setActiveCategory('stickers')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeCategory === 'stickers' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Стикеры
              </button>
              <button
                onClick={() => setActiveCategory('boosts')}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  activeCategory === 'boosts' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Бусты
              </button>
            </div>

            {/* Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">Загрузка товаров...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">Товары не найдены</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <span className="text-3xl">{product.image_url || '📦'}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-center">{product.name}</h3>
                    <p className="text-sm text-gray-300 mb-4 text-center">{product.description}</p>
                    <div className="text-center mb-4">
                      <span className="text-2xl font-bold">${product.price}</span>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                      Купить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-60 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Рекомендации</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Placeholder for recommendations */}
        </div>
      </div>
    </div>
  );
}