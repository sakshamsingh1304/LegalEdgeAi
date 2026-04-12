import { fetchWithRetry } from '../lib/fetchWithRetry';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const retryOpts = {
  maxRetries: 3,
  initialDelayMs: 2000,
};

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  created_at: string;
}

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations?user_id=${userId}`, undefined, retryOpts);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return await res.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const getMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations/${conversationId}/messages`, undefined, retryOpts);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return await res.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const createConversation = async (userId: string, title: string = 'New Chat'): Promise<Conversation | null> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title }),
    }, retryOpts);
    if (!res.ok) throw new Error('Failed to create conversation');
    return await res.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

export const saveMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: any[]
): Promise<ChatMessage | null> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content, sources }),
    }, retryOpts);
    if (!res.ok) throw new Error('Failed to save message');
    return await res.json();
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
    }, retryOpts);
    return res.ok;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

export const updateConversationTitle = async (conversationId: string, title: string): Promise<boolean> => {
  try {
    const res = await fetchWithRetry(`${API_URL}/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }, retryOpts);
    return res.ok;
  } catch (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }
};
