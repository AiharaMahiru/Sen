
import { API_CONFIG as DEFAULT_API_CONFIG } from '../constants';
import { ChatMessage, SearchResult, SearchSource, ChatSettings, ProviderType, ApiConfig } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createWorker } from 'tesseract.js';

// Mutable configuration state
let activeConfig: ApiConfig = { ...DEFAULT_API_CONFIG };

// Lazy initialization
let aiInstance: GoogleGenAI | null = null;

export const updateServiceConfig = (newConfig: ApiConfig) => {
  activeConfig = { ...newConfig };
  // Reset Gemini instance to force recreation with new key on next call
  aiInstance = null;
};

const getAiClient = () => {
  if (!aiInstance) {
    // Prefer config key, fallback to process.env if available (usually empty in browser client-side unless built-in)
    const key = activeConfig.geminiKey || process.env.API_KEY;
    if (!key) {
      console.warn("Gemini API Key is missing.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey: key
    });
  }
  return aiInstance;
};

interface TranslateParams {
  text: string;
  sourceLang: string;
  targetLang: string;
  imageBase64: string | null;
  model: string;
  industry?: string;
}

// --- Robust Fetch Helper ---
async function safeFetch(url: string, options?: RequestInit): Promise<{ ok: boolean, status: number, data: any, text: string }> {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    let data = null;
    try {
      if (text) data = JSON.parse(text);
    } catch (e) {
      // JSON parse failed, but we have text
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      text
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.warn(`Fetch error for ${url}:`, error);
    return { ok: false, status: 0, data: null, text: '' };
  }
}

// --- OCR Helper for DeepLX ---
const getTesseractLang = (code: string) => {
  const map: Record<string, string> = {
    'ZH': 'chi_sim',
    'EN': 'eng',
    'JA': 'jpn',
    'KO': 'kor',
    'FR': 'fra',
    'DE': 'deu',
    'ES': 'spa',
    'RU': 'rus',
    'PT': 'por',
    'IT': 'ita',
    'NL': 'nld',
    'PL': 'pol',
    'TR': 'tur',
    'AR': 'ara',
    'HI': 'hin',
    'VI': 'vie',
    'TH': 'tha',
    'ID': 'ind',
    'auto': 'eng' // Fallback for auto
  };
  return map[code] || 'eng';
};

async function performOCR(imageBase64: string, lang: string): Promise<string> {
  const tesseractLang = getTesseractLang(lang);
  try {
    const worker = await createWorker(tesseractLang);
    const ret = await worker.recognize(imageBase64);
    await worker.terminate();
    return ret.data.text;
  } catch (e: any) {
    console.error("OCR Failed:", e);
    throw new Error("Failed to extract text from image. " + e.message);
  }
}

/**
 * DeepLX Translation
 */
async function translateDeepLX({ text, sourceLang, targetLang }: TranslateParams): Promise<string> {
  const endpoint = activeConfig.deeplxEndpoint;
  if (!endpoint) throw new Error("DeepLX Endpoint is not configured.");

  const result = await safeFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source_lang: sourceLang === 'auto' ? 'auto' : sourceLang,
      target_lang: targetLang,
    }),
  });

  if (!result.ok) throw new Error(`DeepLX Error: ${result.status}`);
  if (!result.data) throw new Error("DeepLX returned invalid JSON");
  
  if (result.data.code !== 200) throw new Error(`DeepLX API Error: ${result.data.message || 'Unknown'}`);
  return result.data.data;
}

/**
 * OpenAI Universal Chat Completion
 */
async function openAICompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: any[],
  temperature: number = 0.5,
  signal?: AbortSignal
): Promise<any> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/chat/completions`;

  const body: any = { model, messages, temperature };

  const result = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: signal
  });

  if (!result.ok) {
    throw new Error(`API Error ${result.status}: ${result.text}`);
  }
  
  if (!result.data) throw new Error("API returned empty or invalid JSON response");
  
  return result.data;
}

async function translateOpenAI({ text, targetLang, imageBase64, model, industry }: TranslateParams): Promise<string> {
  if (!activeConfig.openaiKey) throw new Error("OpenAI API Key is missing.");

  const context = industry && industry !== 'General' 
    ? `You are an expert translator specializing in the "${industry}" field. Ensure terminology is accurate for this domain.` 
    : `You are a professional translator.`;

  const messages: any[] = [
    { role: "system", content: `${context} Translate to ${targetLang}. Output exclusively in Markdown format. If the content contains tables, paragraphs, or lists, strictly preserve the structure using Markdown syntax. Do NOT use markdown code blocks for the entire output unless it is code.` }
  ];
  const userContent: any[] = [{ type: "text", text: text || " " }];
  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }
    });
  }
  messages.push({ role: "user", content: userContent });

  try {
    const data = await openAICompletion(
        activeConfig.openaiBaseUrl, 
        activeConfig.openaiKey, 
        model, 
        messages, 
        0.3
    );
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (e: any) {
    throw new Error(e.message || "OpenAI translation failed");
  }
}

async function translateGemini({ text, targetLang, imageBase64, model, industry }: TranslateParams): Promise<string> {
  const context = industry && industry !== 'General' 
    ? `You are an expert translator specializing in the "${industry}" field. Ensure terminology is accurate for this domain.` 
    : `You are a professional translator.`;
  
  const systemInstruction = `${context} Translate the following content to ${targetLang}.
  1. Output exclusively in Markdown format.
  2. If the input (text or image) contains tables, recreate them exactly as Markdown tables.
  3. Preserve headings, lists, and bolding using Markdown.
  4. Do NOT wrap the entire response in a markdown code block (e.g., \`\`\`markdown). Just return the raw markdown content.`;

  const contents: any = { parts: [] };
  
  if (imageBase64) {
    const match = imageBase64.match(/^data:(.*?);base64,(.*)$/);
    const mimeType = match ? match[1] : 'image/png';
    const data = match ? match[2] : imageBase64;

    contents.parts.push({
        inlineData: {
            mimeType: mimeType,
            data: data
        }
    });
  }

  if (text) {
    contents.parts.push({ text: text });
  } else if (!imageBase64) {
    contents.parts.push({ text: " " });
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });
    return response.text || "";
  } catch (e: any) {
    console.error("Gemini Error:", e);
    throw new Error(e.message || "Gemini translation failed");
  }
}

/**
 * Helper: Fetch from Wikipedia API (Free & CORS friendly)
 */
async function fetchWikipedia(query: string): Promise<{ title: string; uri: string; content: string } | null> {
  try {
    const isChinese = /[\u4e00-\u9fa5]/.test(query);
    const lang = isChinese ? 'zh' : 'en';
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;

    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      origin: '*',
      srlimit: '1'
    });

    const searchRes = await safeFetch(`${endpoint}?${searchParams.toString()}`);
    if (!searchRes.ok || !searchRes.data?.query?.search?.length) return null;

    const page = searchRes.data.query.search[0];
    const pageId = page.pageid;

    const contentParams = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      pageids: pageId.toString(),
      explaintext: 'true',
      exintro: 'true',
      format: 'json',
      origin: '*'
    });

    const contentRes = await safeFetch(`${endpoint}?${contentParams.toString()}`);
    if (!contentRes.ok || !contentRes.data) return null;
    
    const extract = contentRes.data.query?.pages?.[pageId]?.extract;

    if (!extract) return null;

    return {
      title: page.title + " (Wikipedia)",
      uri: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      content: extract.slice(0, 1500)
    };

  } catch (e) {
    console.warn("Wikipedia fetch failed", e);
    return null;
  }
}

/**
 * Helper: Fetch from Tavily API
 */
async function fetchTavily(query: string): Promise<SearchSource[]> {
  if (!activeConfig.tavilyKey) return [];
  try {
    const result = await safeFetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: activeConfig.tavilyKey,
        query: query,
        search_depth: "basic",
        include_answer: false,
        max_results: 3
      })
    });
    
    if (!result.ok || !result.data) return [];
    
    return (result.data.results || []).map((r: any) => ({
      title: r.title,
      uri: r.url,
      snippet: r.content
    }));
  } catch (e) {
    console.warn("Tavily fetch failed", e);
    return [];
  }
}

/**
 * Helper: Fetch from Brave Search API
 */
async function fetchBrave(query: string): Promise<SearchSource[]> {
  if (!activeConfig.braveKey) return [];
  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.append("q", query);
    url.searchParams.append("count", "3");
    
    const result = await safeFetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": activeConfig.braveKey
      }
    });

    if (!result.ok) {
       return [];
    }

    if (!result.data) return [];
    
    return (result.data.web?.results || []).map((r: any) => ({
      title: r.title,
      uri: r.url,
      snippet: r.description
    }));
  } catch (e) {
    return [];
  }
}

export const translationService = {
  // Expose updater
  setConfig: updateServiceConfig,

  translate: async (provider: string, params: TranslateParams) => {
    // Handling DeepLX with Image (Needs OCR)
    if (provider === 'DeepLX') {
      let textToTranslate = params.text;
      
      // If image is attached, perform OCR first
      if (params.imageBase64 && !textToTranslate) {
         textToTranslate = await performOCR(params.imageBase64, params.sourceLang);
      }
      
      // If still empty (e.g. OCR failed or no input)
      if (!textToTranslate.trim()) {
         return "";
      }

      return translateDeepLX({ ...params, text: textToTranslate });
    }

    switch (provider) {
      case 'OpenAI': return translateOpenAI(params);
      case 'Gemini': return translateGemini(params);
      default: throw new Error(`Unknown provider: ${provider}`);
    }
  },

  chat: async (
    messages: ChatMessage[], 
    provider: ProviderType, 
    model: string, 
    settings: ChatSettings,
    signal?: AbortSignal
  ): Promise<string> => {
    
    // Apply Max Context Window
    const contextMessages = messages.slice(-settings.maxContext);
    
    // Optimized System Instruction
    const systemInstruction = settings.systemInstruction || 
    `You are an advanced AI assistant tailored for developers and professionals.
    
    STRICT OUTPUT RULES:
    1. **Markdown**: Use rigorous Markdown formatting. Headers, lists, bolding.
    2. **Code**: Always wrap code in triple backticks with the correct language identifier (e.g., \`\`\`python).
    3. **Diagrams**: Use Mermaid.js for all flowcharts, sequence diagrams, and class diagrams.
       - Use \`\`\`mermaid\` code blocks.
       - Prefer \`flowchart TD\` or \`sequenceDiagram\`.
       - Quote all node labels to prevent syntax errors (e.g., A["Label"]).
    4. **Math**: Use LaTeX for mathematical formulas. Inline: $...$, Block: $$...$$.
    5. **Tables**: Use Markdown tables for structured data.
    
    Be concise, accurate, and aesthetically pleasing in your output.`;

    if (provider === ProviderType.Gemini) {
        // Convert to Gemini Format
        const history = contextMessages.slice(0, -1).map(m => {
            const parts: any[] = [];
            if (m.image) {
                const match = m.image.match(/^data:(.*?);base64,(.*)$/);
                if (match) {
                    parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
                }
            }
            parts.push({ text: m.content });
            
            return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: parts
            };
        });

        const lastMessage = contextMessages[contextMessages.length - 1];
        const lastParts: any[] = [];
        if (lastMessage.image) {
             const match = lastMessage.image.match(/^data:(.*?);base64,(.*)$/);
             if (match) {
                 lastParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
             }
        }
        lastParts.push({ text: lastMessage.content });

        try {
            const ai = getAiClient();
            const chat = ai.chats.create({
                model: model,
                history: history,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: settings.temperature,
                },
            });

            const response = await chat.sendMessage({ 
                message: { parts: lastParts } 
            });
            return response.text || "";
        } catch (e: any) {
            console.error("Gemini Chat Error:", e);
            throw new Error(e.message || "Gemini chat failed");
        }
    } 
    else if (provider === ProviderType.OpenAI) {
        if (!activeConfig.openaiKey) throw new Error("OpenAI API Key is missing.");

        const openAIMessages = [
            { role: "system", content: systemInstruction },
            ...contextMessages.map(m => {
                if (m.image) {
                     return {
                         role: m.role,
                         content: [
                             { type: "text", text: m.content },
                             { type: "image_url", image_url: { url: m.image } }
                         ]
                     };
                }
                return { role: m.role, content: m.content };
            })
        ];

        try {
            const data = await openAICompletion(
                activeConfig.openaiBaseUrl, 
                activeConfig.openaiKey, 
                model, 
                openAIMessages, 
                settings.temperature,
                signal
            );
            return data.choices?.[0]?.message?.content?.trim() || "";
        } catch (e: any) {
            if (e.name === 'AbortError') throw e;
            console.error("OpenAI Chat Error:", e);
            throw new Error(e.message || "OpenAI chat failed");
        }
    }

    throw new Error(`Provider ${provider} not supported for chat yet.`);
  },

  search: async (query: string, model: string = 'gemini-2.5-flash'): Promise<SearchResult> => {
    try {
      const [wikiResult, tavilyResult, braveResult] = await Promise.allSettled([
        fetchWikipedia(query),
        fetchTavily(query),
        fetchBrave(query)
      ]);
      
      const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value : null;
      const tavilyData = tavilyResult.status === 'fulfilled' ? tavilyResult.value : [];
      const braveData = braveResult.status === 'fulfilled' ? braveResult.value : [];

      const ai = getAiClient();
      
      let systemInstruction = `You are a sophisticated, full-featured search assistant.
      CORE INSTRUCTIONS:
      1. Synthesize findings into a clear, structured Markdown report.
      2. Citations: When citing a source, include the URL in Markdown format like [Source Name](URL).
      RICH CONTENT RENDERING RULES:
      1. Diagrams: Use Mermaid with strict quoting rules.
      2. Code: Proper Markdown blocks.
      3. Math: LaTeX.
      4. Tables: Markdown tables.
      `;

      if (wikiData) {
        systemInstruction += `\n\nAdditional Verified Context from Wikipedia: "${wikiData.content}"`;
      }
      if (tavilyData.length > 0) {
        systemInstruction += `\n\nAdditional Context from Tavily: ${tavilyData.map(d => `[${d.title}](${d.uri}): ${d.snippet}`).join('\n')}`;
      }
      if (braveData.length > 0) {
        systemInstruction += `\n\nAdditional Context from Brave: ${braveData.map(d => `[${d.title}](${d.uri}): ${d.snippet}`).join('\n')}`;
      }

      const response = await ai.models.generateContent({
        model: model, // Use dynamic model
        contents: query,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "No result found.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      let rawSources: SearchSource[] = groundingChunks
        .map((chunk: any) => {
           if (chunk.web?.uri && chunk.web?.title) {
             return { title: chunk.web.title, uri: chunk.web.uri, snippet: '' };
           }
           return null;
        })
        .filter((s: any) => s !== null);

      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(text)) !== null) {
        rawSources.push({ title: match[1], uri: match[2] });
      }

      if (wikiData) rawSources.unshift({ title: wikiData.title, uri: wikiData.uri });
      tavilyData.forEach(s => rawSources.push(s));
      braveData.forEach(s => rawSources.push(s));

      const cleanSources: SearchSource[] = [];
      const seenUris = new Set();

      rawSources.forEach((s: any) => {
        const uri = s.uri.split('#')[0];
        if (uri && !uri.includes('vertexaisearch') && !seenUris.has(uri)) {
          seenUris.add(uri);
          cleanSources.push(s);
        }
      });

      return { text, sources: cleanSources };

    } catch (e: any) {
       console.error("Search Error:", e);
       return { 
         text: `**Search Unavailable**: ${e.message}`, 
         sources: [] 
       };
    }
  },

  summarizePage: async (url: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: model,
        contents: `Please visit and summarize this page: ${url}`,
        config: {
            tools: [{ googleSearch: {} }], 
            systemInstruction: `You are a web summarizer. Output in structured Markdown.`,
        }
      });
      return response.text || "Could not summarize page.";
    } catch (e: any) {
      console.error("Summarize Page Error:", e);
      return "Failed to summarize page: " + e.message;
    }
  }
};