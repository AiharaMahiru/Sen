
import { ApiConfig, ModelConfig, ProviderType } from './types';

export const API_CONFIG: ApiConfig = {
  deeplxEndpoint: "https://api.deeplx.org/translate",
  openaiBaseUrl: "https://api.openai.com/v1",
  openaiKey: "", // User must provide
  geminiBaseUrl: "", // Defaults to standard Google API
  geminiKey: "", // User must provide or comes from process.env
  tavilyKey: "",
  braveKey: ""
};

export const PROVIDERS = [
  { type: ProviderType.DeepLX, label: 'DeepLX' },
  { type: ProviderType.OpenAI, label: 'OpenAI' },
  { type: ProviderType.Gemini, label: 'Gemini' },
];

export const MODELS: Record<ProviderType, ModelConfig[]> = {
  [ProviderType.DeepLX]: [
    { id: 'deeplx', name: 'Standard', supportsImage: false },
  ],
  [ProviderType.OpenAI]: [
    { id: 'gpt-4o', name: 'GPT-4o', supportsImage: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsImage: true },
  ],
  [ProviderType.Gemini]: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', supportsImage: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', supportsImage: true },
  ],
};

export const LANGUAGES = [
  { code: 'ZH', name: 'Chinese (Simplified)' },
  { code: 'EN', name: 'English' },
  { code: 'JA', name: 'Japanese' },
  { code: 'KO', name: 'Korean' },
  { code: 'FR', name: 'French' },
  { code: 'DE', name: 'German' },
  { code: 'ES', name: 'Spanish' },
  { code: 'RU', name: 'Russian' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'IT', name: 'Italian' },
  { code: 'NL', name: 'Dutch' },
  { code: 'PL', name: 'Polish' },
  { code: 'TR', name: 'Turkish' },
  { code: 'AR', name: 'Arabic' },
  { code: 'HI', name: 'Hindi' },
  { code: 'VI', name: 'Vietnamese' },
  { code: 'TH', name: 'Thai' },
  { code: 'ID', name: 'Indonesian' },
];

export const INDUSTRIES = [
  "General",
  "IT & Software",
  "Finance & Business",
  "Legal & Contracts",
  "Medical & Pharma",
  "Academic & Science",
  "Marketing & Ads",
  "Literature & Art",
  "Gaming",
  "Engineering"
];
