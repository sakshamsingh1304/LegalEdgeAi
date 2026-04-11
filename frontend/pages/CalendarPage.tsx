
import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Trash2,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../types';
import { cn } from '../lib/utils';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [officialUpdates, setOfficialUpdates] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    desc: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    type: 'Taxation',
    time: '10:00 AM'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fetch manual tasks
    fetch(`${API_URL}/api/tasks`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
      })
      .catch(err => console.error("Failed to fetch tasks:", err));

    // Fetch official updates
    fetch(`${API_URL}/api/documents`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOfficialUpdates(data);
        }
      })
      .catch(err => console.error("Failed to fetch official updates:", err));
  }, []);

  // Removed localStorage useEffects

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // handleDayClick was previously here, removed to avoid duplication

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSaveEvent called");
    console.log("selectedDay:", selectedDay);

    if (!selectedDay) {
      console.error("No selectedDay, aborting save");
      return;
    }

    const newEvent: CalendarEvent = {
      id: formData.id || Date.now().toString(),
      date: selectedDay,
      month: currentMonth.getMonth().toString(),
      year: currentMonth.getFullYear(),
      title: formData.title,
      desc: formData.desc,
      urgency: formData.urgency as 'low' | 'medium' | 'high',
      type: formData.type
    };

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });

      if (res.ok) {
        console.log("Task saved successfully");
        const updatedTasks = await res.json();
        setEvents(updatedTasks);
      } else {
        console.error("Failed to save task, status:", res.status);
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      // Optimistic update fallback
      setEvents(prev => {
        const filtered = prev.filter(e => e.id !== newEvent.id);
        return [...filtered, newEvent];
      });
    }

    setIsEditing(false);
    setSelectedDay(null);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const updatedTasks = await res.json();
        setEvents(updatedTasks);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      // Optimistic update fallback
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    setIsEditing(false);
    setSelectedDay(null);
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const yearName = currentMonth.getFullYear();

  const handleEditTask = (e: React.MouseEvent, task: CalendarEvent) => {
    e.stopPropagation();
    setFormData({
      id: task.id,
      title: task.title,
      desc: task.desc,
      urgency: task.urgency,
      type: task.type,
      time: '10:00 AM' // Default or extracted if we add it
    });
    setSelectedDay(task.date);
    setIsEditing(true);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setFormData({
      id: '',
      title: '',
      desc: '',
      urgency: 'medium',
      type: 'Taxation',
      time: '10:00 AM'
    });
    setIsEditing(true);
  };

  return (
    <div className="flex h-screen flex-col bg-transparent overflow-hidden pb-20">
      <header className="px-8 py-4 border-b border-border/50 flex items-center justify-between glass sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-600/20">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Compliance Calendar</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Official Updates Sync</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center glass rounded-xl overflow-hidden border border-border">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 hover:bg-surface-hover text-muted transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-6 font-semibold text-sm w-40 text-center text-primary">{monthName} {yearName}</span>
            <button
              onClick={handleNextMonth}
              className="p-2.5 hover:bg-surface-hover text-muted transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 md:p-8 no-scrollbar">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="grid grid-cols-7 border-b border-border/50 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-xs font-bold text-muted uppercase tracking-widest">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-5 flex-grow gap-2 md:gap-4">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[140px] opacity-20 border border-transparent" />
            ))}

            {daysInMonth.map((date, i) => {
              const dayNum = date.getDate();
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              const dayTasks = events.filter((e: any) =>
                e.date === dayNum &&
                e.month === currentMonth.getMonth().toString() &&
                e.year === currentMonth.getFullYear()
              );

              const dayDocs = officialUpdates.filter((doc: any) => doc.upload_date === dateStr);

              const isToday = dayNum === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(dayNum)}
                  className={`min-h-[140px] rounded-2xl glass p-4 border transition-all cursor-pointer group relative flex flex-col gap-3 ${isToday ? 'bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-border/40 hover:border-emerald-500/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${isToday ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-muted group-hover:text-primary group-hover:bg-surface'
                      }`}>
                      {dayNum}
                    </span>
                    {dayDocs.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">{dayDocs.length} Update{dayDocs.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 overflow-hidden flex-grow">
                    {dayTasks.slice(0, 2).map((task: any) => (
                      <div
                        key={task.id}
                        onClick={(e) => handleEditTask(e, task)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[10px] font-medium truncate flex items-center gap-2 transition-colors cursor-pointer hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98]",
                          task.urgency === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            task.urgency === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                              "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        )}
                      >
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          task.urgency === 'high' ? "bg-red-500" :
                            task.urgency === 'medium' ? "bg-amber-500" :
                              "bg-blue-500"
                        )} />
                        {task.title}
                      </div>
                    ))}

                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-muted font-bold pl-1 tracking-wider uppercase">+ {dayTasks.length - 2} tasks</div>
                    )}

                    {dayTasks.length === 0 && dayDocs.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-bold text-emerald-500/70 italic flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        Gov Release
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                    <Plus size={14} className="text-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-lg w-full glass p-10 rounded-[3rem] border border-border shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-primary">
                  {formData.id ? 'Edit Compliance Task' : 'New Compliance Task'}
                </h3>
                <p className="text-sm text-muted mt-1">Scheduled for {monthName} {selectedDay}, {yearName}</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-3 hover:bg-surface-hover rounded-2xl text-muted hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Task Title</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface border border-border rounded-2xl p-5 text-primary text-lg font-medium focus:border-emerald-500/50 outline-none transition-all placeholder:text-muted/60"
                  placeholder="e.g. Income Tax Filing"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Context & Description</label>
                <textarea
                  rows={4}
                  value={formData.desc}
                  onChange={e => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-surface border border-border rounded-2xl p-5 text-primary focus:border-emerald-500/50 outline-none transition-all resize-none placeholder:text-muted/60"
                  placeholder="Provide details for the RAG assistant to ground its advice..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Urgency Level</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormData({ ...formData, urgency: u as any })}
                        className={`flex-grow py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all border ${formData.urgency === u
                          ? u === 'high' ? 'bg-red-500 border-red-400 text-white' : u === 'medium' ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-white/5 border-white/10 text-gray-500'
                          }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white focus:border-emerald-500/50 outline-none transition-all text-sm"
                    placeholder="Tax, Legal..."
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="submit"
                  className="flex-grow py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 text-lg"
                >
                  Confirm & Sync <Plus size={22} />
                </button>
                {formData.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(formData.id)}
                    className="p-5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/20"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
