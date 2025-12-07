export default function ChannelsMePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="title_c38106">
            <div className="title_edbb22" aria-label="Открыть Quick Switcher" role="button" tabIndex={0}>
              <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path fill="var(--interactive-normal)" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" className=""></path>
                <path fill="var(--interactive-normal)" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z" className=""></path>
              </svg>
              <div className="defaultColor__4bd52 lineClamp1__4bd52 text-sm/medium_cf4812" data-text-variant="text-sm/medium">Друзья</div>
            </div>
            <span style={{ display: 'none' }}></span>
          </div>
          <div className="trailing_c38106">
            <div className="button__85643 iconWrapper__9293f clickable__9293f" role="button" aria-label="Checkpoint" tabIndex={0}>
              <svg x="0" y="0" className="icon__9293f" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" d="M5.1 1a2.1 2.1 0 0 1 1.8 3.14h14.05c.84 0 1.34.94.87 1.63L19.1 9.85c-.23.35-.23.8 0 1.16l2.72 4.08c.47.7-.03 1.62-.87 1.62H6.15v5.24a1.05 1.05 0 0 1-2.1 0V4.91A2.1 2.1 0 0 1 5.1 1ZM16.3 7.6c-.4-.42-1.07-.42-1.48 0l-3.45 3.44-1.35-1.35a1.05 1.05 0 0 0-1.48 1.48l2.1 2.1c.4.4 1.06.4 1.47 0l4.2-4.2c.4-.4.4-1.07 0-1.48Z" clipRule="evenodd" className="iconForeground_f1f2b1"></path>
              </svg>
            </div>
            <span style={{ display: 'none' }}></span>
            <div className="clickable_c99c29" aria-expanded="false" data-jump-section="global" aria-label="Почта" aria-describedby="«r0»" role="button" tabIndex={0}>
              <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5ZM4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-2.65c-.5 0-.85.5-.85 1a3 3 0 1 1-6 0c0-.5-.35-1-.85-1H5.5A1.5 1.5 0 0 1 4 11.5v-6Z" clipRule="evenodd" className=""></path>
              </svg>
            </div>
            <span id="«r0»" className="hiddenVisually_b18fe2">Почта</span>
            <a tabIndex={-1} className="anchor_edefb8 anchorUnderlineOnHover_edefb8" href="https://support.discord.com" rel="noreferrer noopener" target="_blank">
              <div className="button__85643 iconWrapper__9293f clickable__9293f" role="button" aria-label="Помощь" tabIndex={0}>
                <svg x="0" y="0" className="icon__9293f" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="transparent" className=""></circle>
                  <path fill="currentColor" fillRule="evenodd" d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm-.28-16c-.98 0-1.81.47-2.27 1.14A1 1 0 1 1 7.8 7.01 4.73 4.73 0 0 1 11.72 5c2.5 0 4.65 1.88 4.65 4.38 0 2.1-1.54 3.77-3.52 4.24l.14 1a1 1 0 0 1-1.98.27l-.28-2a1 1 0 0 1 .99-1.14c1.54 0 2.65-1.14 2.65-2.38 0-1.23-1.1-2.37-2.65-2.37ZM13 17.88a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z" clipRule="evenodd" className=""></path>
                </svg>
              </div>
              <span style={{ display: 'none' }}></span>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-2">
          <button className="px-4 py-2 text-white bg-gray-700 rounded">Онлайн</button>
          <button className="px-4 py-2 text-gray-400">Все</button>
          <button className="px-4 py-2 text-gray-400">Ожидающие</button>
          <button className="px-4 py-2 text-gray-400">Заблокированные</button>
        </div>

        {/* Friends List */}
        <div className="flex-1 p-2">
          <p className="text-gray-400">Нет друзей для отображения</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-700 flex flex-col">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">У вас нет друзей</h2>
          <p className="text-gray-400 mb-6">Когда вы добавите друзей на Discord, они появятся здесь.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">Добавить друга</button>
        </div>
      </div>
    </div>
  )
}