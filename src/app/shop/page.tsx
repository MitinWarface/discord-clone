'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ShopPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [cart, setCart] = useState<any[]>([]);

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

      if (profileError) console.error('Error fetching profile:', profileError);
      else setUserProfile(profile);

      document.title = 'Discord | Магазин';
    };

    checkAuth();

    // Load cart from localStorage
    const savedCart = localStorage.getItem('discord-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const categoryParam = activeCategory === 'all' ? '' : `?category=${activeCategory}`;
        const response = await fetch(`/api/products${categoryParam}`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setProducts(data);
          } else {
            // Use static data if DB is empty
            setProducts(getStaticProducts(activeCategory));
          }
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

  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price
    if (priceFilter !== 'all') {
      switch (priceFilter) {
        case 'under-5':
          filtered = filtered.filter(product => product.price < 5);
          break;
        case '5-10':
          filtered = filtered.filter(product => product.price >= 5 && product.price <= 10);
          break;
        case 'over-10':
          filtered = filtered.filter(product => product.price > 10);
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, priceFilter]);

  const getStaticProducts = (category: string) => {
    const allProducts = [
      { id: 1, name: 'Nitro Classic', description: 'Месячная подписка на Nitro', price: 4.99, category: 'nitro', image_url: '⚡' },
      { id: 2, name: 'Nitro Full', description: 'Полная подписка на Nitro', price: 9.99, category: 'nitro', image_url: '💎' },
      { id: 3, name: 'Смайлики Pack', description: 'Набор веселых эмодзи', price: 2.99, category: 'emoji', image_url: '😀' },
      { id: 4, name: 'Космос Pack', description: 'Эмодзи космической тематики', price: 3.99, category: 'emoji', image_url: '🚀' },
      { id: 5, name: 'Арт Стикеры', description: 'Креативные стикеры', price: 1.99, category: 'stickers', image_url: '🎨' },
      { id: 6, name: 'Буст сервера', description: 'Улучшите ваш сервер', price: 4.99, category: 'boosts', image_url: '🚀' },
    ];
    return category === 'all' ? allProducts : allProducts.filter(p => p.category === category);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(newCart);
    localStorage.setItem('discord-cart', JSON.stringify(newCart));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
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
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 cursor-pointer hover:bg-green-600 transition-colors">
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Магазин</h2>
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

        {/* User Profile Panel */}
        {userProfile && (
          <div className="p-2 border-t border-gray-700">
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors">
              <div className="relative mr-3">
                <img
                  src={userProfile.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
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
                  {userProfile.username}#{userProfile.discriminator.toString().padStart(4, '0')}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Магазин</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 6.55 1 6 1S5 1.45 5 2v2H4c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6h1c.55 0 1-.45 1-1s-.45-1-1-1h-1V4c0-.55-.45-1-1-1s-1 .45-1 1v2H7z"/>
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-400">${getCartTotal()}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Категория</label>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Все</option>
                    <option value="nitro">Nitro</option>
                    <option value="emoji">Эмодзи</option>
                    <option value="stickers">Стикеры</option>
                    <option value="boosts">Бусты</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Цена</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Все цены</option>
                    <option value="under-5">До $5</option>
                    <option value="5-10">$5 - $10</option>
                    <option value="over-10">Более $10</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            {!loading && filteredProducts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Рекомендуемые товары</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProducts.slice(0, 4).map((product) => (
                    <div key={`rec-${product.id}`} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-all duration-200 hover:scale-105">
                      <div className="w-full h-20 bg-gray-700 rounded-lg flex items-center justify-center text-2xl mb-3">
                        {product.image_url || '📦'}
                      </div>
                      <h4 className="font-semibold text-sm mb-1 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">${product.price}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        >
                          Купить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">Товары не найдены</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4 mx-auto transition-transform duration-300 hover:scale-110">
                      <span className="text-3xl">{product.image_url || '📦'}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-center">{product.name}</h3>
                    <p className="text-sm text-gray-300 mb-4 text-center">{product.description}</p>
                    <div className="text-center mb-4">
                      <span className="text-2xl font-bold">${product.price}</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-all duration-200 hover:shadow-md"
                    >
                      Добавить в корзину
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