/**
 * NEXUS AI - Module 5: Local Memory & Semantic Search
 * Local knowledge store with cosine similarity ranking.
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Tag,
  Download,
  ShieldCheck,
  Code,
  FileText,
  Bookmark,
  Briefcase,
  Users,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { MemoryItem } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const LocalMemory: React.FC = () => {
  const { addToast } = useApp();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'note' | 'code' | 'project' | 'document' | 'meeting'>('note');
  const [newTags, setNewTags] = useState('');

  const loadMemory = async () => {
    try {
      const data = await api.getMemory();
      setItems(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMemory();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const data = await api.searchMemory(searchQuery);
      setSearchResults(data.results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.addMemory({
        title: newTitle,
        content: newContent,
        category: newCategory,
        tags,
      });
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setShowAddModal(false);
      addToast('success', `Created memory: "${newTitle.slice(0, 35)}"`, 'Memory Stored');
      await loadMemory();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add memory item', 'Memory Error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteMemory(id);
      addToast('info', 'Memory item removed from local SQLite database', 'Item Deleted');
      await loadMemory();
      if (searchResults) {
        setSearchResults(searchResults.filter(r => r.item.id !== id));
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete memory item');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexus_local_memory_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'code':
        return <Code className="w-3.5 h-3.5 text-blue-400" />;
      case 'project':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'meeting':
        return <Users className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Local Memory & Vector Knowledge
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zero-leak local knowledge base powered by 384-dimensional vector embeddings and SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-medium text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory Item</span>
          </button>
        </div>
      </div>

      {/* Semantic Vector Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            if (!e.target.value.trim()) setSearchResults(null);
          }}
          placeholder="Semantic vector search (e.g. 'How does Snapdragon accelerate INT8 GEMM?' or 'flask cors fix')..."
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-indigo-500/60 rounded-xl px-4 py-3 pl-11 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none shadow-sm"
        />
        <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-3.5" />
        {searchQuery && (
          <button
            type="submit"
            className="absolute right-2.5 top-2.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium"
          >
            Search
          </button>
        )}
      </form>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
          <div className="text-xs font-semibold text-neutral-200">
            Create Local Memory Record
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Record Title (e.g. Hexagon NPU Benchmark Results)..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none"
            >
              <option value="note">Category: Note</option>
              <option value="code">Category: Code Snippet</option>
              <option value="project">Category: Project</option>
              <option value="document">Category: Document Excerpt</option>
              <option value="meeting">Category: Meeting Decision</option>
            </select>
            <input
              type="text"
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              placeholder="Tags comma-separated (e.g. snapdragon, python, npu)..."
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={4}
            placeholder="Enter knowledge content. Automatically embedded for semantic search..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
            >
              Save to Local Memory
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {['all', 'note', 'code', 'project', 'document', 'meeting'].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Section */}
      {searchResults ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Semantic Vector Matches ({searchResults.length})</span>
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="text-indigo-400 hover:underline text-[11px]"
            >
              Clear Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((res, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-indigo-500/30 bg-neutral-900/60 space-y-2 relative"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-200">{res.title}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Similarity: {Math.round(res.similarity * 100)}%
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3 font-mono">
                  {res.item.content || res.item.text}
                </p>
                <div className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-800 font-mono">
                  Type: {res.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-white/[0.08] my-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 mb-2">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-xs font-semibold text-neutral-300">No saved memories</div>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
              &ldquo;Save useful context for future conversations.&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                    {getCategoryIcon(item.category)}
                    <span className="line-clamp-1">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap line-clamp-4">
                  {item.content}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
                <div className="flex flex-wrap gap-1">
                  {item.tags?.map((t, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="text-emerald-400 font-mono">On-Device</span>
              </div>
            </div>
          ))}
        </div>
        )
      )}
    </div>
  );
};
