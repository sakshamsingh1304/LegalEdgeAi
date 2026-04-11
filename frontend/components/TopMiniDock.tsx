
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LayoutGrid, Inbox, Newspaper, CalendarClock, BellRing, AlertCircle, FileText, ClipboardCheck, Mail, MessageSquareQuote, ExternalLink, ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { ThemeSwitcher } from './ui/apple-liquid-glass-switcher';
import { useNotifications } from '../lib/NotificationContext';
import { useAuth } from '../lib/AuthContext';

interface TopMiniDockProps {
  theme: 'light' | 'dark' | 'dim';
  setTheme: (theme: 'light' | 'dark' | 'dim') => void;
}

const TopMiniDock: React.FC<TopMiniDockProps> = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('dashboard');
  const { notifications, markAsRead, markAllAsRead, unreadCount, removeNotification } = useNotifications();
  const [notifTab, setNotifTab] = useState('all');
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (location.pathname === '/' && activeFilter !== 'unread' && activeFilter !== 'news') {
      setActiveFilter('dashboard');
    }
  }, [location.pathname]);

  const filteredNotifs = notifTab === 'unread' ? notifications.filter(n => n.unread) : notifications;

  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents`)
      .then(res => res.json())
      .then(data => {
        // Take first 5 documents
        setRecentDocs(data.slice(0, 5));
      })
      .catch(err => console.error("Failed to fetch docs for minidock", err));
  }, []);

  const newsUpdates = [
    { title: "New Angel Tax provisions relaxed for startups", source: "Mint", time: "2h ago" },
    { title: "MCA extends deadline for DIR-3 KYC", source: "Economic Times", time: "5h ago" },
    { title: "GST collection hits all-time high in April", source: "Business Standard", time: "1d ago" },
    { title: "SEBI proposes tighter disclosure norms for IPOs", source: "Reuters", time: "2d ago" },
    { title: "Startup India Seed Fund Scheme expanded", source: "Gov.in", time: "3d ago" },
  ];

  const filters = [
    { id: 'dashboard', label: 'Home', icon: HomeIcon, isNav: true, path: '/' },
    { id: 'unread', label: 'Unread', icon: Inbox, badge: unreadCount, isTrigger: true },
    { id: 'news', label: 'News', icon: Newspaper, badge: 5, isTrigger: true },
  ];

  const handleNotifClick = (n: any) => {
    markAsRead(n.id);
    if (n.user === "Founder Chat" || n.user === "ComplianceBot") {
      navigate('/chat');
      // Also remove it so it doesn't clutter the unread list once they are there
      removeNotification(n.id);
    }
  };

  const handleFilterClick = (id: string, path?: string) => {
    setActiveFilter(id);
    if (path) {
      navigate(path);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-1 p-1 pr-2 rounded-2xl glass bg-surface border border-border shadow-2xl backdrop-blur-3xl ring-1 ring-border/20 isolate">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          const ButtonContent = (
            <button
              onClick={() => handleFilterClick(filter.id, filter.path)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group whitespace-nowrap overflow-hidden",
                isActive
                  ? "bg-primary text-background shadow-lg"
                  : "text-muted hover:text-primary hover:bg-surface-hover"
              )}
            >
              <Icon size={14} className={cn("transition-transform group-hover:scale-110", isActive && "text-emerald-500")} />
              <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] hidden md:inline", isActive && "text-background")}>
                {filter.label}
              </span>

              {filter.badge !== undefined && filter.badge > 0 && (
                <span className={cn(
                  "flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[9px] font-black",
                  isActive ? "bg-emerald-600 text-white" : "bg-surface-hover text-muted"
                )}>
                  {filter.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          );

          if (filter.isTrigger) {
            return (
              <Popover key={filter.id}>
                <PopoverTrigger asChild>
                  {ButtonContent}
                </PopoverTrigger>
                <PopoverContent className={cn(
                  "p-0 mt-2 bg-surface-strong border-border shadow-2xl z-[70] overflow-hidden",
                  filter.id === 'news' ? "w-[650px]" : "w-[380px]"
                )}>
                  {filter.id === 'unread' ? (
                    <>
                      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
                        <Tabs value={notifTab} onValueChange={setNotifTab} className="w-auto">
                          <TabsList className="bg-surface-hover p-1 rounded-xl">
                            <TabsTrigger value="all" className="text-[10px] px-3 py-1 font-bold data-[state=active]:bg-primary data-[state=active]:text-background">All</TabsTrigger>
                            <TabsTrigger value="unread" className="text-[10px] px-3 py-1 font-bold data-[state=active]:bg-primary data-[state=active]:text-background">
                              Unread {unreadCount > 0 && <span className="ml-1 text-emerald-500">{unreadCount}</span>}
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">
                        {filteredNotifs.length === 0 ? (
                          <div className="py-12 text-center text-xs text-muted italic">No notifications</div>
                        ) : (
                          filteredNotifs.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className="flex items-start gap-4 px-4 py-4 hover:bg-surface-hover transition-all border-b border-border last:border-0 group cursor-pointer"
                            >
                              <div className={cn(
                                "p-2 rounded-xl transition-colors",
                                n.unread ? "bg-emerald-500/10 text-emerald-500" : "bg-surface-hover text-muted"
                              )}>
                                <n.icon size={18} />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className={cn(
                                  "text-xs leading-relaxed",
                                  n.unread ? "text-primary font-medium" : "text-muted"
                                )}>
                                  <span className="text-emerald-500 font-bold">{n.user}</span> {n.action} <span className="text-primary font-bold">{n.target}</span>
                                </p>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-tight">{n.timestamp}</p>
                              </div>
                              {n.unread && (
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-border bg-surface">
                        <button
                          onClick={() => { setNotifTab('all'); }}
                          className="w-full py-2.5 text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:text-primary transition-all text-center"
                        >
                          See Activity Center
                        </button>
                      </div>
                    </>
                  ) : filter.id === 'news' ? (
                    <div className="flex h-[400px]">
                      {/* Documents Column */}
                      <div className="w-1/2 border-r border-border p-4 flex flex-col gap-4 bg-surface-strong">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <FileText className="text-emerald-500" size={16} />
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Quick Docs</h4>
                        </div>
                        <div className="overflow-y-auto no-scrollbar space-y-2 flex-1">
                          {recentDocs.map((doc, i) => (
                            <div key={i} className="p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors cursor-pointer group border border-transparent hover:border-border">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  doc.tag === 'MCA' ? "bg-blue-500/10 text-blue-500" :
                                    doc.tag === 'GST' ? "bg-green-500/10 text-green-500" :
                                      "bg-purple-500/10 text-purple-500"
                                )}>{doc.tag}</span>
                                <ExternalLink size={12} className="text-muted group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                                <p className="text-xs font-medium text-muted group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">{doc.title}</p>
                              </a>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => navigate('/documents')}
                          className="w-full py-3 rounded-xl bg-surface hover:bg-emerald-500/10 text-[10px] font-bold text-muted hover:text-emerald-500 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          View Library <ArrowRight size={12} />
                        </button>
                      </div>

                      {/* News Column */}
                      <div className="w-1/2 p-4 flex flex-col gap-4 bg-surface/50">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Newspaper className="text-emerald-500" size={16} />
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Trending Updates</h4>
                        </div>
                        <div className="overflow-y-auto no-scrollbar space-y-4 flex-1">
                          {newsUpdates.map((news, i) => (
                            <div key={i} className="group cursor-pointer">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-emerald-600">{news.source}</span>
                                <span className="text-[9px] text-muted font-medium">{news.time}</span>
                              </div>
                              <p className="text-xs font-medium text-muted group-hover:text-primary transition-colors leading-relaxed">{news.title}</p>
                              <div className="h-[1px] bg-border w-full mt-3 group-last:hidden"></div>
                            </div>
                          ))}
                        </div>
                        <a
                          href="https://cleartax.in/s/latest-gst-news"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl border border-border hover:bg-surface text-[10px] font-bold text-muted hover:text-primary uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          All News <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
            );
          }

          return <React.Fragment key={filter.id}>{ButtonContent}</React.Fragment>;
        })}

        <div className="w-[1px] h-4 bg-border mx-1"></div>

        <div className="flex items-center gap-2 pl-1 relative z-10">
          <ThemeSwitcher value={theme} onValueChange={setTheme} />

          {/* Bell icon opens unread notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 text-muted hover:text-emerald-500 transition-colors relative">
                <BellRing size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-background">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 mt-2 bg-surface-strong border-border shadow-2xl z-[70] overflow-hidden w-[380px]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Notifications</span>
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2">
                {notifications.filter(n => n.unread).length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted italic">All caught up! 🎉</div>
                ) : (
                  notifications.filter(n => n.unread).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-all border-b border-border last:border-0 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <n.icon size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-primary font-medium">
                          <span className="text-emerald-500 font-bold">{n.user}</span> {n.action} <span className="font-bold">{n.target}</span>
                        </p>
                        <p className="text-[9px] text-muted mt-0.5">{n.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-hover transition-colors">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border border-emerald-500">
                      {getUserInitials()}
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 mt-2 bg-surface-strong border-border shadow-2xl z-[70] overflow-hidden w-[260px]">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{user.displayName || 'User'}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopMiniDock;