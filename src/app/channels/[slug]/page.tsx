'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChannelsMePage() {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const getFriends = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase!
        .from('friends')
        .select('*, profiles!inner(id, username, avatar_url)')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) console.error('Error fetching friends:', error);
      else setFriends(data || []);
    };

    getFriends();
  }, []);

  return (
    <main className="container__133bf" aria-label="Друзья">
      <div className="base__133bf">
        <div className="sidebar__133bf">
          <nav className="guilds__133bf">
            <div className="guilds__133bf">
              <div className="guild__133bf" aria-label="Домой" role="button" tabIndex={0}>
                <div className="childWrapper__133bf">
                  <svg className="homeIcon__133bf" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="28" height="20" fill="none" viewBox="0 0 28 20">
                    <path fill="currentColor" d="M20.6644 20C20.6644 20 21.3944 19.2656 21.3944 18.1992C21.3944 17.1328 20.6644 16.3984 20.6644 16.3984C20.6644 16.3984 19.9344 17.1328 19.9344 18.1992C19.9344 19.2656 20.6644 20 20.6644 20ZM14.7016 20C14.7016 20 15.4316 19.2656 15.4316 18.1992C15.4316 17.1328 14.7016 16.3984 14.7016 16.3984C14.7016 16.3984 13.9716 17.1328 13.9716 18.1992C13.9716 19.2656 14.7016 20 14.7016 20ZM8.7388 20C8.7388 20 9.4688 19.2656 9.4688 18.1992C9.4688 17.1328 8.7388 16.3984 8.7388 16.3984C8.7388 16.3984 8.0088 17.1328 8.0088 18.1992C8.0088 19.2656 8.7388 20 8.7388 20Z"></path>
                    <path fill="currentColor" d="M2.6644 20C2.6644 20 3.3944 19.2656 3.3944 18.1992C3.3944 17.1328 2.6644 16.3984 2.6644 16.3984C2.6644 16.3984 1.9344 17.1328 1.9344 18.1992C1.9344 19.2656 2.6644 20 2.6644 20ZM26.6644 20C26.6644 20 27.3944 19.2656 27.3944 18.1992C27.3944 17.1328 26.6644 16.3984 26.6644 16.3984C26.6644 16.3984 25.9344 17.1328 25.9344 18.1992C25.9344 19.2656 26.6644 20 26.6644 20Z"></path>
                    <path fill="currentColor" d="M0 10.1992C0 8.01424 1.01424 6.1992 2.6644 5.1328C4.31456 4.0664 6.6644 3.1992 9.9976 2.1992C13.3308 1.1992 16.6644 0.6656 20 0.6656C23.3356 0.6656 26.6692 1.1992 30.0024 2.1992C33.3356 3.1992 35.6854 4.0664 37.3356 5.1328C38.9858 6.1992 40 8.01424 40 10.1992V20H0V10.1992Z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </nav>
          <div className="panels__133bf">
            <div className="container__133bf">
              <div className="privateChannels__133bf">
                <div className="scroller__133bf">
                  <div className="content__133bf">
                    <div className="channel__133bf" aria-label="Друзья" role="button" tabIndex={0}>
                      <div className="layout__133bf">
                        <div className="content__133bf">
                          <svg className="icon__133bf" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
                            <path fill="currentColor" d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2Zm12 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Zm-9 4c0-.22.03-.42.06-.63C5.74 16.86 7.87 15 10 15s4.26 1.86 4.94 3.37c.03.2.06.41.06.63H6Zm8-7c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1Z"></path>
                          </svg>
                          <div className="name__133bf">Друзья</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content__133bf">
          <div className="chat__133bf">
            <div className="title__133bf">
              <div className="children__133bf">
                <h3 className="titleText__133bf">Друзья</h3>
              </div>
            </div>
            <div className="content__133bf">
              <div className="peopleList__cc6179" role="list" aria-label="Друзья">
                {friends.length === 0 ? (
                  <div className="emptyState__cc6179">
                    <div className="emptyStateImage__cc6179">
                      <svg className="image__cc6179" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="376" height="162" fill="none" viewBox="0 0 376 162">
                        <path fill="currentColor" d="M0 0h376v162H0z" opacity=".1"></path>
                        <path fill="currentColor" d="M188 81c-20.5 0-37-16.5-37-37s16.5-37 37-37 37 16.5 37 37-16.5 37-37 37Zm0-55c-11.6 0-21 9.4-21 21s9.4 21 21 21 21-9.4 21-21-9.4-21-21-21Z"></path>
                        <path fill="currentColor" d="M188 162c-41.4 0-75-33.6-75-75 0-8.3 6.7-15 15-15s15 6.7 15 15c0 24.8 20.2 45 45 45s45-20.2 45-45c0-8.3 6.7-15 15-15s15 6.7 15 15c0 41.4-33.6 75-75 75Z"></path>
                      </svg>
                    </div>
                    <div className="emptyStateText__cc6179">
                      У вас нет друзей, которые сейчас в сети.
                    </div>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="peopleListItem__cc6179" role="listitem" tabIndex={-1}>
                      <div className="listItemContents__fc004c">
                        <div className="userInfo__0a06e">
                          <div className="wrapper__44b0c avatar__0a06e" role="img" aria-label={`${friend.profiles?.username}, В сети`} aria-hidden="false">
                            <svg width="40" height="40" viewBox="0 0 40 40" className="mask__44b0c svg__44b0c" aria-hidden="true">
                              <foreignObject x="0" y="0" width="32" height="32" mask="url(#svg-mask-avatar-status-round-32)">
                                <div className="avatarStack__44b0c">
                                  <img alt=" " className="avatar__44b0c" aria-hidden="true" src={friend.profiles?.avatar_url || '/default-avatar.png'} />
                                </div>
                              </foreignObject>
                              <rect width="10" height="10" x="22" y="22" fill="#43a25a" mask="url(#svg-mask-status-online)" className="pointerEvents__44b0c"></rect>
                            </svg>
                          </div>
                          <div className="text__0a06e">
                            <div className="info__f4bc97 discordTag__0a06e alignPomelo__0a06e">
                              <span className="username__0a06e">{friend.profiles?.username}</span>
                            </div>
                            <div className="subtext__0a06e">
                              <div className="text__19b6d">В сети</div>
                            </div>
                          </div>
                        </div>
                        <div className="actions__fc004c">
                          <div className="actionButton__f8fa06" aria-label="Сообщение" role="button" tabIndex={0}>
                            <svg className="icon__f8fa06" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"></path>
                            </svg>
                          </div>
                          <div className="actionButton__f8fa06" aria-label="Ещё" role="button" tabIndex={0}>
                            <svg className="icon__f8fa06" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                              <path fill="currentColor" fillRule="evenodd" d="M10 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm2 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="members__133bf">
            <div className="membersWrap__133bf">
              <div className="members__133bf">
                <div className="container__133bf">
                  <div className="scroller__133bf">
                    <div className="content__133bf">
                      <h2 className="title__133bf">Активные контакты</h2>
                      <div className="list__133bf">
                        {/* Active friends or something */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}