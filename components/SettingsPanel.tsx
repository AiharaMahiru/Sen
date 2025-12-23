
import React, { useState } from 'react';
import { GlobalSettings, ProviderType, ApiConfig } from '../types';
import { MODELS, PROVIDERS } from '../constants';
import { Monitor, Moon, Sun, Search, MessageSquare, Languages, ChevronDown, Check, Server, Key, Globe, LayoutGrid, Info, ChevronRight } from 'lucide-react';

interface SettingsPanelProps {
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: GlobalSettings) => void;
}

type TabId = 'services' | 'models' | 'appearance' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<TabId>('services');

  const handleDefaultsChange = (key: keyof GlobalSettings['defaults'], value: any) => {
    onUpdateSettings({
      ...settings,
      defaults: {
        ...settings.defaults,
        [key]: value
      }
    });
  };

  const handleApiConfigChange = (key: keyof ApiConfig, value: string) => {
    onUpdateSettings({
      ...settings,
      apiConfig: {
        ...settings.apiConfig,
        [key]: value
      }
    });
  };

  // --- UI Components ---

  const InputField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    placeholder?: string;
    type?: 'text' | 'password';
    icon?: React.ReactNode;
  }> = ({ label, value, onChange, placeholder, type = 'text', icon }) => (
    <div className="mb-5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
            {icon}
          </div>
        )}
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800/60 rounded-xl py-3.5 text-sm outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-black/40 transition-all font-mono text-gray-800 dark:text-gray-200 ${icon ? 'pl-11' : 'pl-4'} pr-4 shadow-inner`}
        />
      </div>
    </div>
  );

  const ModelSelector: React.FC<{ 
    label: string; 
    providerValue: ProviderType; 
    modelValue: string;
    onProviderChange: (p: ProviderType) => void;
    onModelChange: (m: string) => void;
    providers?: { type: ProviderType, label: string }[];
  }> = ({ label, providerValue, modelValue, onProviderChange, onModelChange, providers = PROVIDERS }) => (
    <div className="bg-white/40 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4 hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors">
       <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{label}</div>
       <div className="flex flex-col sm:flex-row gap-3">
          {/* Provider Select */}
          <div className="relative flex-1 group">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">PROV</span>
             </div>
             <select 
               value={providerValue}
               onChange={(e) => {
                  const newProvider = e.target.value as ProviderType;
                  onProviderChange(newProvider);
                  if (MODELS[newProvider]?.[0]) {
                     onModelChange(MODELS[newProvider][0].id);
                  }
               }}
               className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-16 pr-10 text-sm appearance-none outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 font-medium cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
             >
                {providers.map(p => (
                   <option key={p.type} value={p.type}>{p.label}</option>
                ))}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Model Select */}
          <div className="relative flex-1 group">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">MOD</span>
             </div>
             <select 
               value={modelValue}
               onChange={(e) => onModelChange(e.target.value)}
               className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-14 pr-10 text-sm appearance-none outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 font-medium cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
             >
                {MODELS[providerValue]?.map(m => (
                   <option key={m.id} value={m.id}>{m.name}</option>
                ))}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
       </div>
    </div>
  );

  const NavItem: React.FC<{ id: TabId; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-black shadow-lg shadow-black/5' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
      </button>
    );
  };

  // --- Tab Contents ---

  const renderServices = () => (
    <div className="animate-fade-in animate-slide-in-right space-y-8">
       <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Service Configuration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage API keys and endpoints for AI providers.</p>
          
          {/* OpenAI */}
          <div className="p-1">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> OpenAI Compatible
             </h4>
             <div className="grid grid-cols-1 gap-1">
                <InputField 
                  label="Base URL" 
                  value={settings.apiConfig.openaiBaseUrl} 
                  onChange={(v) => handleApiConfigChange('openaiBaseUrl', v)}
                  icon={<Globe className="w-4 h-4" />}
                  placeholder="https://api.openai.com/v1"
                />
                <InputField 
                  label="API Key" 
                  type="password"
                  value={settings.apiConfig.openaiKey} 
                  onChange={(v) => handleApiConfigChange('openaiKey', v)}
                  icon={<Key className="w-4 h-4" />}
                  placeholder="sk-..."
                />
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-6" />

          {/* Gemini */}
          <div className="p-1">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Google Gemini
             </h4>
             <div className="grid grid-cols-1 gap-1">
                <InputField 
                  label="Base URL (Optional)" 
                  value={settings.apiConfig.geminiBaseUrl} 
                  onChange={(v) => handleApiConfigChange('geminiBaseUrl', v)}
                  icon={<Globe className="w-4 h-4" />}
                  placeholder="Default"
                />
                <InputField 
                  label="API Key" 
                  type="password"
                  value={settings.apiConfig.geminiKey} 
                  onChange={(v) => handleApiConfigChange('geminiKey', v)}
                  icon={<Key className="w-4 h-4" />}
                  placeholder="AIza..."
                />
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-6" />

          {/* DeepLX */}
          <div className="p-1">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> DeepLX (Translation)
             </h4>
             <InputField 
               label="Endpoint URL" 
               value={settings.apiConfig.deeplxEndpoint} 
               onChange={(v) => handleApiConfigChange('deeplxEndpoint', v)}
               icon={<Globe className="w-4 h-4" />}
               placeholder="https://api.deeplx.org/translate"
             />
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-6" />

          {/* Search Providers */}
          <div className="p-1">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Search Providers
             </h4>
             <div className="grid grid-cols-1 gap-1">
                <InputField 
                  label="Tavily Key" 
                  type="password"
                  value={settings.apiConfig.tavilyKey} 
                  onChange={(v) => handleApiConfigChange('tavilyKey', v)}
                  icon={<Key className="w-4 h-4" />}
                  placeholder="tvly-..."
                />
                <InputField 
                  label="Brave Search Key" 
                  type="password"
                  value={settings.apiConfig.braveKey} 
                  onChange={(v) => handleApiConfigChange('braveKey', v)}
                  icon={<Key className="w-4 h-4" />}
                  placeholder="BSAP..."
                />
             </div>
          </div>
       </div>
    </div>
  );

  const renderModels = () => (
    <div className="animate-fade-in animate-slide-in-right">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Default AI Models</h2>
       <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Set your preferred AI models for different tasks.</p>

       {/* Search Config */}
       <div className="mb-8">
         <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Search Summary</span>
         </div>
         <div className="bg-white/40 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Model</div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                 <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">GEMINI</span>
              </div>
              <select 
                value={settings.defaults.searchModel}
                onChange={(e) => handleDefaultsChange('searchModel', e.target.value)}
                className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-20 pr-10 text-sm appearance-none outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 font-medium cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                  {MODELS[ProviderType.Gemini].map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <Info className="w-3 h-3" /> Optimized for Google Grounding.
            </p>
         </div>
       </div>

       {/* Chat Config */}
       <div className="mb-8">
         <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">AI Chat</span>
         </div>
         <ModelSelector 
            label="New Chat Default"
            providerValue={settings.defaults.chatProvider}
            modelValue={settings.defaults.chatModel}
            onProviderChange={(p) => handleDefaultsChange('chatProvider', p)}
            onModelChange={(m) => handleDefaultsChange('chatModel', m)}
         />
       </div>

       {/* Translate Config */}
       <div className="mb-8">
         <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Translation</span>
         </div>
         <ModelSelector 
            label="Text Translation Default"
            providerValue={settings.defaults.translateProvider}
            modelValue={settings.defaults.translateModel}
            onProviderChange={(p) => handleDefaultsChange('translateProvider', p)}
            onModelChange={(m) => handleDefaultsChange('translateModel', m)}
         />
       </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="animate-fade-in animate-slide-in-right">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
       <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Customize how ZenTranslate looks on your device.</p>
       
       <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
            className={`group relative p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-4 ${
               settings.theme === 'light' 
               ? 'bg-white border-transparent ring-2 ring-black dark:ring-white shadow-2xl scale-[1.02]' 
               : 'bg-white/40 border-gray-200 hover:bg-white hover:border-gray-300'
            }`}
          >
             <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-gray-50 flex items-center justify-center text-gray-900 transition-colors">
                <Sun className="w-8 h-8" strokeWidth={1.5} />
             </div>
             <span className="font-bold text-gray-900 tracking-tight">Light Mode</span>
             {settings.theme === 'light' && (
               <div className="absolute top-4 right-4 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                 <Check className="w-3.5 h-3.5" strokeWidth={3} />
               </div>
             )}
          </button>

          <button 
            onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
            className={`group relative p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-4 ${
               settings.theme === 'dark' 
               ? 'bg-[#1C1C1E] border-transparent ring-2 ring-black dark:ring-white shadow-2xl scale-[1.02]' 
               : 'bg-gray-800/10 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:bg-gray-800/20'
            }`}
          >
             <div className="w-16 h-16 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center text-white transition-colors">
                <Moon className="w-8 h-8" strokeWidth={1.5} />
             </div>
             <span className="font-bold text-gray-900 dark:text-white tracking-tight">Dark Mode</span>
             {settings.theme === 'dark' && (
               <div className="absolute top-4 right-4 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
                 <Check className="w-3.5 h-3.5" strokeWidth={3} />
               </div>
             )}
          </button>
       </div>
    </div>
  );

  const renderAbout = () => (
    <div className="animate-fade-in animate-slide-in-right">
       <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 rounded-[32px] shadow-2xl flex items-center justify-center mb-6">
             <Languages className="w-12 h-12 text-white dark:text-black" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#1C1C1E] dark:text-white mb-2 tracking-tight">ZenTranslate</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Version 1.0.0 (Beta)</p>
          
          <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 text-left text-sm text-gray-600 dark:text-gray-300 space-y-4">
             <div className="flex justify-between">
               <span>UI Design</span>
               <span className="font-bold">Zen-iOS Hybrid</span>
             </div>
             <div className="h-px bg-gray-200 dark:bg-gray-700" />
             <div className="flex justify-between">
               <span>Engine</span>
               <span className="font-bold">React 19 + Tailwind</span>
             </div>
             <div className="h-px bg-gray-200 dark:bg-gray-700" />
             <div className="flex justify-between">
               <span>AI Core</span>
               <span className="font-bold">Gemini / OpenAI / DeepLX</span>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#F9F9FB] dark:bg-black rounded-[40px] border border-gray-200 dark:border-gray-800/50 shadow-sm">
       
       {/* Left Sidebar (Navigation) */}
       <div className="w-full md:w-64 bg-gray-50/80 dark:bg-[#151517]/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
          <div className="p-6 pb-2">
             <h1 className="text-xl font-extrabold text-[#1C1C1E] dark:text-white tracking-tight px-2">Settings</h1>
          </div>
          
          <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar p-3 flex md:flex-col gap-1">
             <NavItem id="services" label="Services" icon={<Server className="w-4 h-4" />} />
             <NavItem id="models" label="Defaults" icon={<LayoutGrid className="w-4 h-4" />} />
             <NavItem id="appearance" label="Appearance" icon={<Monitor className="w-4 h-4" />} />
             <NavItem id="about" label="About" icon={<Info className="w-4 h-4" />} />
          </div>

          <div className="hidden md:block p-6 text-xs text-center text-gray-400">
             ZenTranslate v1.0
          </div>
       </div>

       {/* Right Content Area */}
       <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b]">
          <div className="max-w-3xl mx-auto p-6 md:p-10 min-h-full">
             {activeTab === 'services' && renderServices()}
             {activeTab === 'models' && renderModels()}
             {activeTab === 'appearance' && renderAppearance()}
             {activeTab === 'about' && renderAbout()}
          </div>
       </div>

    </div>
  );
};
