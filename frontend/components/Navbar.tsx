
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, MessageSquareText, FileSearch, Landmark, BadgeCheck, Calendar as CalendarIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const items = [
    { name: 'Dashboard', url: '/', icon: LayoutGrid },
    { name: 'AI Assistant', url: '/chat', icon: MessageSquareText },
    { name: 'Compliance Calendar', url: '/calendar', icon: CalendarIcon, hasReminder: true },
    { name: 'Docs', url: '/documents', icon: FileSearch },
    { name: 'Regulations', url: '/regulations', icon: Landmark },
    { name: 'Sources', url: '/sources', icon: BadgeCheck },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 md:gap-2 p-2 rounded-full glass bg-surface/80 border border-border shadow-2xl backdrop-blur-xl">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) => `
              relative flex items-center justify-center p-3 rounded-full transition-all duration-300 group
              ${isActive ? 'bg-surface-hover text-emerald-500' : 'text-muted hover:text-primary hover:bg-surface-hover'}
            `}
          >
            <item.icon size={22} />

            {item.hasReminder && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-background"></span>
            )}

            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-strong text-primary text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border shadow-xl">
              {item.name}
            </span>
            <div className="absolute inset-0 rounded-full opacity-0 group-[.active]:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2.5px] bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,1)] rounded-full"></div>
            </div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Navbar;