/**
 * NEXUS AI - Persistent AI History Timeline View
 * Bucketed into Today, Yesterday, Previous 7 Days, Previous 30 Days, Older.
 * Supports Search, Filter, Rename, Archive/Delete, Export, and Continue Conversation.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  MessageSquare,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowRight,
  Filter,
  Download,
  Tag,
  Monitor,
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

interface ConversationItem {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count?: number;
  preview?: string;
  context_tags?: string[];
}

export const NexusHistory: React.FC<{
  onSelectConversation?: (id: string) => void;
  onNavigate?: (view: string) => void;
}> = ({ onSelectConversation, onNavigate }) => {
  const { user, addToast, setCurrentView } = useApp();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Selected conversation detail view
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const res = await api.getConversations();
      if (res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !selectedConvId) {
          setSelectedConvId(res.conversations[0].id);
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load conversation history', 'History Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConvId) {
      setLoadingMessages(true);
      api.getConversationMessages(selectedConvId)
        .then((res) => {
          if (res.success) {
            setMessages(res.messages || []);
          }
        })
        .catch((err) => {
          console.warn('Error fetching messages for conversation:', err);
        })
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  const handleStartRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setNewTitle(conv.title);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!newTitle.trim()) return;
    try {
      await api.updateConversationTitle(id, newTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
      );
      setEditingId(null);
      addToast('success', 'Conversation title updated.', 'Renamed');
    } catch (err: any) {
      addToast('error', err.message || 'Rename failed', 'Error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConvId === id) {
        setSelectedConvId(null);
        setMessages([]);
      }
      addToast('info', 'Conversation deleted from history.', 'Deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Deletion failed', 'Error');
    }
  };

  // Grouping timeline: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older
  const groupConversations = (items: ConversationItem[]) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - oneDay;
    const sevenDaysAgo = startOfToday - 7 * oneDay;
    const thirtyDaysAgo = startOfToday - 30 * oneDay;

    const groups: { [key: string]: ConversationItem[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    };

    items.forEach((item) => {
      const ts = item.updated_at || item.created_at || now;
      if (ts >= startOfToday) {
        groups['Today'].push(item);
      } else if (ts >= startOfYesterday) {
        groups['Yesterday'].push(item);
      } else if (ts >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(item);
      } else if (ts >= thirtyDaysAgo) {
        groups['Previous 30 Days'].push(item);
      } else {
        groups['Older'].push(item);
      }
    });

    return groups;
  };

  const filtered = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupConversations(filtered);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-b from-[#111522] to-[#0c0e17] border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>✦ AI History Timeline</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-cyan-400 border border-indigo-500/20">
                Persistent & Isolated
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Every conversation, reasoning trajectory, context source, and model response saved to your account.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Two Column Workspace: Sidebar Timeline + Conversation Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Timeline Column */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0c101a] border border-white/[0.06] p-4 flex flex-col space-y-4 max-h-[700px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              Timeline Index ({filtered.length})
            </span>
            <button
              type="button"
              onClick={loadConversations}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Loading history timeline...
              </div>
            ) : filtered.length === 0 ? (
              /* EMPTY STATE */
              <div className="p-8 text-center space-y-2 rounded-xl border border-dashed border-white/[0.08] my-4">
                <div className="w-10 h-10 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium text-neutral-300">No conversations yet</div>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  &ldquo;Your NEXUS history will appear here.&rdquo; Start a conversation in the dashboard to build your timeline.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([timeBucket, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={timeBucket} className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider px-2 pt-1">
                      {timeBucket} ({items.length})
                    </div>
                    {items.map((conv) => {
                      const isSelected = selectedConvId === conv.id;
                      const isEditing = editingId === conv.id;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                            isSelected
                              ? 'bg-neutral-850/90 border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20'
                              : 'bg-neutral-900/50 border-white/[0.04] hover:bg-neutral-850/50 hover:border-white/[0.09]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-950 border border-cyan-500 rounded text-xs text-white focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveRename(conv.id, e)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(null);
                                  }}
                                  className="p-1 text-neutral-400 hover:bg-neutral-800 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="overflow-hidden flex-1">
                                <div className="text-xs font-semibold text-neutral-200 group-hover:text-white truncate">
                                  {conv.title || 'Untitled Conversation'}
                                </div>
                                <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-neutral-500" />
                                    {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {conv.message_count !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span>{conv.message_count} messages</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {!isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(conv, e)}
                                  title="Rename"
                                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(conv.id, e)}
                                  title="Delete"
                                  className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Conversation Detail & Context Transcript */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0c101a] border border-white/[0.06] p-5 flex flex-col justify-between max-h-[700px] overflow-hidden">
          {selectedConvId ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="overflow-hidden">
                  <h2 className="text-sm font-bold text-white truncate">
                    {conversations.find((c) => c.id === selectedConvId)?.title || 'Conversation'}
                  </h2>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>ID: {selectedConvId.slice(0, 16)}...</span>
                    <span>•</span>
                    <span className="text-cyan-400">Isolated to {user?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('home');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                  >
                    <span>Continue Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    Loading conversation transcript...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 italic">
                    No recorded messages in this session.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-neutral-500">
                          <span>{isUser ? user?.name || 'You' : 'NEXUS Spatial AI'}</span>
                          {msg.created_at && (
                            <>
                              <span>•</span>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            isUser
                              ? 'bg-indigo-600/90 text-white rounded-tr-sm'
                              : 'bg-neutral-900 border border-white/[0.08] text-neutral-200 rounded-tl-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          {/* Context History Metadata: If assistant response stored context sources */}
                          {!isUser && msg.context_sources && (
                            <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center gap-2 text-[10px] font-mono text-cyan-300">
                              <Monitor className="w-3 h-3" />
                              <span>Sources: {Array.isArray(msg.context_sources) ? msg.context_sources.join(', ') : String(msg.context_sources)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500 space-y-2">
              <History className="w-8 h-8 text-neutral-600" />
              <div className="text-xs font-medium text-neutral-400">Select a Conversation</div>
              <p className="text-[11px] max-w-xs">
                Pick any historical timeline item on the left to inspect its multi-turn responses, context citations, and runtime metadata.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
