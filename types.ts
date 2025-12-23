
export enum ProviderType {
  DeepLX = 'DeepLX',
  OpenAI = 'OpenAI',
  Gemini = 'Gemini',
}

export enum AppView {
  Search = 'Search',
  Chat = 'Chat',
  Translate = 'Translate',
  ImageTranslate = 'ImageTranslate',
  Settings = 'Settings',
}

export interface ModelConfig {
  id: string;
  name: string;
  supportsImage: boolean;
}

export interface ApiConfig {
  deeplxEndpoint: string;
  openaiBaseUrl: string;
  openaiKey: string;
  geminiBaseUrl: string;
  geminiKey: string;
  tavilyKey: string;
  braveKey: string;
}

export interface GlobalSettings {
  theme: 'light' | 'dark';
  defaults: {
    chatProvider: ProviderType;
    chatModel: string;
    translateProvider: ProviderType;
    translateModel: string;
    searchModel: string; // Model used for search summarization
  };
  apiConfig: ApiConfig;
}

export interface TranslationState {
  sourceText: string;
  translatedText: string;
  isLoading: boolean;
  error: string | null;
  sourceLang: string;
  targetLang: string;
  selectedProvider: ProviderType;
  selectedModel: string;
  industry: string; // New field for context
  attachedImage: string | null;
  tempImage: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string | null; // Base64 image
}

export interface ChatSettings {
  temperature: number;
  maxContext: number; // Number of messages to include in history
  maxTurns: number;   // Max turns before forcing new session (optional, mostly for UI limit)
  systemInstruction?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  provider: ProviderType;
  model: string;
  settings: ChatSettings;
}

export interface SearchSource {
  title: string;
  uri: string;
  snippet?: string; // Added snippet for better list view
}

export interface SearchResult {
  text: string;
  sources: SearchSource[];
}

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: ProviderType;
  timestamp: number;
  isFavorite: boolean;
  wasImage: boolean;
}
