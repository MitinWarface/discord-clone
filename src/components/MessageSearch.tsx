'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  message_type: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  channel_name: string;
  server_name: string;
}

interface MessageSearchProps {
  serverId?: string;
  channelId?: string;
  onClose: () => void;
  onJumpToMessage?: (channelId: string, messageId: string) => void;
}

export default function MessageSearch({ serverId, channelId, onClose, onJumpToMessage }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (!supabase) {
      toast.error('Supabase не инициализирован');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_messages', {
          p_search_term: searchQuery.trim(),
          p_server_id: serverId || null,
          p_channel_id: channelId || null,
          p_limit: 50
        });

      if (error) {
        console.error('Error searching messages:', error);
        toast.error('Ошибка при поиске сообщений');
      } else {
        setResults(data || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при поиске сообщений');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleJumpToMessage = (result: SearchResult) => {
    if (onJumpToMessage) {
      onJumpToMessage(result.channel_id, result.id);
      onClose();
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Поиск сообщений</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск сообщений..."
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
          />
          <div className="absolute right-3 top-3.5">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {serverId && channelId && `Поиск в канале`}
          {serverId && !channelId && `Поиск на сервере`}
          {!serverId && `Поиск во всех серверах`}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {results.length === 0 && hasSearched && !loading && (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <p>Сообщения не найдены</p>
            <p className="text-sm mt-1">Попробуйте изменить запрос</p>
          </div>
        )}

        {results.map((result) => (
          <div
            key={result.id}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
            onClick={() => handleJumpToMessage(result)}
          >
            <div className="flex items-start space-x-3">
              <img
                src={result.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                alt={result.display_name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="font-semibold text-white">{result.display_name}</span>
                  <span className="text-gray-400 text-sm">@{result.username}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(result.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="text-gray-300 mb-2">
                  {highlightSearchTerm(result.content, searchQuery)}
                </div>
                <div className="text-xs text-gray-500">
                  #{result.channel_name} • {result.server_name}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="text-center mt-4 text-gray-400 text-sm">
          Показано {results.length} результатов
        </div>
      )}
    </div>
  );
}