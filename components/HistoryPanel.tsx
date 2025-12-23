
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { Search, Star, Trash2, Clock, X, ArrowUpRight, Copy } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onToggleFavorite,
  onDelete,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let items = activeTab === 'recent' ? history : history.filter(h => h.isFavorite);
    
    // Sort by timestamp desc
    items = [...items].sort((a, b) => b.timestamp - a.timestamp);

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      items = items.filter(
        item => 
          item.sourceText.toLowerCase().includes(lowerQ) || 
          item.translatedText.toLowerCase().includes(lowerQ)
      );
    }
    return items;
  }, [history, activeTab, searchQuery]);

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[90] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-[400px] bg-[#F9F9FB]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl shadow-2xl z-[100] transform transition-transform duration-300 ease-out border-l border-white/50 dark:border-white/10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/60 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">History</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-200/50 dark:bg-gray-800 p-1 rounded-xl mb-4">
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'recent' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" /> Recent
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'favorites' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Star className="w-4 h-4" fill={activeTab === 'favorites' ? "currentColor" : "none"} /> Favorites
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search translations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:border-gray-400 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600 text-sm">
                <p>No translations found</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <span>{item.sourceLang} → {item.targetLang}</span>
                      <span>•</span>
                      <span>{formatDate(item.timestamp)}</span>
                      {item.wasImage && <span>• Image</span>}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <Star className="w-4 h-4" fill={item.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                         onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                         className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cursor-pointer" onClick={() => onSelect(item)}>
                    <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-2 mb-1">{item.sourceText}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">{item.translatedText}</p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => onSelect(item)}
                      className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                    >
                      Restore <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {activeTab === 'recent' && filteredItems.length > 0 && (
             <div className="p-4 border-t border-gray-200/60 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-xl">
               <button 
                 onClick={onClearHistory}
                 className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-red-500 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 transition-colors"
               >
                 Clear History
               </button>
             </div>
          )}
        </div>
      </div>
    </>
  );
};
