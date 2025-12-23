
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HistoryPanel } from './components/HistoryPanel';
import { ImageCropper } from './components/ImageCropper';
import { TranslatePanel } from './components/TranslatePanel';
import { ImageTranslatePanel } from './components/ImageTranslatePanel';
import { SearchPanel } from './components/SearchPanel';
import { ChatPanel } from './components/ChatPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Dock } from './components/Dock';
import { MODELS, API_CONFIG } from './constants';
import { TranslationState, HistoryItem, AppView, ProviderType, GlobalSettings } from './types';
import { v4 as uuidv4 } from 'uuid';
import { translationService } from './services/translationService';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.Translate); 
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Default Global Settings - Forced Gemini defaults for stability
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    theme: 'light',
    defaults: {
      chatProvider: ProviderType.Gemini,
      chatModel: MODELS[ProviderType.Gemini][0].id,
      translateProvider: ProviderType.Gemini, 
      translateModel: MODELS[ProviderType.Gemini][0].id,
      searchModel: 'gemini-2.0-flash',
    },
    apiConfig: API_CONFIG // Initial compile-time defaults
  });

  // --- Init & Persistence ---
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('zen_global_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setGlobalSettings(prev => {
          const merged = {
            ...prev,
            ...parsed,
            defaults: { ...prev.defaults, ...parsed.defaults },
            apiConfig: { ...prev.apiConfig, ...parsed.apiConfig }
          };
          return merged;
        });
      } catch (e) { console.error("Failed to load settings", e); }
    } else {
       // Check system theme preference if no settings saved
       if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
         setGlobalSettings(prev => ({ ...prev, theme: 'dark' }));
       }
    }

    const savedHistory = localStorage.getItem('zen_history');
    if (savedHistory) try { setHistory(JSON.parse(savedHistory)); } catch {}
  }, []);

  // Sync Global Settings to Persistence and Services
  useEffect(() => {
    localStorage.setItem('zen_global_settings', JSON.stringify(globalSettings));
    
    // Theme
    localStorage.setItem('zen_theme', globalSettings.theme);
    document.documentElement.classList.toggle('dark', globalSettings.theme === 'dark');

    // Service Config
    translationService.setConfig(globalSettings.apiConfig);
  }, [globalSettings]);

  useEffect(() => { localStorage.setItem('zen_history', JSON.stringify(history)); }, [history]);
  
  // --- Text Translation State ---
  const [transState, setTransState] = useState<TranslationState>({
    sourceText: '',
    translatedText: '',
    isLoading: false,
    error: null,
    sourceLang: 'auto',
    targetLang: 'ZH',
    selectedProvider: ProviderType.Gemini, // Initial fallback
    selectedModel: MODELS[ProviderType.Gemini][0].id,
    industry: '',
    attachedImage: null,
    tempImage: null,
  });

  // Sync state when global defaults change (only if empty to avoid overwrite)
  useEffect(() => {
     if (globalSettings.defaults && !transState.sourceText && !transState.translatedText) {
        setTransState(prev => ({
           ...prev,
           selectedProvider: globalSettings.defaults.translateProvider,
           selectedModel: globalSettings.defaults.translateModel
        }));
     }
  }, [globalSettings.defaults.translateProvider, globalSettings.defaults.translateModel]);

  // --- Image Translation State ---
  const [imgTransState, setImgTransState] = useState<TranslationState>({
    sourceText: '',
    translatedText: '',
    isLoading: false,
    error: null,
    sourceLang: 'auto',
    targetLang: 'ZH',
    selectedProvider: ProviderType.Gemini,
    selectedModel: MODELS[ProviderType.Gemini][0].id,
    industry: '',
    attachedImage: null,
    tempImage: null,
  });

  const [isDragOver, setIsDragOver] = useState(false);

  // --- Handlers ---
  const addToHistory = (source: string, result: string, isImage: boolean = false) => {
    setHistory(prev => [{
      id: uuidv4(),
      sourceText: source,
      translatedText: result,
      sourceLang: isImage ? imgTransState.sourceLang : transState.sourceLang,
      targetLang: isImage ? imgTransState.targetLang : transState.targetLang,
      provider: isImage ? imgTransState.selectedProvider : transState.selectedProvider,
      timestamp: Date.now(),
      isFavorite: false,
      wasImage: isImage
    }, ...prev].slice(0, 50));
  };

  const handleTranslate = async () => {
    if (!transState.sourceText) return;
    setTransState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await translationService.translate(transState.selectedProvider, {
        text: transState.sourceText,
        sourceLang: transState.sourceLang,
        targetLang: transState.targetLang,
        imageBase64: null,
        model: transState.selectedModel,
        industry: transState.industry
      });
      setTransState(prev => ({ ...prev, translatedText: result, isLoading: false }));
      addToHistory(transState.sourceText, result);
    } catch (err: any) {
      setTransState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const handleImageTranslate = async () => {
    if (!imgTransState.attachedImage) return;
    setImgTransState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await translationService.translate(imgTransState.selectedProvider, {
        text: '', // Empty text for pure image translation
        sourceLang: imgTransState.sourceLang,
        targetLang: imgTransState.targetLang,
        imageBase64: imgTransState.attachedImage,
        model: imgTransState.selectedModel,
        industry: imgTransState.industry
      });
      setImgTransState(prev => ({ ...prev, translatedText: result, isLoading: false }));
      addToHistory('[Image Translation]', result, true);
    } catch (err: any) {
      setImgTransState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const handleSwapLanguages = () => {
    setTransState(prev => ({
      ...prev,
      sourceLang: prev.targetLang,
      targetLang: prev.sourceLang === 'auto' ? 'EN' : prev.sourceLang,
      sourceText: prev.translatedText,
      translatedText: prev.sourceText
    }));
  };

  // Callback when user pastes an image in the Text Translate View
  const handleImagePasteInTextView = (base64Image: string) => {
      setImgTransState(prev => ({
          ...prev,
          attachedImage: base64Image,
          sourceLang: transState.sourceLang,
          targetLang: transState.targetLang,
          error: null,
          translatedText: ''
      }));
      setCurrentView(AppView.ImageTranslate);
  };

  // --- Render ---
  return (
    <>
      <Layout>
        {/* View Switcher */}
        {currentView === AppView.Search && (
           <SearchPanel defaultModel={globalSettings.defaults.searchModel} />
        )}
        
        {currentView === AppView.Chat && (
           <ChatPanel 
             defaultProvider={globalSettings.defaults.chatProvider}
             defaultModel={globalSettings.defaults.chatModel}
           />
        )}
        
        {currentView === AppView.Translate && (
          <TranslatePanel 
            state={transState}
            setState={setTransState}
            onTranslate={handleTranslate}
            onSwapLanguages={handleSwapLanguages}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            onImagePaste={handleImagePasteInTextView}
          />
        )}

        {currentView === AppView.ImageTranslate && (
          <ImageTranslatePanel 
             state={imgTransState}
             setState={setImgTransState}
             onTranslate={handleImageTranslate}
          />
        )}

        {currentView === AppView.Settings && (
           <SettingsPanel 
             settings={globalSettings} 
             onUpdateSettings={setGlobalSettings} 
           />
        )}
      </Layout>

      {/* Dock */}
      <Dock 
        currentView={currentView}
        onChangeView={setCurrentView}
        onImageTranslateClick={() => setCurrentView(AppView.ImageTranslate)}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onClearClick={() => {
           if (currentView === AppView.ImageTranslate) {
              setImgTransState(prev => ({...prev, attachedImage: null, translatedText: ''}));
           } else {
              setTransState(prev => ({...prev, sourceText: '', translatedText: ''}));
           }
        }}
        onThemeToggle={() => setGlobalSettings(prev => ({...prev, theme: prev.theme === 'light' ? 'dark' : 'light'}))}
        isDark={globalSettings.theme === 'dark'}
      />

      {/* Overlays */}
      <HistoryPanel 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => {
          if (item.wasImage) {
             setImgTransState(prev => ({
               ...prev,
               translatedText: item.translatedText,
               sourceLang: item.sourceLang,
               targetLang: item.targetLang,
               selectedProvider: item.provider
             }));
             setCurrentView(AppView.ImageTranslate);
          } else {
             setTransState(prev => ({
               ...prev, 
               sourceText: item.sourceText,
               translatedText: item.translatedText,
               sourceLang: item.sourceLang,
               targetLang: item.targetLang,
               selectedProvider: item.provider
             }));
             setCurrentView(AppView.Translate);
          }
          setIsHistoryOpen(false);
        }}
        onToggleFavorite={(id) => setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorite: !h.isFavorite } : h))}
        onDelete={(id) => setHistory(prev => prev.filter(h => h.id !== id))}
        onClearHistory={() => setHistory(prev => prev.filter(h => h.isFavorite))}
      />
    </>
  );
};

export default App;
