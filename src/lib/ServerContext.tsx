'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

interface Server {
  id: string;
  name: string;
  icon_url?: string;
}

interface ServerContextType {
  servers: Server[];
  refreshServers: () => Promise<void>;
  loading: boolean;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshServers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase!.auth.getUser();

      if (!user) {
        setServers([]);
        return;
      }

      // Get user's server memberships
      const { data: memberships, error: membershipError } = await supabase!
        .from('server_members')
        .select('server_id')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching server memberships:', membershipError);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setServers([]);
        return;
      }

      // Get server details
      const serverIds = memberships.map(m => m.server_id);
      const { data: serversData, error: serversError } = await supabase!
        .from('servers')
        .select('id, name, icon_url')
        .in('id', serverIds);

      if (serversError) {
        console.error('Error fetching servers:', serversError);
      } else {
        setServers(serversData || []);
      }
    } catch (error) {
      console.error('Error in refreshServers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshServers();
  }, []);

  return (
    <ServerContext.Provider value={{ servers, refreshServers, loading }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServers() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServers must be used within a ServerProvider');
  }
  return context;
}