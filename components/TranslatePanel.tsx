
import React, { useRef, useEffect } from 'react';
import { Button } from './Button';
import { TranslationState, ProviderType } from '../types';
import { PROVIDERS, MODELS, LANGUAGES } from '../constants';
import { ArrowRight, Copy, Sparkles, Languages, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { IndustrySelector } from './IndustrySelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TranslatePanelProps {
  state: TranslationState;
  setState: React.Dispatch<React.SetStateAction<TranslationState>>;
  onTranslate: () => void;
  onSwapLanguages: () => void;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  onImagePaste?: (base64: string) => void;
}

export const TranslatePanel: React.FC<TranslatePanelProps> = ({
  state,
  setState,
  onTranslate,
  onSwapLanguages,
  isDragOver,
  setIsDragOver,
  onImagePaste
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getLangName = (code: string) => {
    if (code === 'auto') return 'Auto Detect';
    return LANGUAGES.find(l => l.code === code)?.name || code;
  };

  const showIndustrySelector = state.selectedProvider === ProviderType.OpenAI || state.selectedProvider === ProviderType.Gemini;

  // Handle Paste Event to detect images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        if (!onImagePaste) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const result = event.target?.result as string;
                        if (result) onImagePaste(result);
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault(); // Prevent pasting the binary code into textarea
                }
                break;
            }
        }
    };

    const el = textareaRef.current;
    if (el) {
        el.addEventListener('paste', handlePaste);
    }
    return () => {
        if (el) el.removeEventListener('paste', handlePaste);
    }
  }, [onImagePaste]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-center h-full min-h-0">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-slide-in-top shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white">Text Translation</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Efficient & Accurate</p>
          </div>
          
          <div className="flex gap-4 items-center">
              <div className="flex flex-wrap gap-2 items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-2 rounded-[24px] border border-white dark:border-gray-700 shadow-sm transition-colors">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => setState(prev => ({ ...prev, selectedProvider: p.type, selectedModel: MODELS[p.type][0].id }))}
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      state.selectedProvider === p.type
                        ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-black shadow-lg shadow-gray-400/30 dark:shadow-none'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                
                <div className="relative w-[160px]">
                  <div className="flex items-center justify-between px-2 py-1 cursor-pointer group">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {MODELS[state.selectedProvider].find(m => m.id === state.selectedModel)?.name}
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500" />
                  </div>
                  <select
                    value={state.selectedModel}
                    onChange={(e) => setState(prev => ({ ...prev, selectedModel: e.target.value }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    {MODELS[state.selectedProvider].map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative min-h-0 flex-1">
          {/* Source Card */}
          <div 
             className={`group relative flex flex-col bg-white/60 dark:bg-gray-900/40 backdrop-blur-[50px] rounded-[40px] border transition-all duration-300 hover:shadow-2xl overflow-hidden ${
                 isDragOver 
                 ? 'border-gray-800 ring-4 ring-gray-200 dark:ring-gray-700 shadow-xl scale-[1.01]' 
                 : 'border-white/60 dark:border-gray-700/50 shadow-zen'
             }`}
          >
            <div className="absolute inset-0 rounded-[40px] border border-gray-200/40 dark:border-white/5 pointer-events-none"></div>
            
            {/* Header: Added z-20 to ensure Industry Selector dropdown floats above textarea */}
            <div className="relative z-20 flex justify-between items-center p-6 border-b border-gray-100/50 dark:border-gray-800/50 shrink-0">
              <div className="flex items-center gap-2">
                 <div className="relative group">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 dark:bg-[#2C2C2E] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-full transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600/50">
                       <Languages className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                       <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{getLangName(state.sourceLang)}</span>
                       <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select 
                      value={state.sourceLang}
                      onChange={(e) => {
                        const val = e.target.value;
                        let target = state.targetLang;
                        if(val === target) target = val === 'EN' ? 'ZH' : 'EN';
                        setState(prev => ({...prev, sourceLang: val, targetLang: target}));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                    >
                      <option value="auto">Auto Detect</option>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                 </div>

                 <button 
                   onClick={onSwapLanguages}
                   className="ml-1 p-2 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-all active:rotate-180"
                   title="Swap Languages"
                 >
                   <ArrowRightLeft className="w-3.5 h-3.5" />
                 </button>
              </div>

              {/* Industry Selector */}
              {showIndustrySelector && (
                 <IndustrySelector 
                   value={state.industry} 
                   onChange={(val) => setState(prev => ({ ...prev, industry: val }))} 
                   align="right"
                 />
              )}
            </div>

            <div className="flex-1 relative p-6 pb-2 flex flex-col z-0 min-h-0">
               <textarea
                  ref={textareaRef}
                  value={state.sourceText}
                  onChange={(e) => setState(prev => ({ ...prev, sourceText: e.target.value }))}
                  placeholder="Enter text, or paste an image to translate..."
                  className="w-full h-full bg-transparent resize-none outline-none text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 font-medium leading-relaxed custom-scrollbar"
                  spellCheck={false}
               />
            </div>
            
            {/* Button Footer */}
            <div className="px-6 pb-6 pt-2 flex justify-end z-10 shrink-0">
              <Button 
                onClick={onTranslate} 
                isLoading={state.isLoading}
                className="w-full sm:w-auto min-w-[140px] shadow-lg dark:shadow-none"
              >
                {!state.isLoading && <span className="mr-2">Translate</span>}
                {!state.isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Target Card */}
          <div className="group relative flex flex-col bg-[#F2F2F7]/60 dark:bg-black/40 backdrop-blur-[50px] rounded-[40px] border border-white/40 dark:border-gray-800 shadow-zen overflow-hidden">
             <div className="absolute inset-0 rounded-[40px] border border-gray-200/40 dark:border-white/5 pointer-events-none"></div>

             <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-800/50 shrink-0">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <div className="relative group">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-200/50 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-full transition-colors cursor-pointer border border-transparent hover:border-gray-300/50 dark:hover:border-gray-600/50">
                       <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{getLangName(state.targetLang)}</span>
                       <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </div>
                    <select 
                      value={state.targetLang}
                      onChange={(e) => setState(prev => ({ ...prev, targetLang: e.target.value }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code} disabled={l.code === state.sourceLang}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
               </div>
               <button 
                 onClick={() => state.translatedText && navigator.clipboard.writeText(state.translatedText)}
                 className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800 transition-all active:scale-95"
                 title="Copy Translation"
               >
                 <Copy className="w-5 h-5" />
               </button>
             </div>

             <div className="flex-1 p-6 overflow-auto custom-scrollbar min-h-0">
               {state.error ? (
                 <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400 font-medium text-center p-4">
                   {state.error}
                 </div>
               ) : state.translatedText ? (
                 <div className="text-lg text-[#1C1C1E] dark:text-gray-100 font-medium leading-relaxed animate-fade-in">
                   <div className="markdown-body">
                     <ReactMarkdown 
                       remarkPlugins={[remarkGfm]}
                     >
                       {state.translatedText}
                     </ReactMarkdown>
                   </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400/60 dark:text-gray-600 select-none">
                   <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 flex items-center justify-center shadow-inner dark:shadow-none">
                      <Sparkles className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                   </div>
                   <span className="text-sm font-medium">Translation will appear here</span>
                 </div>
               )}
             </div>
          </div>
      </div>
    </div>
  );
};
