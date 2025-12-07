'use client'

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canManageChannels, canSendMessages, canManageRoles, canManageServer, canKickMembers, canBanMembers } from '@/lib/permissions';
import { useServers } from '@/lib/ServerContext';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import RoleManager from '@/components/RoleManager';
import InviteManager from '@/components/InviteManager';
import ModerationPanel from '@/components/ModerationPanel';
import MessageSearch from '@/components/MessageSearch';
import ChannelSettings from '@/components/ChannelSettings';
import PinnedMessagesModal from '@/components/PinnedMessagesModal';
import FileUpload from '@/components/FileUpload';
import MentionInput from '@/components/MentionInput';
import NotificationPanel from '@/components/NotificationPanel';

interface ChannelItem {
  id: string;
  name?: string;
  type: 'category' | 'channel';
  position?: number;
  server_id?: string;
  category_id?: string | null;
  created_at?: string;
  updated_at?: string;
  channels?: ChannelItem[];
}

interface UserProfile {
  id: string;
  username: string;
  username_base: string;
  discriminator: number;
  display_name: string;
  avatar_url: string | null;
  avatar?: string | null; // For search results
  created_at: string;
  updated_at: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friend_profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Server {
  id: string;
  name: string;
  owner_id: string;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  position: number;
  server_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DmChannel {
  id: string;
  name: string;
  avatar: string | null;
  username: string;
  created_at: string;
}

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  file_attachments?: FileAttachment[];
  user_profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  mentions?: any[]; // Will fix later
}

interface FileAttachment {
  id: string;
  message_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface UserStatus {
  user_id: string;
  status: string;
  last_seen?: string;
}

export default function ChannelsMePage() {
  const { slug } = useParams();
  const decodedSlug = typeof slug === 'string' ? decodeURIComponent(slug) : '';
  const pathname = usePathname();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState('online');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [showCreateOwn, setShowCreateOwn] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showInviteManager, setShowInviteManager] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [serverName, setServerName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [serverCategories, setServerCategories] = useState<ChannelItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [joinServerName, setJoinServerName] = useState('');
  const [editServerName, setEditServerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const { servers, refreshServers } = useServers();
  const [serverChannels, setServerChannels] = useState<ChannelItem[]>([]);
  const [dmChannels, setDmChannels] = useState<DmChannel[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentDmChannel, setCurrentDmChannel] = useState<DmChannel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{[messageId: string]: Reaction[]}>({});
  const [userStatuses, setUserStatuses] = useState<{[userId: string]: UserStatus}>({});

  // Update user presence on mount and cleanup
  useEffect(() => {
    const updatePresence = async (status: string) => {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          await supabase!.rpc('update_user_presence', {
            p_user_id: user.id,
            p_status: status
          });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Set online when component mounts
    updatePresence('online');

    // Set offline when component unmounts or page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('idle');
      } else {
        updatePresence('online');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, []);

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
        .maybeSingle(); // Используем maybeSingle вместо single

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        console.log('Profile loaded:', profile);
        setUserProfile(profile);
      } else {
        // Профиль не найден, создаем новый
        console.log('Profile not found, creating new one...');
        const { data: userData } = await supabase!.auth.getUser();
        if (userData.user) {
          const { error: createError } = await supabase!
            .from('profiles')
            .insert({
              id: userData.user.id,
              username: userData.user.user_metadata?.username || 'User',
              username_base: userData.user.user_metadata?.username || 'User',
              discriminator: 1,
              display_name: userData.user.user_metadata?.username || 'User',
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            // Повторно загружаем профиль
            const { data: newProfile } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (newProfile) {
              console.log('Profile created and loaded:', newProfile);
              setUserProfile(newProfile);
            }
          }
        }
      }

      const getFriends = async () => {
        const { data, error } = await supabase!
          .from('friends')
          .select(`
            *,
            friend_profile:friend_id (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (error) console.error('Error fetching friends:', error);
        else setFriends(data || []);
      };


      const getDmChannels = async () => {
        try {
          const { data, error } = await supabase!
            .from('dm_channel_members')
            .select(`
              dm_channel_id,
              dm_channels!inner (
                id,
                created_at,
                dm_channel_members!inner (
                  user_id,
                  profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                  )
                )
              )
            `)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching DM channels:', error);
          } else {
            // Process DM channels to get other participants
            const processedDmChannels = (data || []).map((item: any) => {
              const channel = item.dm_channels;
              const otherMembers = channel.dm_channel_members.filter((m: any) => m.user_id !== user.id);
              const otherUser = otherMembers[0]?.profiles;

              return {
                id: channel.id,
                name: otherUser?.display_name || otherUser?.username || 'Unknown User',
                avatar: otherUser?.avatar_url,
                username: otherUser?.username,
                created_at: channel.created_at
              };
            });

            setDmChannels(processedDmChannels);
          }
        } catch (error) {
          console.error('Error in getDmChannels:', error);
        }
      };

      const getUserStatuses = async () => {
        const { data, error } = await supabase!
          .from('user_presence')
          .select('*');

        if (error) console.error('Error fetching user statuses:', error);
        else {
          const statusMap: {[userId: string]: any} = {};
          data?.forEach(status => {
            statusMap[status.user_id] = status;
          });
          setUserStatuses(statusMap);
        }
      };

      getFriends();
      getDmChannels();
      getUserStatuses();

      // Subscribe to user presence changes
      const presenceChannel = supabase!
        .channel('user_presence')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        }, (payload) => {
          setUserStatuses(prev => {
            const newStatuses = { ...prev };
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              newStatuses[payload.new.user_id] = {
                user_id: payload.new.user_id,
                status: payload.new.status,
                last_seen: payload.new.last_seen
              };
            } else if (payload.eventType === 'DELETE') {
              delete newStatuses[payload.old.user_id];
            }
            return newStatuses;
          });
        })
        .subscribe();

      // If slug is a server ID, load server and channels
      if (decodedSlug !== 'me' && decodedSlug !== '@me') {
        const loadServerData = async () => {
          console.log('Loading server data for slug:', decodedSlug, 'user.id:', user.id);
          // Check if user is member of this server
          const { data: membership, error: membershipError } = await supabase!
            .from('server_members')
            .select(`
              *,
              roles (
                id,
                name,
                color,
                permissions
              )
            `)
            .eq('server_id', decodedSlug)
            .eq('user_id', user.id)
            .maybeSingle();

          if (membership) {
            // Get server details separately
            const { data: serverData } = await supabase!
              .from('servers')
              .select('*')
              .eq('id', decodedSlug)
              .maybeSingle();

            if (serverData) {
              membership.servers = serverData;
            }
          }

          console.log('Membership result:', membership, 'error:', membershipError);

          if (membership) {
            setCurrentServer(membership.servers);

            // Load categories and channels
            const { data: categories } = await supabase!
              .from('categories')
              .select(`
                *,
                channels (*)
              `)
              .eq('server_id', decodedSlug)
              .order('position');

            const { data: uncategorizedChannels } = await supabase!
              .from('channels')
              .select('*')
              .eq('server_id', decodedSlug)
              .is('category_id', null)
              .order('position');

            // Combine categorized and uncategorized channels
            const allChannels: any[] = [];
            if (categories) {
              categories.forEach((category: any) => {
                allChannels.push({ ...category, type: 'category' });
                if (category.channels) {
                  category.channels.forEach((channel: any) => {
                    allChannels.push({ ...channel, type: 'channel' });
                  });
                }
              });
            }
            if (uncategorizedChannels) {
              uncategorizedChannels.forEach((channel: any) => {
                allChannels.push({ ...channel, type: 'channel' });
              });
            }

            setServerChannels(allChannels);

            // Extract categories for channel creation
            const categoriesOnly = allChannels.filter(item => item.type === 'category');
            setServerCategories(categoriesOnly);

            // Set first channel as current if available
            const firstChannel = allChannels.find(item => item.type === 'channel');
            if (firstChannel) {
              setCurrentChannel(firstChannel);
            }
          } else {
            // Not a member, redirect to friends
            router.push('/channels/@me');
          }
        };

        loadServerData();
      }
    };

    checkAuth();
  }, [router, decodedSlug]);

  // Load messages and reactions when channel changes
  useEffect(() => {
    if (!currentChannel && !currentDmChannel) return;

    const setupRealtime = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping realtime subscriptions');
        return;
      }

      console.log('Setting up realtime subscriptions for user:', user.id);

      setHasMore(true);
      setLoadingMore(false);

    const loadMessages = async () => {
      const channelId = currentChannel?.id || currentDmChannel?.id;
      if (!channelId) return;

      // First load messages without profiles
      const { data: messagesData, error: messagesError } = await supabase!
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return;
      }

      // Then load profiles and attachments for the users
      if (messagesData && messagesData.length > 0) {
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const messageIds = messagesData.map(m => m.id);

        // Load profiles
        const { data: profilesData, error: profilesError } = await supabase!
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
        }

        // Load file attachments
        const { data: attachmentsData, error: attachmentsError } = await supabase!
          .from('file_attachments')
          .select('*')
          .in('message_id', messageIds);

        if (attachmentsError) {
          console.error('Error loading attachments:', attachmentsError);
        }

        // Load mentions
        const { data: mentionsData, error: mentionsError } = await supabase!
          .from('mentions')
          .select(`
            *,
            mentioned_user:mentioned_user_id (
              id,
              username,
              display_name
            )
          `)
          .in('message_id', messageIds);

        if (mentionsError) {
          console.error('Error loading mentions:', mentionsError);
        }

        // Group attachments by message_id
        const attachmentsMap: {[messageId: string]: any[]} = {};
        attachmentsData?.forEach(attachment => {
          if (!attachmentsMap[attachment.message_id]) {
            attachmentsMap[attachment.message_id] = [];
          }
          attachmentsMap[attachment.message_id].push(attachment);
        });

        // Group mentions by message_id
        const mentionsMap: {[messageId: string]: any[]} = {};
        mentionsData?.forEach(mention => {
          if (!mentionsMap[mention.message_id]) {
            mentionsMap[mention.message_id] = [];
          }
          mentionsMap[mention.message_id].push(mention);
        });

        // Combine messages with profiles and attachments
        const messagesWithProfiles = messagesData.map(message => ({
          ...message,
          profiles: profilesData?.find(p => p.id === message.user_id) || null,
          file_attachments: attachmentsMap[message.id] || []
        }));

        setMessages(messagesWithProfiles);
        if (messagesData.length < 50) {
          setHasMore(false);
        }

        // Load reactions for these messages
        const { data: reactionsData, error: reactionsError } = await supabase!
          .from('reactions')
          .select('*')
          .in('message_id', messageIds);

        if (!reactionsError && reactionsData) {
          const reactionsMap: {[messageId: number]: any[]} = {};
          reactionsData.forEach(reaction => {
            if (!reactionsMap[reaction.message_id]) {
              reactionsMap[reaction.message_id] = [];
            }
            reactionsMap[reaction.message_id].push(reaction);
          });
          setReactions(reactionsMap);
        }
      } else {
        setMessages([]);
        setHasMore(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channelId = currentChannel?.id || currentDmChannel?.id;
    const messagesChannel = supabase!
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        console.log('New message received:', payload.new);

        // Only process messages for current channel
        if (payload.new.channel_id !== channelId) {
          return;
        }

        // Fetch profile for the new message
        const { data: profile } = await supabase!
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const messageWithProfile: Message = {
          id: payload.new.id,
          channel_id: payload.new.channel_id,
          user_id: payload.new.user_id,
          content: payload.new.content,
          message_type: payload.new.message_type,
          created_at: payload.new.created_at,
          updated_at: payload.new.updated_at,
          profiles: profile ? { ...profile, id: payload.new.user_id } : null,
          file_attachments: [],
          mentions: []
        };

        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (!exists) {
            console.log('Adding new message to state:', messageWithProfile);
            return [...prev, messageWithProfile];
          }
          return prev;
        });
      })
      .subscribe((status, err) => {
        console.log('Messages subscription status:', status, err);
      });

    // Subscribe to reactions
    if (!currentChannel?.id) return;
    const reactionsChannel = supabase!
      .channel(`reactions:${currentChannel.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions'
      }, async (payload) => {
        console.log('Reaction change received:', payload);

        // Check if this reaction belongs to a message in current channel
        const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
        if (!messageId) return;

        const { data: message } = await supabase!
          .from('messages')
          .select('channel_id')
          .eq('id', messageId)
          .maybeSingle();

        if (!message || message.channel_id !== channelId) {
          return;
        }

        // Update reactions state
        setReactions(prev => {
          const newReactions = { ...prev };

          if (payload.eventType === 'INSERT') {
            const reaction: Reaction = {
              id: payload.new.id,
              message_id: payload.new.message_id,
              user_id: payload.new.user_id,
              emoji: payload.new.emoji,
              created_at: payload.new.created_at
            };
            if (!newReactions[reaction.message_id]) {
              newReactions[reaction.message_id] = [];
            }
            // Check if reaction already exists
            const exists = newReactions[reaction.message_id].some(r => r.id === reaction.id);
            if (!exists) {
              console.log('Adding new reaction to state:', reaction);
              newReactions[reaction.message_id].push(reaction);
            }
          } else if (payload.eventType === 'DELETE') {
            const reaction = payload.old;
            if (newReactions[reaction.message_id]) {
              newReactions[reaction.message_id] = newReactions[reaction.message_id]
                .filter(r => r.id !== reaction.id);
            }
          }

          return newReactions;
        });
      })
      .subscribe((status, err) => {
        console.log('Reactions subscription status:', status, err);
      });

      setupRealtime();

      return () => {
        console.log('Cleaning up subscriptions for channel:', channelId);
        messagesChannel.unsubscribe();
        reactionsChannel.unsubscribe();
      };
    };

    setupRealtime();
  }, [currentChannel, currentDmChannel]);

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
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      // Search users in database using the search_users function
      const { data, error } = await supabase!
        .rpc('search_users', { search_term: query });

      if (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } else {
        // Filter out current user
        const filteredResults = (data || []).filter((u: UserProfile) => u.id !== user.id);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
    setSearching(false);
  };

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

  const sendFriendRequest = async (userId: string) => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      // Prevent sending request to yourself
      if (user.id === userId) {
        toast.error('Вы не можете добавить себя в друзья!');
        return;
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase!
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existingRequest) {
        toast.error('Запрос уже отправлен или вы уже друзья!');
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
        toast.error('Ошибка при отправке запроса');
      } else {
        // Create notification for friend request
        await supabase!.rpc('create_notification', {
          p_user_id: userId,
          p_type: 'friend_request',
          p_title: `${userProfile?.display_name || userProfile?.username} отправил запрос в друзья`,
          p_content: null,
          p_data: {
            from_user_id: user.id
          }
        });

        toast.success('Запрос в друзья отправлен!');
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отправке запроса');
    }
  };

  const createDMChannel = async (userId: string) => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      if (user.id === userId) {
        toast.error('Вы не можете создать DM с самим собой!');
        return;
      }

      // Create DM channel using RPC function
      const { data: dmChannelId, error } = await supabase!
        .rpc('create_dm_channel', {
          p_user1_id: user.id,
          p_user2_id: userId
        });

      if (error) {
        console.error('Error creating DM channel:', error);
        toast.error('Ошибка при создании DM канала');
        return;
      }

      // Refresh DM channels
      const { data, error: dmError } = await supabase!
        .from('dm_channel_members')
        .select(`
          dm_channel_id,
          dm_channels!inner (
            id,
            created_at,
            dm_channel_members!inner (
              user_id,
              profiles:user_id (
                username,
                display_name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (!dmError && data) {
        const processedDmChannels = data.map((item: any) => {
          const channel = item.dm_channels;
          const otherMembers = channel.dm_channel_members.filter((m: any) => m.user_id !== user.id);
          const otherUser = otherMembers[0]?.profiles;

          return {
            id: channel.id,
            name: otherUser?.display_name || otherUser?.username || 'Unknown User',
            avatar: otherUser?.avatar_url,
            username: otherUser?.username,
            created_at: channel.created_at
          };
        });

        setDmChannels(processedDmChannels);
      }

      toast.success('DM канал создан!');
      setSearchQuery('');
      setSearchResults([]);

      // Navigate to the new DM channel
      router.push(`/channels/${dmChannelId}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при создании DM канала');
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || (!currentChannel && !currentDmChannel)) return;

    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const channelId = currentChannel?.id || currentDmChannel?.id;

      // For server channels, check permissions
      if (currentChannel && currentServer) {
        const canSend = await canSendMessages(user.id, currentServer.id);
        if (!canSend) {
          toast.error('У вас нет прав на отправку сообщений');
          return;
        }
      }

      // Create message
      const { data: message, error: messageError } = await supabase!
        .from('messages')
        .insert({
          channel_id: channelId,
          user_id: user.id,
          content: newMessage.trim() || (selectedFiles.length > 0 ? 'Файлы' : ''),
          message_type: selectedFiles.length > 0 ? 'file' : 'text'
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        toast.error('Ошибка при отправке сообщения');
        return;
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase!.storage
              .from('file-attachments')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              toast.error(`Ошибка при загрузке файла ${file.name}`);
              continue;
            }

            // Save file metadata
            const { error: attachmentError } = await supabase!
              .from('file_attachments')
              .insert({
                message_id: message.id,
                filename: fileName,
                original_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                file_path: uploadData.path,
                uploaded_by: user.id
              });

            if (attachmentError) {
              console.error('Error saving attachment:', attachmentError);
              toast.error(`Ошибка при сохранении файла ${file.name}`);
            }
          } catch (error) {
            console.error('Error processing file:', error);
            toast.error(`Ошибка при обработке файла ${file.name}`);
          }
        }
      }

      // Process mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(newMessage)) !== null) {
        const username = match[1];
        // Find user by username
        const { data: mentionedUser } = await supabase!
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (mentionedUser) {
          mentions.push({
            message_id: message.id,
            mentioned_user_id: mentionedUser.id,
            mentioned_by: user.id
          });
        }
      }

      // Insert mentions and create notifications
      if (mentions.length > 0) {
        const { error: mentionError } = await supabase!
          .from('mentions')
          .insert(mentions);

        if (mentionError) {
          console.error('Error creating mentions:', mentionError);
        } else {
          // Create notifications for mentions
          for (const mention of mentions) {
            await supabase!.rpc('create_notification', {
              p_user_id: mention.mentioned_user_id,
              p_type: 'mention',
              p_title: `${userProfile?.display_name || userProfile?.username} упомянул вас`,
              p_content: newMessage.trim(),
              p_data: {
                message_id: message.id,
                channel_id: channelId,
                server_id: currentServer?.id
              }
            });
          }
        }
      }

      // Clear form
      setNewMessage('');
      setSelectedFiles([]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка при отправке сообщения');
    }
  };

  const handleChannelClick = (channel: any) => {
    setCurrentChannel(channel);
  };

  const jumpToMessage = async (channelId: string, messageId: string) => {
    // If it's a different channel, switch to it first
    if (currentChannel?.id !== channelId) {
      const { data: channel } = await supabase!
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (channel) {
        setCurrentChannel(channel);
        // Wait a bit for the channel to load, then scroll to message
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${messageId}`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('bg-yellow-900', 'bg-opacity-50');
            setTimeout(() => {
              messageElement.classList.remove('bg-yellow-900', 'bg-opacity-50');
            }, 2000);
          }
        }, 1000);
      }
    } else {
      // Same channel, just scroll to message
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('bg-yellow-900', 'bg-opacity-50');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-900', 'bg-opacity-50');
        }, 2000);
      }
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      // Check if user already reacted with this emoji
      const existingReaction = reactions[messageId]?.find(
        (r: any) => r.user_id === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase!
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) {
          console.error('Error removing reaction:', error);
        }
      } else {
        // Add reaction
        const { error } = await supabase!
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji
          });

        if (error) {
          console.error('Error adding reaction:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    router.push('/channels/@me');
  };

  const loadMoreMessages = async () => {
    if (!currentChannel || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const { data: messagesData, error: messagesError } = await supabase!
        .from('messages')
        .select('*')
        .eq('channel_id', currentChannel.id)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        console.error('Error loading more messages:', messagesError);
      } else {
        if (messagesData && messagesData.length > 0) {
          // Load profiles and attachments for new messages
          const userIds = [...new Set(messagesData.map(m => m.user_id))];
          const messageIds = messagesData.map(m => m.id);

          // Load profiles
          const { data: profilesData, error: profilesError } = await supabase!
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error loading profiles for more messages:', profilesError);
          }

          // Load file attachments
          const { data: attachmentsData, error: attachmentsError } = await supabase!
            .from('file_attachments')
            .select('*')
            .in('message_id', messageIds);

          if (attachmentsError) {
            console.error('Error loading attachments for more messages:', attachmentsError);
          }

          // Load mentions
          const { data: mentionsData, error: mentionsError } = await supabase!
            .from('mentions')
            .select(`
              *,
              mentioned_user:mentioned_user_id (
                id,
                username,
                display_name
              )
            `)
            .in('message_id', messageIds);

          if (mentionsError) {
            console.error('Error loading mentions for more messages:', mentionsError);
          }

          // Group attachments by message_id
          const attachmentsMap: {[messageId: string]: any[]} = {};
          attachmentsData?.forEach(attachment => {
            if (!attachmentsMap[attachment.message_id]) {
              attachmentsMap[attachment.message_id] = [];
            }
            attachmentsMap[attachment.message_id].push(attachment);
          });

          // Group mentions by message_id
          const mentionsMap: {[messageId: string]: any[]} = {};
          mentionsData?.forEach(mention => {
            if (!mentionsMap[mention.message_id]) {
              mentionsMap[mention.message_id] = [];
            }
            mentionsMap[mention.message_id].push(mention);
          });

          // Combine messages with profiles, attachments and mentions
          const messagesWithProfiles = messagesData.map(message => ({
            ...message,
            profiles: profilesData?.find(p => p.id === message.user_id) || null,
            file_attachments: attachmentsMap[message.id] || [],
            mentions: mentionsMap[message.id] || []
          }));

          setMessages(prev => [...messagesWithProfiles.reverse(), ...prev]);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoadingMore(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3">
        {/* Home button */}
        <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => router.push('/channels/@me')}>
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-600 rounded mb-2"></div>

        {/* Servers */}
        {servers.map((server) => (
          <div
            key={server.id}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 cursor-pointer transition-colors ${
              decodedSlug === server.id ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => router.push(`/channels/${server.id}`)}
            title={server.name}
          >
            {server.icon_url ? (
              <img src={server.icon_url} alt={server.name} className="w-8 h-8 rounded-xl" />
            ) : (
              <span className="text-white font-bold text-sm">
                {server.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}

        {/* Add Server Button */}
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 cursor-pointer hover:bg-green-600 transition-colors" onClick={() => setShowAddServer(true)}>
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2
            className={`text-sm font-semibold text-gray-300 ${currentServer ? 'cursor-pointer hover:text-white' : ''}`}
            onClick={() => currentServer && setShowServerSettings(true)}
          >
            {currentServer ? currentServer.name : 'Друзья'}
          </h2>
          {currentServer && (
            <button
              onClick={() => setShowCreateChannel(true)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-600 transition-colors"
              title="Создать канал"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {currentServer ? (
              // Server channels with categories
              serverChannels.map((item) => {
                if (item.type === 'category') {
                  return (
                    <div key={item.id} className="mb-2">
                      <div className="flex items-center px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-300 cursor-pointer">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                        {item.name}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center p-2 rounded cursor-pointer ml-2 ${
                        currentChannel?.id === item.id ? 'bg-gray-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                      }`}
                      onClick={() => handleChannelClick(item)}
                    >
                      <svg className="w-6 h-6 mr-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
                      </svg>
                      <span>#{item.name}</span>
                    </div>
                  );
                }
              })
            ) : (
              // Friends menu
              <>
                <div className={`flex items-center p-2 rounded cursor-pointer ${(pathname === '/channels/me' || pathname === '/channels/@me') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}>
                  <svg className={`w-6 h-6 mr-3 ${(pathname === '/channels/me' || pathname === '/channels/@me') ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                    <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"/>
                  </svg>
                  <span className={(pathname === '/channels/me' || pathname === '/channels/@me') ? 'text-white' : 'text-gray-300'}>Друзья</span>
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

                {/* DM Channels */}
                {dmChannels.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                      Прямые сообщения
                    </div>
                    {dmChannels.map((dmChannel) => (
                      <div
                        key={dmChannel.id}
                        className={`flex items-center p-2 rounded cursor-pointer ${
                          currentDmChannel?.id === dmChannel.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-300'
                        }`}
                        onClick={() => {
                          setCurrentDmChannel(dmChannel);
                          setCurrentChannel(null);
                          setCurrentServer(null);
                        }}
                      >
                        <img
                          src={dmChannel.avatar || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                          alt={dmChannel.name}
                          className="w-6 h-6 rounded-full mr-3"
                        />
                        <span className="truncate">{dmChannel.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* User Profile Panel - Always at bottom */}
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
                <button
                  onClick={() => setShowNotifications(true)}
                  className="w-6 h-6 text-gray-400 hover:text-white hover:bg-gray-600 rounded p-1 relative"
                  title="Уведомления"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                </button>
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
                <button
                  onClick={handleLogout}
                  className="w-6 h-6 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded p-1"
                  title="Выйти"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">
                {currentChannel ? `#${currentChannel.name}` : currentDmChannel ? currentDmChannel.name : (pathname === '/channels/@me' ? 'Друзья' : 'Друзья')}
              </h1>
              {currentChannel && (
                <button
                  onClick={() => setShowChannelSettings(true)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title="Настройки канала"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                </button>
              )}
            </div>
            {currentChannel && (
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowPinnedMessages(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title="Закрепленные сообщения"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setShowMessageSearch(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title="Поиск сообщений"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4">
            {/* Chat or Friends */}
            {currentChannel ? (
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={handleScroll}>
                  {loadingMore && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <svg className="w-24 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
                      </svg>
                      <p className="text-gray-400 text-center">Это начало канала #{currentChannel.name}</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const messageReactions = reactions[message.id] || [];
                      const groupedReactions = messageReactions.reduce((acc: any, reaction: any) => {
                        if (!acc[reaction.emoji]) {
                          acc[reaction.emoji] = { count: 0, users: [] };
                        }
                        acc[reaction.emoji].count += 1;
                        acc[reaction.emoji].users.push(reaction.user_id);
                        return acc;
                      }, {});

                      return (
                        <div key={message.id} id={`message-${message.id}`} className="flex items-start space-x-3 group">
                          <img
                            src={message.user_profile?.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                            alt={message.user_profile?.display_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-white font-semibold">{message.user_profile?.display_name}</span>
                              <span className="text-gray-400 text-xs">
                                {new Date(message.created_at).toLocaleString('ru-RU')}
                              </span>
                            </div>
                            <div className="text-gray-300 mt-1 prose prose-invert max-w-none">
                              <ReactMarkdown components={{
                                p: ({children}) => {
                                  // Highlight mentions
                                  const content = children?.toString() || '';
                                  const parts = content.split(/(@\w+)/g);

                                  return (
                                    <p>
                                      {parts.map((part, index) => {
                                        if (part.startsWith('@')) {
                                          const username = part.slice(1);
                                          // Check if this is a valid mention
                                          const isValidMention = message.mentions?.some(
                                            (mention: any) => mention.mentioned_user?.username === username
                                          );

                                          return (
                                            <span
                                              key={index}
                                              className={isValidMention ? 'bg-blue-600/20 text-blue-400 px-1 py-0.5 rounded font-medium' : ''}
                                            >
                                              {part}
                                            </span>
                                          );
                                        }
                                        return <span key={index}>{part}</span>;
                                      })}
                                    </p>
                                  );
                                }
                              }}>
                                {message.content}
                              </ReactMarkdown>
                            </div>

                            {/* File Attachments */}
                            {message.file_attachments && message.file_attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.file_attachments.map((attachment: any) => (
                                  <div key={attachment.id} className="flex items-center space-x-3 bg-gray-700 rounded-lg p-3">
                                    <div className="flex-shrink-0">
                                      {attachment.mime_type.startsWith('image/') ? (
                                        <img
                                          src={supabase!.storage.from('file-attachments').getPublicUrl(attachment.file_path).data.publicUrl}
                                          alt={attachment.original_name}
                                          className="w-12 h-12 rounded object-cover"
                                        />
                                      ) : attachment.mime_type.startsWith('video/') ? (
                                        <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                                          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                                          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <a
                                        href={supabase!.storage.from('file-attachments').getPublicUrl(attachment.file_path).data.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 underline truncate block"
                                      >
                                        {attachment.original_name}
                                      </a>
                                      <div className="text-xs text-gray-400">
                                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reactions */}
                            {Object.keys(groupedReactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(groupedReactions).map(([emoji, data]: [string, any]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(message.id, emoji)}
                                    className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 rounded-full px-2 py-1 text-sm transition-colors"
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-gray-300">{data.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Add reaction button and pin button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex space-x-1">
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                className="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Добавить реакцию"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const { data: { user } } = await supabase!.auth.getUser();
                                    if (!user) return;

                                    // Check if user has permission to pin messages
                                    if (!currentServer?.id) return;
                                    const canPin = await canManageChannels(user.id, currentServer.id);
                                    if (!canPin) {
                                      toast.error('У вас нет прав на закрепление сообщений');
                                      return;
                                    }

                                    // Check if message is already pinned
                                    const { data: existingPin } = await supabase!
                                      .from('pinned_messages')
                                      .select('id')
                                      .eq('message_id', message.id)
                                      .maybeSingle();

                                    if (existingPin) {
                                      toast.error('Сообщение уже закреплено');
                                      return;
                                    }

                                    // Pin the message
                                    const { error } = await supabase!
                                      .from('pinned_messages')
                                      .insert({
                                        message_id: message.id,
                                        channel_id: currentChannel.id,
                                        pinned_by: user.id
                                      });

                                    if (error) {
                                      console.error('Error pinning message:', error);
                                      toast.error('Ошибка при закреплении сообщения');
                                    } else {
                                      toast.success('Сообщение закреплено');
                                    }
                                  } catch (error) {
                                    console.error('Error:', error);
                                    toast.error('Ошибка при закреплении сообщения');
                                  }
                                }}
                                className="text-gray-400 hover:text-yellow-400 p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Закрепить сообщение"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                                </svg>
                              </button>
                            </div>

                            {/* Emoji picker */}
                            {showEmojiPicker === message.id && (
                              <div className="absolute z-10 bg-gray-800 border border-gray-600 rounded-lg p-2 mt-1 shadow-lg">
                                <div className="grid grid-cols-6 gap-1">
                                  {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🤔', '😎', '🙌'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => addReaction(message.id, emoji)}
                                      className="w-8 h-8 hover:bg-gray-700 rounded flex items-center justify-center text-lg transition-colors"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  {/* File Upload Area */}
                  {showFileUpload && (
                    <div className="mb-4">
                      <FileUpload
                        onFileSelect={setSelectedFiles}
                        maxFiles={10}
                        maxFileSize={8}
                      />
                    </div>
                  )}

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center bg-gray-700 rounded px-3 py-1">
                          <span className="text-sm text-gray-300 mr-2">{file.name}</span>
                          <button
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors"
                      title="Прикрепить файлы"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    </button>
                    <MentionInput
                      value={newMessage}
                      onChange={setNewMessage}
                      placeholder={currentChannel ? `Сообщение #${currentChannel.name}` : currentDmChannel ? `Сообщение @${currentDmChannel.name}` : 'Выберите канал'}
                      serverId={currentServer?.id}
                      channelId={currentChannel?.id || currentDmChannel?.id}
                      className="flex-1"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && selectedFiles.length === 0}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                                  src={user.avatar || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                                  alt={user.display_name}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <p className="text-white font-medium">{user.display_name}</p>
                                  <p className="text-gray-400 text-sm">{user.username}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => sendFriendRequest(user.id)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                >
                                  Добавить
                                </button>
                                <button
                                  onClick={() => createDMChannel(user.id)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                >
                                  Сообщение
                                </button>
                              </div>
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
                    {filteredFriends.map((friend) => {
                      const friendStatus = userStatuses[friend.friend_id];
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'online': return 'bg-green-500';
                          case 'idle': return 'bg-yellow-500';
                          case 'dnd': return 'bg-red-500';
                          default: return 'bg-gray-500';
                        }
                      };
                      const getStatusText = (status: string) => {
                        switch (status) {
                          case 'online': return 'В сети';
                          case 'idle': return 'Неактивен';
                          case 'dnd': return 'Не беспокоить';
                          default: return 'Не в сети';
                        }
                      };

                      return (
                        <div key={friend.id} className="flex items-center p-3 rounded hover:bg-gray-700 transition-colors">
                          <div className="relative mr-3">
                            <img
                              src={friend.friend_profile?.avatar_url || '/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
                              alt={friend.friend_profile?.display_name || friend.friend_id}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(friendStatus?.status || 'offline')}`}></div>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{friend.friend_profile?.display_name || friend.friend_id}</div>
                            <div className="text-gray-400 text-sm">{getStatusText(friendStatus?.status || 'offline')}</div>
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
                      );
                    })}
                  </div>
                )}
              </>
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
                  src={'/assets/66e90ab9506850e8a5dd48e3_Discrod_MainLogo.svg'}
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
              <div
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                onClick={() => {
                  setShowAddServer(false);
                  setShowJoinServer(true);
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 5h-5v5H7v2h5v5h2v-5h5v-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Присоединиться к серверу</h4>
                    <p className="text-gray-300 text-sm">Войдите на сервер по названию</p>
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
                onClick={async () => {
                  if (!serverName.trim()) return;

                  try {
                    const { data: { user } } = await supabase!.auth.getUser();
                    if (!user) return;

                    let serverId;

                    if (selectedTemplate) {
                      // Use template RPC function
                      console.log('Creating server with template:', selectedTemplate);
                      const { data: result, error: templateError } = await supabase!
                        .rpc('create_server_with_template', {
                          server_name: serverName.trim(),
                          owner_id: user.id,
                          template_type: selectedTemplate
                        });

                      if (templateError) {
                        console.error('Error creating server with template:', templateError);
                        toast.error('Ошибка при создании сервера с шаблоном');
                        return;
                      }

                      serverId = result;
                      console.log('Server created with template, ID:', serverId);
                    } else {
                      // Create server manually
                      const { data: server, error: serverError } = await supabase!
                        .from('servers')
                        .insert({
                          name: serverName.trim(),
                          owner_id: user.id,
                          icon_url: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                      if (serverError) {
                        console.error('Error creating server:', serverError);
                        toast.error('Ошибка при создании сервера');
                        return;
                      }

                      serverId = server.id;
                    }

                    toast.success(`Сервер "${serverName}" создан!`);
                    setServerName('');
                    setSelectedTemplate('');
                    setShowCreateOwn(false);

                    // Refresh servers list
                    const { data: updatedServers } = await supabase!
                      .from('server_members')
                      .select(`
                        server_id,
                        servers (
                          id,
                          name,
                          icon_url
                        )
                      `)
                      .eq('user_id', user.id);

                    if (updatedServers) {
                      refreshServers();
                    }

                    // Redirect to the new server
                    router.push(`/channels/${serverId}`);
                  } catch (error) {
                    console.error('Error:', error);
                    toast.error('Ошибка при создании сервера');
                  }
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
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('gaming_friends');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🎮</span>
                    </div>
                    <h5 className="font-semibold">Игровые друзья</h5>
                    <p className="text-sm text-gray-400">Для игры с друзьями</p>
                  </div>
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('esports');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
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
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('study_group');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">📚</span>
                    </div>
                    <h5 className="font-semibold">Учебная группа</h5>
                    <p className="text-sm text-gray-400">Для совместного обучения</p>
                  </div>
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('student_club');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
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
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('fan_community');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xl">🌟</span>
                    </div>
                    <h5 className="font-semibold">Фан-сообщество</h5>
                    <p className="text-sm text-gray-400">Для фанатов</p>
                  </div>
                  <div
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTemplate('creative_community');
                      setShowTemplates(false);
                      setShowCreateOwn(true);
                    }}
                  >
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

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Создать канал</h3>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">НАЗВАНИЕ КАНАЛА</label>
                <input
                  type="text"
                  placeholder="новый-канал"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">КАТЕГОРИЯ</label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Без категории</option>
                  {serverCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowCreateChannel(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!channelName.trim() || !currentServer) return;

                  try {
                    const { data: { user } } = await supabase!.auth.getUser();
                    if (!user) return;

                    // Check if user can manage channels
                    const canCreate = await canManageChannels(user.id, currentServer.id);
                    if (!canCreate) {
                      toast.error('У вас нет прав на создание каналов');
                      return;
                    }

                    const { error } = await supabase!
                      .from('channels')
                      .insert({
                        server_id: currentServer.id,
                        category_id: selectedCategoryId,
                        name: channelName.trim().toLowerCase().replace(/\s+/g, '-'),
                        type: 'text',
                        position: serverChannels.filter(item => item.type === 'channel' && item.category_id === selectedCategoryId).length,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });

                    if (error) {
                      console.error('Error creating channel:', error);
                      toast.error('Ошибка при создании канала');
                    } else {
                      toast.success(`Канал #${channelName} создан!`);
                      setChannelName('');
                      setSelectedCategoryId(null);
                      setShowCreateChannel(false);

                      // Refresh channels with categories
                      const { data: categories } = await supabase!
                        .from('categories')
                        .select(`
                          *,
                          channels (*)
                        `)
                        .eq('server_id', currentServer.id)
                        .order('position');

                      const { data: uncategorizedChannels } = await supabase!
                        .from('channels')
                        .select('*')
                        .eq('server_id', currentServer.id)
                        .is('category_id', null)
                        .order('position');

                      const allChannels: ChannelItem[] = [];
                      if (categories) {
                        categories.forEach((category: any) => {
                          allChannels.push({ ...category, type: 'category' });
                          if (category.channels) {
                            category.channels.forEach((channel: any) => {
                              allChannels.push({ ...channel, type: 'channel' });
                            });
                          }
                        });
                      }
                      if (uncategorizedChannels) {
                        uncategorizedChannels.forEach((channel: any) => {
                          allChannels.push({ ...channel, type: 'channel' });
                        });
                      }

                      setServerChannels(allChannels);
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    toast.error('Ошибка при создании канала');
                  }
                }}
                className={`px-4 py-2 rounded ${
                  channelName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!channelName.trim()}
              >
                Создать канал
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Settings Modal */}
      {showServerSettings && currentServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Настройки сервера</h3>
              <button
                onClick={() => setShowServerSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Server Overview */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Обзор сервера</h4>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                    {currentServer.icon_url ? (
                      <img src={currentServer.icon_url} alt={currentServer.name} className="w-16 h-16 rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {currentServer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xl font-semibold">{currentServer.name}</h5>
                    <p className="text-gray-400 text-sm">
                      Создан {new Date(currentServer.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Server Name Edit */}
              <div>
                <label className="block text-sm font-medium mb-2">НАЗВАНИЕ СЕРВЕРА</label>
                <input
                  type="text"
                  value={editServerName || currentServer.name}
                  onChange={(e) => setEditServerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Roles Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Роли</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="font-semibold">Admin</span>
                    </div>
                    <span className="text-gray-400 text-sm">Владелец</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-400 rounded"></div>
                      <span>@everyone</span>
                    </div>
                    <span className="text-gray-400 text-sm">Все участники</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => {
                      setShowServerSettings(false);
                      setShowRoleManager(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Управление ролями
                  </button>
                  <button
                    onClick={() => {
                      setShowServerSettings(false);
                      setShowInviteManager(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                  >
                    Приглашения
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
                    Создать роль
                  </button>
                  <button
                    onClick={() => {
                      setShowServerSettings(false);
                      setShowModerationPanel(true);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Модерация
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-red-600 pt-6">
                <h4 className="text-lg font-semibold text-red-400 mb-4">Опасная зона</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-600 rounded">
                    <h5 className="font-semibold text-red-400 mb-2">Удалить сервер</h5>
                    <p className="text-sm text-gray-300 mb-3">
                      После удаления сервера восстановить его будет невозможно.
                    </p>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">
                      Удалить сервер
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowServerSettings(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!editServerName.trim() || editServerName === currentServer.name) {
                    setShowServerSettings(false);
                    return;
                  }

                  try {
                    const { error } = await supabase!
                      .from('servers')
                      .update({
                        name: editServerName.trim(),
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', currentServer.id);

                    if (error) {
                      console.error('Error updating server:', error);
                      toast.error('Ошибка при обновлении сервера');
                    } else {
                      toast.success('Сервер обновлен!');
                      setEditServerName('');
                      setShowServerSettings(false);

                      // Refresh current server data
                      const { data: updatedServer } = await supabase!
                        .from('servers')
                        .select('*')
                        .eq('id', currentServer.id)
                        .maybeSingle();

                      if (updatedServer) {
                        setCurrentServer(updatedServer);
                      }
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    toast.error('Ошибка при обновлении сервера');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Server Modal */}
      {showJoinServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Присоединиться к серверу</h3>
              <button
                onClick={() => setShowJoinServer(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.39.38-1.02 0-1.4z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">НАЗВАНИЕ СЕРВЕРА</label>
                <input
                  type="text"
                  placeholder="Введите название сервера"
                  value={joinServerName}
                  onChange={(e) => setJoinServerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowJoinServer(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!joinServerName.trim()) return;

                  try {
                    const { data: { user } } = await supabase!.auth.getUser();
                    if (!user) return;

                    // Find server by name
                    const { data: server, error: serverError } = await supabase!
                      .from('servers')
                      .select('*')
                      .ilike('name', joinServerName.trim())
                      .maybeSingle();

                    if (serverError) {
                      console.error('Error finding server:', serverError);
                      toast.error('Ошибка при поиске сервера');
                      return;
                    }

                    if (!server) {
                      toast.error('Сервер с таким названием не найден');
                      return;
                    }

                    // Check if user is already a member
                    const { data: existingMember } = await supabase!
                      .from('server_members')
                      .select('*')
                      .eq('server_id', server.id)
                      .eq('user_id', user.id)
                      .maybeSingle();

                    if (existingMember) {
                      toast.error('Вы уже состоите в этом сервере');
                      return;
                    }

                    // Get the default role (@everyone)
                    const { data: defaultRole } = await supabase!
                      .from('roles')
                      .select('id')
                      .eq('server_id', server.id)
                      .eq('name', '@everyone')
                      .maybeSingle();

                    // Join server
                    const { error: joinError } = await supabase!
                      .from('server_members')
                      .insert({
                        server_id: server.id,
                        user_id: user.id,
                        role_id: defaultRole?.id || null,
                        joined_at: new Date().toISOString()
                      });

                    if (joinError) {
                      console.error('Error joining server:', joinError);
                      toast.error('Ошибка при присоединении к серверу');
                      return;
                    }

                    toast.success(`Вы присоединились к серверу "${server.name}"!`);

                    // Refresh servers list
                    const { data: updatedServers } = await supabase!
                      .from('server_members')
                      .select(`
                        server_id,
                        servers (
                          id,
                          name,
                          icon_url
                        )
                      `)
                      .eq('user_id', user.id);

                    if (updatedServers) {
                      refreshServers();
                    }

                    setJoinServerName('');
                    setShowJoinServer(false);

                    // Redirect to the server
                    router.push(`/channels/${server.id}`);
                  } catch (error) {
                    console.error('Error:', error);
                    toast.error('Ошибка при присоединении к серверу');
                  }
                }}
                className={`px-4 py-2 rounded ${
                  joinServerName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!joinServerName.trim()}
              >
                Присоединиться
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Manager Modal */}
      {showRoleManager && currentServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <RoleManager
              serverId={currentServer.id}
              userId={userProfile?.id || ''}
              onClose={() => setShowRoleManager(false)}
            />
          </div>
        </div>
      )}

      {/* Invite Manager Modal */}
      {showInviteManager && currentServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <InviteManager
              serverId={currentServer.id}
              userId={userProfile?.id || ''}
              onClose={() => setShowInviteManager(false)}
            />
          </div>
        </div>
      )}

      {/* Moderation Panel Modal */}
      {showModerationPanel && currentServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <ModerationPanel
              serverId={currentServer.id}
              userId={userProfile?.id || ''}
              onClose={() => setShowModerationPanel(false)}
            />
          </div>
        </div>
      )}

      {/* Message Search Modal */}
      {showMessageSearch && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <MessageSearch
              serverId={currentServer?.id}
              channelId={currentChannel?.id}
              onClose={() => setShowMessageSearch(false)}
              onJumpToMessage={jumpToMessage}
            />
          </div>
        </div>
      )}

      {/* Channel Settings Modal */}
      {showChannelSettings && currentChannel && currentServer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <ChannelSettings
              channelId={currentChannel.id}
              serverId={currentServer.id}
              userId={userProfile?.id || ''}
              onClose={() => setShowChannelSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Pinned Messages Modal */}
      {showPinnedMessages && currentChannel && (
        <PinnedMessagesModal
          channelId={currentChannel.id}
          onClose={() => setShowPinnedMessages(false)}
        />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}