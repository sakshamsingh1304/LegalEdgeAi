
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TopMiniDock from './components/TopMiniDock';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import Documents from './pages/Documents';
import Regulations from './pages/Regulations';
import SourcesPage from './pages/SourcesPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import { Particles } from './components/ui/particles';
import { NotificationProvider } from './lib/NotificationContext';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'dim'>('dark');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col relative overflow-hidden transition-colors duration-500">
      {/* Global Background Particles */}
      <Particles
        color={theme === 'light' ? "#000000" : "#ffffff"}
        quantity={100}
        ease={20}
        refresh={true}
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
      />

      {/* Global Background Gradients (Aura) - Now using CSS variables for colors */}
      <div aria-hidden className="fixed inset-0 isolate -z-10 contain-strict pointer-events-none">
        <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,var(--aurora-1)_0,var(--aurora-2)_50%,transparent_80%)] absolute top-0 left-0 h-[320vh] w-[140vw] -translate-y-[87.5%] -rotate-45 rounded-full transition-colors duration-500" />
        <div className="bg-[radial-gradient(50%_50%_at_50%_50%,var(--aurora-2)_0,transparent_100%)] absolute top-0 left-0 h-[320vh] w-[60vw] translate-x-[5%] -translate-y-[50%] -rotate-45 rounded-full transition-colors duration-500" />
      </div>

      {/* Top Mini Dock Filter Bar */}
      <TopMiniDock theme={theme} setTheme={setTheme} />

      <main className="flex-grow pt-24 pb-24 relative z-10 overflow-y-auto no-scrollbar">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/regulations" element={<Regulations />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Dock Navigation */}
      <Navbar />
    </div>
  );
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#030712] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="text-gray-500 text-sm font-medium animate-pulse">Loading LegalEdge AI...</p>
    </div>
  </div>
);

const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {user ? (
        <Route path="/*" element={<AuthenticatedApp />} />
      ) : (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;