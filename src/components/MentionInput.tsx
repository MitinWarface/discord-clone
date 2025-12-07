'use client'

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  serverId?: string;
  channelId?: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function MentionInput({
  value,
  onChange,
  placeholder = 'Введите сообщение...',
  className = '',
  serverId,
  channelId
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search for users when @ is typed
  useEffect(() => {
    const searchUsers = async (query: string) => {
      if (!query.trim() || !supabase) {
        setSuggestions([]);
        return;
      }

      try {
        let queryBuilder = supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(10);

        // If we have server context, prioritize server members
        if (serverId) {
          const { data: serverMembers } = await supabase
            .from('server_members')
            .select('user_id')
            .eq('server_id', serverId);

          if (serverMembers && serverMembers.length > 0) {
            const memberIds = serverMembers.map(m => m.user_id);
            queryBuilder = queryBuilder.in('id', memberIds);
          }
        }

        const { data, error } = await queryBuilder;

        if (error) {
          console.error('Error searching users:', error);
          setSuggestions([]);
        } else {
          setSuggestions(data || []);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSuggestions([]);
      }
    };

    if (mentionQuery) {
      searchUsers(mentionQuery);
    } else {
      setSuggestions([]);
    }
  }, [mentionQuery, serverId]);

  // Handle input changes and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursor);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setMentionQuery('');
      setShowSuggestions(false);
    }
  };

  // Handle user selection from suggestions
  const selectUser = (user: UserSuggestion) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the @ mention start
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    if (mentionStart === -1) return;

    // Replace the @mention with @username
    const newText = textBeforeCursor.substring(0, mentionStart) +
                   `@${user.username}` +
                   textAfterCursor;

    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery('');

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
        rows={3}
      />

      {/* Mention Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 mb-2">
          {suggestions.map((user) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
            >
              <img
                src={user.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                alt={user.display_name}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {user.display_name}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mention Help */}
      {showSuggestions && suggestions.length === 0 && mentionQuery && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3 mb-2 z-10">
          <div className="text-gray-400 text-sm">
            Пользователи не найдены для "{mentionQuery}"
          </div>
        </div>
      )}
    </div>
  );
}