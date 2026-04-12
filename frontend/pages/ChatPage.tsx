
import React, { useState, useEffect, useRef } from 'react';
import PromptInputBox from '../components/PromptInputBox';
import VoiceAssistant from '../components/VoiceAssistant';
import { Message, Source } from '../types';
import { streamRagApi } from '../services/geminiService';
import { getConversations, getMessages, createConversation, saveMessage, deleteConversation, updateConversationTitle, Conversation } from '../services/chatService';
import { Trash2, Download, Eye, FileText, Info, Loader2, Sparkles, Mic, Library, MessageSquareQuote, Plus, MessageCircle, ChevronLeft } from 'lucide-react';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { useNotifications } from '../lib/NotificationContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();
  const location = useLocation();
  const isMounted = useRef(true);
  const { user } = useAuth();

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Load user's conversations on mount
  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user?.uid]);

  const loadConversations = async () => {
    if (!user?.uid) return;
    setLoadingConversations(true);
    const convos = await getConversations(user.uid);
    if (isMounted.current) {
      setConversations(convos);
      setLoadingConversations(false);
    }
  };

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([getWelcomeMessage()]);
      setActiveSources([]);
    }
  }, [activeConversationId]);

  const getWelcomeMessage = (): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: "Hi! Ask me about company registration, GST filing, taxation, funding rules (FDI/SEBI), and startup compliance. I'll answer using verified government sources.",
    timestamp: new Date()
  });

  const loadMessages = async (conversationId: string) => {
    const msgs = await getMessages(conversationId);
    if (isMounted.current) {
      const loadedMessages: Message[] = [
        getWelcomeMessage(),
        ...msgs.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
          sources: m.sources,
        }))
      ];
      setMessages(loadedMessages);

      // Set active sources from last assistant message
      const lastAssistantMsg = [...msgs].reverse().find(m => m.role === 'assistant' && m.sources?.length);
      if (lastAssistantMsg?.sources) {
        setActiveSources(lastAssistantMsg.sources);
      } else {
        setActiveSources([]);
      }
    }
  };

  // Fetch available docs for sidebar
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents`)
      .then(res => res.json())
      .then(data => {
        if (isMounted.current) setAvailableDocs(data);
      })
      .catch(err => console.error("Failed to fetch docs in chat", err));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([getWelcomeMessage()]);
    setActiveSources([]);
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteConversation(convId);
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    }
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      files: files?.map(f => ({ name: f.name, type: f.type, size: f.size }))
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Create conversation if none active
    let convId = activeConversationId;
    if (!convId && user?.uid) {
      const title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
      const newConv = await createConversation(user.uid, title);
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
        setConversations(prev => [newConv, ...prev]);
      }
    }

    // Save user message
    if (convId) {
      await saveMessage(convId, 'user', content);
    }

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: "",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);

    const result = await streamRagApi(content, (streamedText) => {
      if (isMounted.current) {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: streamedText } : m
        ));
      }
    });

    if (result.sources) {
      if (isMounted.current) {
        setActiveSources(result.sources);
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, sources: result.sources } : m
        ));
      }
    }

    // Save assistant message
    if (convId && result.content) {
      await saveMessage(convId, 'assistant', result.content, result.sources);
    }

    // Update conversation title if it was auto-generated
    if (convId && conversations.find(c => c.id === convId)?.title === 'New Chat') {
      const title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
      await updateConversationTitle(convId, title);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, title } : c
      ));
    }

    // Trigger notification if user naved away while generating
    if (window.location.hash !== '#/chat') {
      const summary = result.content.split('.').slice(0, 1).join('.') + '...';
      addNotification({
        user: "ComplianceBot",
        action: "generated",
        target: summary,
        icon: MessageSquareQuote,
      });
    }

    if (isMounted.current) setIsLoading(false);
  };

  const clearChat = () => {
    handleNewChat();
  };

  const exportChat = () => {
    const chatContent = messages
      .filter(m => m.id !== 'welcome')
      .map(m => {
        const time = m.timestamp.toLocaleString();
        const role = m.role === 'user' ? 'You' : 'Assistant';
        let text = `[${time}] ${role}:\n${m.content}`;
        if (m.sources && m.sources.length > 0) {
          text += '\n\nSources:';
          m.sources.forEach((s, i) => {
            text += `\n  ${i + 1}. ${s.title} (${s.authority})`;
          });
        }
        return text;
      })
      .join('\n\n' + '—'.repeat(50) + '\n\n');

    const header = `LegalEdge AI — Chat Export\nExported: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
    const blob = new Blob([header + chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legaledge-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row p-4 pt-4 pb-28 gap-4 overflow-hidden">
      {isVoiceMode && <VoiceAssistant onClose={() => setIsVoiceMode(false)} />}

      {/* Conversation History Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} hidden md:flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="flex-grow glass rounded-3xl border border-border overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <MessageCircle size={14} className="text-emerald-500" />
              Chat History
            </h3>
            <button
              onClick={handleNewChat}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-emerald-500" size={18} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-[10px] text-muted italic">No conversations yet. Start chatting!</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all group ${
                    activeConversationId === conv.id
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                      : 'hover:bg-surface-hover text-muted hover:text-primary'
                  }`}
                >
                  <MessageCircle size={12} className="shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col glass rounded-3xl border border-border overflow-hidden relative shadow-2xl">
        <header className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
          <div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="text-emerald-500" size={18} />
              Compliance Assistant
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-muted">Live & Grounded in verified sources</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceMode(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 group"
            >
              <Mic size={14} className="group-hover:animate-pulse" />
              Realtime Voice
            </button>
            <div className="w-[1px] h-4 bg-border mx-1"></div>
            <button
              onClick={clearChat}
              className="p-2 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={exportChat}
              className="p-2 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title="Export Chat"
            >
              <Download size={18} />
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          {messages.map((msg, index) => {
            // Hide the empty assistant message bubble if we are showing the "Consulting..." loader
            if (isLoading && index === messages.length - 1 && msg.role === 'assistant' && !msg.content) {
              return null;
            }

            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-600/10'
                  : 'glass text-primary rounded-tl-none border border-border'
                  }`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-hover px-2 py-1 rounded-md text-xs border border-border">
                          <FileText size={12} />
                          <span>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base max-w-none">
                    <span className="text-current">
                      {msg.role === 'assistant' ? (
                        <TextGenerateEffect words={msg.content || "..."} duration={0.3} filter={false} className="text-current" />
                      ) : (
                        msg.content
                      )}
                    </span>
                    {!msg.content && msg.role === 'assistant' && <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1"></span>}
                  </div>
                  <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-emerald-100' : 'text-muted'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && !messages[messages.length - 1].content && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl p-4 rounded-tl-none border border-border flex items-center gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={18} />
                <span className="text-sm text-muted">Consulting regulatory knowledge base...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-surface/30 border-t border-border">
          <PromptInputBox onSend={handleSendMessage} />
        </div>
      </div>

      {/* Sources & Knowledge Base Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col gap-4">
        <div className="flex-grow glass rounded-3xl border border-border p-5 space-y-6 overflow-y-auto shadow-2xl">
          {/* Sources Used Section */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info size={16} className="text-emerald-500" />
              Sources Used
            </h3>
            <p className="text-xs text-muted mb-6">
              Verified document chunks retrieved to ground the conversation.
            </p>

            <div className="space-y-4">
              {activeSources.length > 0 ? (
                activeSources.map((source, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-border hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                        {source.authority}
                      </span>
                      <span className="text-[10px] text-muted">
                        Score: {(source.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-primary mb-2 line-clamp-1">{source.title}</h4>
                    <p className="text-[11px] text-muted leading-relaxed italic mb-3 line-clamp-3">
                      "{source.preview}"
                    </p>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-emerald-500 hover:text-emerald-400 font-medium">
                      <FileText size={12} />
                      View Original PDF
                    </a>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-surface/30 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                    <FileText size={20} />
                  </div>
                  <p className="text-[10px] text-muted px-4">
                    Ask a question to see retrieved regulatory documents.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-[1px] bg-border"></div>

          {/* Available Knowledge Base Section */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Library size={16} className="text-teal-500" />
              Knowledge Base
            </h3>
            <p className="text-xs text-muted mb-4">
              All official PDF documents currently indexed and available for RAG.
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {availableDocs.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-hover border border-transparent hover:border-teal-500/30 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <FileText size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary truncate group-hover:text-teal-400 transition-colors">{doc.title}</p>
                    <p className="text-[10px] text-muted truncate">{doc.tag} • PDF</p>
                  </div>
                </a>
              ))}
              {availableDocs.length === 0 && (
                <div className="text-center py-4 text-[10px] text-muted italic">Loading documents...</div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;