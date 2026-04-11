
import React, { useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import {
  Bell,
  GitMerge,
  FileText,
  ClipboardCheck,
  Mail,
  MessageSquareQuote,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

interface Notification {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  unread: boolean;
  icon: LucideIcon;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    user: "ComplianceBot",
    action: "identified",
    target: "new GST amendment",
    timestamp: "10 minutes ago",
    unread: true,
    icon: AlertCircle,
  },
  {
    id: 2,
    user: "MCA Service",
    action: "confirmed",
    target: "DIN verification",
    timestamp: "30 minutes ago",
    unread: true,
    icon: FileText,
  },
  {
    id: 3,
    user: "Legal Team",
    action: "updated",
    target: "SHA Draft v2",
    timestamp: "2 hours ago",
    unread: false,
    icon: ClipboardCheck,
  },
  {
    id: 4,
    user: "Startup India",
    action: "sent",
    target: "Recognition Certificate",
    timestamp: "5 hours ago",
    unread: false,
    icon: Mail,
  },
  {
    id: 5,
    user: "Founder Chat",
    action: "replied",
    target: "FEMA compliance query",
    timestamp: "1 day ago",
    unread: false,
    icon: MessageSquareQuote,
  },
];

function NotificationInboxPopover() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const [tab, setTab] = useState("all");

  const filtered = tab === "unread" ? notifications.filter((n) => n.unread) : notifications;

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center p-3 rounded-full transition-all duration-300 group text-gray-400 hover:text-white hover:bg-white/5">
          <Bell size={22} />
          {unreadCount > 0 && (
            <Badge className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 ring-2 ring-black bg-emerald-500">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
            Notifications
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 mb-4 mr-4 bg-[#0a0f1d] border-emerald-500/20 shadow-emerald-500/5">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <TabsList className="bg-white/5 p-1 rounded-xl">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread {unreadCount > 0 && <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-none">{unreadCount}</Badge>}
              </TabsTrigger>
            </TabsList>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto no-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-gray-500 italic">
                No recent notifications
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className="flex w-full items-start gap-4 border-b border-white/5 px-4 py-4 text-left hover:bg-white/5 transition-colors relative"
                  >
                    <div className={`mt-1 p-2 rounded-xl ${n.unread ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-xs leading-relaxed ${n.unread ? "font-bold text-white" : "text-gray-400"}`}>
                        <span className="text-emerald-400">{n.user}</span> {n.action}{" "}
                        <span className="text-gray-100">{n.target}</span>
                      </p>
                      <p className="text-[10px] text-gray-600 font-medium">{n.timestamp}</p>
                    </div>
                    {n.unread && (
                      <span className="mt-2 inline-block size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Tabs>
        <div className="p-2 border-t border-white/5">
          <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-white rounded-xl">
            See Activity Center
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationInboxPopover };