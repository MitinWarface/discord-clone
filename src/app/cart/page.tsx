'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      document.title = 'Discord | Корзина';
    };

    checkAuth();

    // Load cart from localStorage
    const savedCart = localStorage.getItem('discord-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [router]);

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    const newCart = cart.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    setCart(newCart);
    localStorage.setItem('discord-cart', JSON.stringify(newCart));
  };

  const removeItem = (id: number) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('discord-cart', JSON.stringify(newCart));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    alert('Оплата успешно завершена! Спасибо за покупку.');
    setCart([]);
    localStorage.removeItem('discord-cart');
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Корзина</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-24 h-16 text-gray-600 mb-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4V2C7 1.45 6.55 1 6 1S5 1.45 5 2v2H4c-.55 0-1 .45-1 1s.45 1 1 1h1v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6h1c.55 0 1-.45 1-1s-.45-1-1-1h-1V4c0-.55-.45-1-1-1s-1 .45-1 1v2H7z"/>
                </svg>
                <p className="text-gray-400 mb-4">Ваша корзина пуста</p>
                <button
                  onClick={() => router.push('/shop')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                >
                  Перейти в магазин
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                      {item.image_url || '📦'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-400">{item.description}</p>
                      <p className="text-lg font-bold">${item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-gray-800 rounded-lg p-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Итого:</span>
                    <span className="text-2xl font-bold">${getTotal()}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-semibold"
                  >
                    Оплатить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}