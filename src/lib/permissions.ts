import { supabase } from './supabase';

// Permission constants
export const PERMISSIONS = {
  // Server permissions
  MANAGE_SERVER: 'manage_server',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_CHANNELS: 'manage_channels',
  KICK_MEMBERS: 'kick_members',
  BAN_MEMBERS: 'ban_members',

  // Message permissions
  SEND_MESSAGES: 'send_messages',
  READ_MESSAGES: 'read_messages',
  MANAGE_MESSAGES: 'manage_messages',
  EMBED_LINKS: 'embed_links',
  ATTACH_FILES: 'attach_files',
  MENTION_EVERYONE: 'mention_everyone',

  // Voice permissions
  USE_VOICE: 'use_voice',
  SPEAK: 'speak',
  MUTE_MEMBERS: 'mute_members',
  DEAFEN_MEMBERS: 'deafen_members',
  MOVE_MEMBERS: 'move_members',
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if a user has a specific permission in a server
 */
export async function hasPermission(
  userId: string,
  serverId: string,
  permission: PermissionType
): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('has_permission', {
      user_id: userId,
      server_id: serverId,
      permission_id: permission,
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
}

/**
 * Check if user can manage a specific server
 */
export async function canManageServer(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.MANAGE_SERVER);
}

/**
 * Check if user can manage roles in a server
 */
export async function canManageRoles(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.MANAGE_ROLES);
}

/**
 * Check if user can manage channels in a server
 */
export async function canManageChannels(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.MANAGE_CHANNELS);
}

/**
 * Check if user can send messages in a channel
 */
export async function canSendMessages(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.SEND_MESSAGES);
}

/**
 * Check if user can read messages in a channel
 */
export async function canReadMessages(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.READ_MESSAGES);
}

/**
 * Check if user can manage messages in a channel
 */
export async function canManageMessages(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.MANAGE_MESSAGES);
}

/**
 * Check if user can kick members from a server
 */
export async function canKickMembers(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.KICK_MEMBERS);
}

/**
 * Check if user can ban members from a server
 */
export async function canBanMembers(userId: string, serverId: string): Promise<boolean> {
  return hasPermission(userId, serverId, PERMISSIONS.BAN_MEMBERS);
}

/**
 * Check if user is server owner
 */
export async function isServerOwner(userId: string, serverId: string): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('servers')
      .select('owner_id')
      .eq('id', serverId)
      .single();

    if (error) {
      console.error('Error checking server ownership:', error);
      return false;
    }

    return data.owner_id === userId;
  } catch (error) {
    console.error('Error in isServerOwner:', error);
    return false;
  }
}

/**
 * Check if user is member of a server
 */
export async function isServerMember(userId: string, serverId: string): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', serverId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking server membership:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isServerMember:', error);
    return false;
  }
}

/**
 * Get user's roles in a server
 */
export async function getUserRoles(userId: string, serverId: string) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('server_members')
      .select(`
        role_id,
        roles (
          id,
          name,
          color,
          permissions,
          position
        )
      `)
      .eq('server_id', serverId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error getting user roles:', error);
      return null;
    }

    return data?.roles || null;
  } catch (error) {
    console.error('Error in getUserRoles:', error);
    return null;
  }
}

/**
 * Check multiple permissions at once
 */
export async function checkPermissions(
  userId: string,
  serverId: string,
  permissions: PermissionType[]
): Promise<Record<PermissionType, boolean>> {
  const results: Record<PermissionType, boolean> = {} as Record<PermissionType, boolean>;

  await Promise.all(
    permissions.map(async (permission) => {
      results[permission] = await hasPermission(userId, serverId, permission);
    })
  );

  return results;
}