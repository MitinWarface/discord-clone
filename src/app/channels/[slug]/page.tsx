'use client'

import Head from 'next/head';
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
        .select('*, profiles!friends_friend_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) console.error('Error fetching friends:', error);
      else setFriends(data || []);
    };

    getFriends();
  }, []);

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/discord.css" />
      </Head>
      <main className="container__133bf" aria-label="Друзья">
      <section className="theme-dark theme-midnight images-dark container__9293f themed__9293f" aria-labelledby="uid_31" role="navigation">
        <div className="upperContainer__9293f">
          <div className="children__9293f scrollable__9293f themed__9293f">
            <div className="iconWrapper__9293f">
              <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" className=""></path>
                <path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z" className=""></path>
              </svg>
            </div>
            <div className="titleWrapper__9293f">
              <h1 className="defaultColor__4bd52 text-md/medium__13cf1 defaultColor__5345c title__9293f" id="uid_31" data-text-variant="text-md/medium">Друзья</h1>
            </div>
            <svg className="dot__9293f" aria-hidden="true" role="img" width="24" height="24" viewBox="0 0 4 4"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg>
            <div className="tabBar__133bf topPill_aa8da2" role="tablist" aria-orientation="horizontal" aria-label="Друзья">
              <div className="item__133bf item_aa8da2 selected_aa8da2 themed_aa8da2" role="tab" aria-selected="true" aria-controls="online-tab" aria-disabled="false" tabIndex={0}>В сети</div>
              <div className="item__133bf item_aa8da2 themed_aa8da2" role="tab" aria-selected="false" aria-disabled="false" tabIndex={-1}>Все</div>
              <div className="item__133bf addFriend__133bf item_aa8da2 themed_aa8da2" role="tab" aria-selected="false" aria-disabled="false" tabIndex={-1} aria-label="Добавить в друзья"><span>Добавить в друзья</span></div>
            </div>
          </div>
          <div className="toolbar__9293f">
            <div className="inviteToolbar__133bf">
              <div className="iconWrapper__9293f clickable__9293f" role="button" aria-label="Новый групповой чат" tabIndex={0}>
                <svg x="0" y="0" className="icon__9293f" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 0 1 0-2h3v-3a1 1 0 0 1 1-1Z" fill="currentColor" className=""></path>
                  <path d="M20.76 12.57c.4.3 1.23.13 1.24-.37V12a10 10 0 1 0-18.44 5.36c.12.19.1.44-.04.61l-2.07 2.37A1 1 0 0 0 2.2 22h10c.5-.01.67-.84.37-1.24A3 3 0 0 1 15 16h.5a.5.5 0 0 0 .5-.5V15a3 3 0 0 1 4.76-2.43Z" fill="currentColor" className=""></path>
                </svg>
              </div>
              <span style={{ display: 'none' }}></span>
            </div>
          </div>
        </div>
      </section>
      <div className="tabBody__133bf">
        <div className="peopleColumn__133bf" aria-labelledby="uid_32" role="tabpanel" id="online-tab" tabIndex={-1}>
          <div className="searchBar__5ec2f">
            <div className="container__5a838" data-layout="vertical">
              <div className="control__5a838">
                <div className="container__72c38" data-full-width="true">
                  <div className="wrapper__72c38 container__0f084 md__0f084 text-md/normal__0f084 hasLeading__0f084" data-error="false" data-disabled="false">
                    <div className="icon__0f084">
                      <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path fill="var(--icon-primary)" fillRule="evenodd" d="M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" clipRule="evenodd" className=""></path>
                      </svg>
                    </div>
                    <input className="input__0f084" placeholder="Поиск" data-mana-component="text-input" aria-label="Поиск" id="«r1i»" aria-invalid="false" type="text" value="" name="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="peopleList__5ec2f auto_d125d2 scrollerBase_d125d2" role="list" tabIndex={0} data-list-id="people-list" aria-orientation="vertical" style={{ overflow: 'hidden scroll', paddingRight: '0px' }}>
            <div className="content_d125d2" style={{ height: '1290px' }}>
              <div aria-hidden="true" style={{ height: '0px' }}></div>
              <div className="sectionTitle__5ec2f">
                <h2 className="title__1472a container__13cf1 header__13cf1 text-sm/medium__13cf1" id="uid_32">В сети&nbsp;— 20</h2>
              </div>
              <div className="peopleListItem_cc6179" role="listitem" data-list-item-id="people-list___placeholder" tabIndex={-1} style={{ height: '62px', opacity: 1 }}>
                <div className="listItemContents_fc004c">
                  <div className="userInfo__0a06e">
                    <div className="text__0a06e">
                      <div className="subtext__0a06e">
                        <div className="text__19b6d">У вас нет друзей для отображения</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="nowPlayingColumn__133bf">
          <aside className="container__7d20c" aria-labelledby="uid_33">
            <div className="scroller__7d20c thin_d125d2 scrollerBase_d125d2" dir="ltr" style={{ overflow: 'hidden scroll', paddingRight: '8px' }}>
              <div className="">
                <h2 className="defaultColor__4bd52 heading-lg/semibold_cf4812 defaultColor__5345c header__7d20c" id="uid_33" data-text-variant="heading-lg/semibold">Активные контакты</h2>
                <div className="itemCard__7e549 wrapper__00943 outer_bf1984 padded_bf1984 interactive_bf1984" tabIndex={0} aria-expanded="false" aria-haspopup="menu" role="button">
                  <div>
                    <header className="headerFull__00943 header__00943">
                      <div className="wrapper__44b0c headerAvatar__00943" role="img" aria-label="placeholder" aria-hidden="false" style={{ width: '32px', height: '32px' }}>
                        <svg width="40" height="40" viewBox="0 0 40 40" className="mask__44b0c svg__44b0c" aria-hidden="true">
                          <foreignObject x="0" y="0" width="32" height="32" mask="url(#svg-mask-avatar-default)">
                            <div className="avatarStack__44b0c">
                              <img alt=" " className="avatar__44b0c" aria-hidden="true" src="/assets/788f05731f8aa02e.png" />
                            </div>
                          </foreignObject>
                        </svg>
                      </div>
                      <div>
                        <div className="defaultColor__4bd52 text-md/semibold_cf4812 textContent__00943" data-text-variant="text-md/semibold">Нет активных контактов</div>
                      </div>
                    </header>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
    </>
  )
}