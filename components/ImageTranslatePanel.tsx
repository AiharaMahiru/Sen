
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './Button';
import { TranslationState, ProviderType } from '../types';
import { PROVIDERS, MODELS, LANGUAGES } from '../constants';
import { ArrowRight, Copy, Image as ImageIcon, X, Upload, ChevronDown, Sparkles, ScanLine, Clipboard } from 'lucide-react';
import { IndustrySelector } from './IndustrySelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ImageTranslatePanelProps {
  state: TranslationState;
  setState: React.Dispatch<React.SetStateAction<TranslationState>>;
  onTranslate: () => void;
}

export const ImageTranslatePanel: React.FC<ImageTranslatePanelProps> = ({
  state,
  setState,
  onTranslate
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Filter providers that support images
  const imageProviders = PROVIDERS.filter(p => MODELS[p.type].some(m => m.supportsImage));

  // Initialize with a valid provider if current one doesn't support images
  useEffect(() => {
    const currentModelSupports = MODELS[state.selectedProvider]?.find(m => m.id === state.selectedModel)?.supportsImage;
    if (!currentModelSupports) {
       // Default to Gemini or OpenAI
       const defaultProvider = imageProviders.find(p => p.type === ProviderType.Gemini) || imageProviders[0];
       if (defaultProvider) {
         setState(prev => ({
           ...prev,
           selectedProvider: defaultProvider.type,
           selectedModel: MODELS[defaultProvider.type].find(m => m.supportsImage)?.id || MODELS[defaultProvider.type][0].id
         }));
       }
    }
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setState(prev => ({ ...prev, attachedImage: event.target?.result as string, translatedText: '', error: null }));
          };
          reader.readAsDataURL(blob);
        }
        e.preventDefault();
        break;
      }
    }
  }, [setState]);

  // Attach paste listener to window for ease of use
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleManualPaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
         throw new Error("Clipboard API unavailable");
      }
      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (event) => {
            setState(prev => ({ ...prev, attachedImage: event.target?.result as string, translatedText: '', error: null }));
          };
          reader.readAsDataURL(blob);
          foundImage = true;
          return;
        }
      }
      if (!foundImage) {
        alert("No image found in clipboard");
      }
    } catch (err) {
      console.error("Paste failed:", err);
      // Fallback: Focus the dropzone so Ctrl+V works immediately
      dropZoneRef.current?.focus();
      // Give a subtle hint instead of a jarring alert if possible, but alert ensures they see it
      alert("Please press Ctrl+V to paste the image.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
       const reader = new FileReader();
       reader.onload = (event) => {
         setState(prev => ({ ...prev, attachedImage: event.target?.result as string, translatedText: '', error: null }));
       };
       reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setState(prev => ({ ...prev, attachedImage: event.target?.result as string, translatedText: '', error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getLangName = (code: string) => {
     if (code === 'auto') return 'Auto Detect';
     return LANGUAGES.find(l => l.code === code)?.name || code;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-center h-full min-h-0">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-slide-in-top shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white">Image Translation</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Extract & Translate Text</p>
          </div>
          
          <div className="flex gap-4 items-center">
             <div className="flex flex-wrap gap-2 items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-2 rounded-[24px] border border-white dark:border-gray-700 shadow-sm transition-colors">
                {imageProviders.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      selectedProvider: p.type, 
                      selectedModel: MODELS[p.type].find(m => m.supportsImage)?.id || MODELS[p.type][0].id 
                    }))}
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
                
                <div className="relative w-[180px]">
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
                    {MODELS[state.selectedProvider].filter(m => m.supportsImage).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative min-h-0 flex-1">
          
          {/* Image Input Card */}
          <div 
             className={`group relative flex flex-col bg-white/60 dark:bg-gray-900/40 backdrop-blur-[50px] rounded-[40px] border transition-all duration-300 hover:shadow-2xl overflow-hidden ${
                 isDragOver 
                 ? 'border-gray-800 ring-4 ring-gray-200 dark:ring-gray-700 shadow-xl scale-[1.01]' 
                 : 'border-white/60 dark:border-gray-700/50 shadow-zen'
             }`}
             onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
             onDragLeave={() => setIsDragOver(false)}
             onDrop={handleDrop}
          >
             <div className="relative z-20 flex justify-between items-center p-6 border-b border-gray-100/50 dark:border-gray-800/50 shrink-0">
               <div className="flex items-center gap-2">
                 <div className="relative group">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 dark:bg-[#2C2C2E] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-full transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600/50">
                       <ScanLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                       <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{getLangName(state.sourceLang)}</span>
                       <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select 
                      value={state.sourceLang}
                      onChange={(e) => setState(prev => ({...prev, sourceLang: e.target.value}))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                    >
                      <option value="auto">Auto Detect</option>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                 </div>
               </div>

               <IndustrySelector 
                  value={state.industry} 
                  onChange={(val) => setState(prev => ({ ...prev, industry: val }))}
               />
             </div>

             <div className="flex-1 relative flex flex-col items-center justify-center p-4 min-h-0">
                {state.attachedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700">
                    <img src={state.attachedImage} alt="Source" className="max-w-full max-h-full object-contain" />
                    <button 
                      onClick={() => setState(prev => ({ ...prev, attachedImage: null, translatedText: '' }))}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    ref={dropZoneRef}
                    className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                      // Ctrl+V handled globally or via event bubbling if focused
                    }}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                    />
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6 flex items-center justify-center shadow-inner">
                      <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Drag & Drop or Click</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Upload an image to detect and translate text automatically</p>
                    
                    <div className="flex gap-3">
                      <Button variant="secondary" className="!py-2 !px-4 text-sm pointer-events-none">
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </Button>
                      <Button 
                         variant="secondary" 
                         className="!py-2 !px-4 text-sm z-20"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleManualPaste();
                         }}
                      >
                        <Clipboard className="w-4 h-4 mr-2" /> Paste
                      </Button>
                    </div>
                  </div>
                )}
             </div>

             {/* Button Footer */}
             <div className="px-6 pb-6 pt-2 flex justify-center z-10 shrink-0">
               <Button 
                onClick={onTranslate} 
                isLoading={state.isLoading}
                disabled={!state.attachedImage}
                className="w-full sm:w-auto min-w-[160px] shadow-lg dark:shadow-none"
              >
                {!state.isLoading && <span className="mr-2">Translate Image</span>}
                {!state.isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
             </div>
          </div>

          {/* Translation Result */}
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
                   <span className="text-sm font-medium">Translated text will appear here</span>
                 </div>
               )}
             </div>
          </div>
      </div>
    </div>
  );
};
