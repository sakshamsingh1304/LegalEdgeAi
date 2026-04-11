
import React from 'react';

export interface User {
  email: string;
  name?: string;
}

export interface CalendarEvent {
  id: string;
  date: number; // Day of month
  month: string; // e.g. "MAR"
  year: number;
  title: string;
  desc: string;
  urgency: 'low' | 'medium' | 'high';
  type: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  files?: FileData[];
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Source {
  title: string;
  authority: 'MCA' | 'GST' | 'IT' | 'SEBI' | 'Startup India' | 'FDI';
  preview: string;
  confidence: number;
  url?: string;
}

export interface NavItem {
  name: string;
  url: string;
  icon: React.ElementType;
}