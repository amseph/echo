import React, { useState } from 'react';

interface DashboardLayoutProps {
  activeTab: 'home' | 'analytics' | 'settings';
  handleTabChange: (tab: 'home' | 'analytics' | 'settings') => void;
  children: React.ReactNode;
}

export default function DashboardLayout({
  activeTab,
  handleTabChange,
  children,
}: DashboardLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-neutral-900 w-full">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-neutral-950 border-r border-neutral-800 transition-all duration-300 ease-in-out relative z-40 ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/icon-512.png" className="w-9 h-9 object-contain flex-shrink-0" alt="ECHO" />
            <span
              className={`font-bold text-white text-lg tracking-tight whitespace-nowrap transition-opacity duration-300 ${
                isSidebarExpanded ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              ECHO
            </span>
          </div>
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="absolute -right-3 top-6 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-full p-1 hover:text-white hover:bg-neutral-700 transition-colors shadow-lg z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform duration-300 ${
                isSidebarExpanded ? 'rotate-180' : ''
              }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'home' | 'analytics' | 'settings')}
                className={`flex items-center w-full rounded-xl transition-all group overflow-hidden ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                } ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}`}
                title={!isSidebarExpanded ? tab.label : ''}
              >
                <div className={`flex-shrink-0 ${isSidebarExpanded ? 'mr-3' : ''}`}>
                  {tab.icon}
                </div>
                <span
                  className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative z-0 pb-20 md:pb-0 h-full">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-lg border-t border-neutral-800 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex justify-around items-center px-6 py-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'home' | 'analytics' | 'settings')}
                className={`flex flex-col items-center gap-1 transition-colors px-4 py-1.5 rounded-2xl ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
