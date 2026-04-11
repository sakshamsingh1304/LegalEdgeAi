import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MessageSquareQuote, AlertCircle, FileText, ClipboardCheck, Mail, LucideIcon } from 'lucide-react';

export interface Notification {
    id: number;
    user: string;
    action: string;
    target: string;
    timestamp: string;
    unread: boolean;
    icon: LucideIcon;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    removeNotification: (id: number) => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => {
        const newNotif: Notification = {
            ...notif,
            id: Date.now(),
            timestamp: "Just now",
            unread: true,
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            removeNotification,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
