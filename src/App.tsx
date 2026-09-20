import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import ChatPage from './pages/Chat';
import ActivityPage from './pages/Activity';
import Dashboard from './pages/Dashboard';
import FlagsPage from './pages/Flags';
import TestsPage from './pages/Tests';
import SettingsPage from './pages/Settings';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const fetchPendingReviews = async () => {
    try {
      const stats = await api.getAdminStats();
      if (typeof stats.pendingReviews === 'number') {
        setPendingReviewCount(stats.pendingReviews);
      }
    } catch {
      // ignore in background
    }
  };

  useEffect(() => {
    fetchPendingReviews();
    const interval = setInterval(fetchPendingReviews, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles: Record<NavTab, string> = {
    chat: 'Safe Chat Interface',
    activity: 'Live Moderation Stream',
    dashboard: 'Admin Dashboard',
    flags: 'Flagged Content Queue',
    tests: 'Moderation Test Center',
    settings: 'Configuration & Settings',
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingReviewCount={pendingReviewCount}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTabTitle={tabTitles[currentTab]}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {currentTab === 'chat' && (
            <ChatPage onActivityLogged={fetchPendingReviews} />
          )}

          {currentTab === 'activity' && <ActivityPage />}

          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateToFlags={() => setCurrentTab('flags')}
              onNavigateToTests={() => setCurrentTab('tests')}
            />
          )}

          {currentTab === 'flags' && (
            <FlagsPage onReviewCompleted={fetchPendingReviews} />
          )}

          {currentTab === 'tests' && <TestsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
