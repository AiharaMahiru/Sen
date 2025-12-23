import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { Send, Bot, User, Sparkles, Plus, MessageSquare, Trash2, Edit2, Settings, Image as ImageIcon, Thermometer, Box, ChevronDown, Check, Menu, X, Zap, Copy, Square } from 'lucide-react';
import { translationService } from '../services/translationService';
import { ChatMessage, ChatSession, ChatSettings, ProviderType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MODELS, PROVIDERS } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';

// --- Mermaid Utilities ---
const cleanMermaidCode = (code: string) => {
  let cleaned = code
    .replace(/^```mermaid\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim();
    
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\[([^"\[\]\n\r]+?)\]/g, '$1["$2"]');
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\{([^"\{\}\n\r]+?)\}/g, '$1{"$2"}');
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\(([^"()\n\r]+?)\)/g, '$1("$2")');
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\(([^"\[\]\n\r]+?)\]\)/g, '$1(["$2"])');
  cleaned = cleaned.replace(/\("/g, "('").replace(/"\)/g, "')");
  cleaned = cleaned.replace(/"([^"]*?)\n([^"]*?)"/g, (match, p1, p2) => `"${p1} ${p2}"`);
  
  return cleaned;
};

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<boolean>(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!ref.current) return;
      const cleanedChart = cleanMermaidCode(chart);
      try {
        setRenderError(false);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanedChart);
        setSvg(svg);
      } catch (error) {
        setRenderError(true);
      }
    };
    renderChart();
  }, [chart]);

  if (renderError) {
     return <code className="block p-2 text-red-500 bg-red-50 rounded text-xs">Mermaid Error</code>;
  }

  return (
    <div 
      ref={ref} 
      className="flex justify-center my-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const CodeBlock: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const isMermaid = /language-mermaid/.test(className || '');

  if (isMermaid) {
    return <MermaidDiagram chart={String(children)} />;
  }

  const handleCopy = () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#1e1e1e] shadow-sm">
      <div className="flex justify-between items-center px-3 py-1.5 bg-[#2d2d2d] border-b border-gray-700">
        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
          {className?.replace('language-', '') || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
         <code ref={codeRef} className={`${className} text-xs md:text-sm`} style={{ whiteSpace: 'pre-wrap' }}>{children}</code>
      </div>
    </div>
  );
};

// --- Typewriter Hook ---
const useTypewriter = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
};

// --- Helper Components ---
interface MessageBubbleProps { 
  msg: ChatMessage; 
  isLatestAssistant: boolean;
  onDelete: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isLatestAssistant, onDelete }) => {
  const text = isLatestAssistant ? useTypewriter(msg.content, 10) : msg.content;
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
     navigator.clipboard.writeText(msg.content);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`relative group flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-in-top`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${
          msg.role === 'user' 
            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-black' 
            : 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-gray-100 dark:border-gray-700'
        }`}>
          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
       </div>
       <div className={`max-w-[85%] flex flex-col gap-2 relative`}>
          {msg.image && (
             <div className="rounded-xl overflow-hidden max-w-[200px] border border-gray-200 dark:border-gray-700 shadow-sm">
                <img src={msg.image} alt="User upload" className="w-full h-auto" />
             </div>
          )}
          <div className={`p-3 rounded-2xl shadow-sm overflow-hidden ${
             msg.role === 'user' 
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-black rounded-tr-sm text-sm' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm chat-markdown'
          }`}>
             {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
             ) : (
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    components={{
                      code({node, className, children, ...props}) {
                        if (!className && typeof children === 'string' && !children.includes('\n')) {
                          return <code className={className} {...props}>{children}</code>;
                        }
                        return <CodeBlock className={className}>{children}</CodeBlock>;
                      },
                      img: ({node, ...props}) => <img {...props} className="rounded-lg max-w-full my-2" loading="lazy" />,
                      p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                    }}
                >
                    {text}
                </ReactMarkdown>
             )}
          </div>
          
          {/* Action Buttons */}
          <div 
             className={`absolute ${msg.role === 'user' ? 'right-full mr-2' : 'left-full ml-2'} top-2 flex flex-col gap-1 transition-opacity duration-200 ${
               showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
             }`}
          >
             <button 
               onClick={handleCopy}
               className="p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm"
               title="Copy Message"
             >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
             </button>
             <button 
               onClick={() => onDelete(msg.id)}
               className="p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm"
               title="Delete Message"
             >
                <Trash2 className="w-3 h-3" />
             </button>
          </div>
       </div>
    </div>
  );
};

interface ChatPanelProps {
  defaultProvider: ProviderType;
  defaultModel: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ defaultProvider, defaultModel }) => {
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Abort Controller for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Input Area States
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default Settings
  const defaultSettings: ChatSettings = {
     temperature: 0.7,
     maxContext: 10,
     maxTurns: 20
  };

  // --- Effects ---
  useEffect(() => {
    const savedSessions = localStorage.getItem('zen_chat_sessions');
    if (savedSessions) {
       try {
          const parsed = JSON.parse(savedSessions);
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
       } catch (e) {
          console.error("Failed to load chat sessions", e);
       }
    } else {
       createNewSession();
    }

    const handleResize = () => {
       const mobile = window.innerWidth < 1024;
       setIsMobile(mobile);
       if (mobile) setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('zen_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
     if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
  }, [sessions, currentSessionId, isLoading]);

  // --- Helpers ---
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId), 
  [sessions, currentSessionId]);

  const createNewSession = () => {
     const newSession: ChatSession = {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
        updatedAt: Date.now(),
        // Use props for defaults
        provider: defaultProvider,
        model: defaultModel,
        settings: defaultSettings
     };
     setSessions(prev => [newSession, ...prev]);
     setCurrentSessionId(newSession.id);
     if (isMobile) setIsSidebarOpen(false);
  };

  const updateSession = (id: string, updates: Partial<ChatSession>) => {
     setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     setSessions(prev => {
        const filtered = prev.filter(s => s.id !== id);
        if (currentSessionId === id && filtered.length > 0) {
           setCurrentSessionId(filtered[0].id);
        } else if (filtered.length === 0) {
           setCurrentSessionId(null); 
        }
        return filtered;
     });
  };

  const handleRename = (id: string, newTitle: string) => {
     updateSession(id, { title: newTitle });
  };

  const handleDeleteMessage = (msgId: string) => {
      if (!currentSession) return;
      const updatedMessages = currentSession.messages.filter(m => m.id !== msgId);
      updateSession(currentSession.id, { messages: updatedMessages });
  };

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsLoading(false);
      }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading || !currentSession) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      image: attachedImage,
      timestamp: Date.now()
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    updateSession(currentSession.id, { messages: updatedMessages });
    
    if (currentSession.messages.length === 0) {
       const title = input.slice(0, 30) || 'Image Chat';
       updateSession(currentSession.id, { title });
    }

    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    // Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const responseText = await translationService.chat(
         updatedMessages, 
         currentSession.provider, 
         currentSession.model, 
         currentSession.settings,
         controller.signal
      );
      
      const botMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };
      
      updateSession(currentSession.id, { messages: [...updatedMessages, botMsg] });
    } catch (e: any) {
      if (e.name === 'AbortError') {
          // User stopped manually, do not add error message
          return;
      }
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `**Error:** ${e.message}`,
        timestamp: Date.now()
      };
      updateSession(currentSession.id, { messages: [...updatedMessages, errorMsg] });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(file);
     }
  };

  const SessionItem: React.FC<{ session: ChatSession }> = ({ session }) => {
    const isActive = session.id === currentSessionId;
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(session.title);

    return (
       <div 
         onClick={() => { setCurrentSessionId(session.id); if(isMobile) setIsSidebarOpen(false); }}
         className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
            isActive 
              ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-black shadow-md' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
         }`}
       >
          <MessageSquare className="w-4 h-4 shrink-0" />
          
          {isEditing ? (
             <input 
               value={editTitle}
               onChange={(e) => setEditTitle(e.target.value)}
               onBlur={() => { handleRename(session.id, editTitle); setIsEditing(false); }}
               onKeyDown={(e) => { if(e.key === 'Enter') { handleRename(session.id, editTitle); setIsEditing(false); } }}
               autoFocus
               className="flex-1 bg-transparent border-b border-white/50 outline-none text-sm min-w-0"
               onClick={(e) => e.stopPropagation()}
             />
          ) : (
             <span className="flex-1 text-sm font-medium truncate">{session.title}</span>
          )}

          {isActive && !isEditing && (
             <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-black/10"
                >
                   <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="p-1.5 rounded-lg hover:bg-red-500/80 hover:text-white"
                >
                   <Trash2 className="w-3 h-3" />
                </button>
             </div>
          )}
       </div>
    );
  };

  return (
    <div className="flex h-[80vh] w-full max-w-7xl mx-auto bg-white/60 dark:bg-gray-900/40 backdrop-blur-[50px] rounded-[40px] border border-white/60 dark:border-gray-800 shadow-zen overflow-hidden relative">
       <div className="absolute inset-0 rounded-[40px] border border-gray-200/40 dark:border-white/5 pointer-events-none z-50"></div>

       {/* Sidebar */}
       <div 
          className={`absolute lg:relative z-40 h-full bg-white/80 dark:bg-[#151517]/90 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
             // Decreased width from 280px to 220px
             isSidebarOpen ? 'w-[220px] translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full opacity-0 overflow-hidden'
          }`}
       >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
             <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Chats</span>
             <Button variant="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                <X className="w-4 h-4" />
             </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
             <button 
               onClick={createNewSession}
               className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mb-4"
             >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Chat</span>
             </button>
             {sessions.map(s => <SessionItem key={s.id} session={s} />)}
          </div>
       </div>

       {/* Main Area */}
       <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <div className="h-16 border-b border-gray-100/50 dark:border-gray-800 flex items-center px-6 justify-between shrink-0">
             <div className="flex items-center gap-4">
                <Button variant="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                   <Menu className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-purple-500" />
                   <span className="font-bold text-gray-900 dark:text-white">
                      {currentSession?.title || 'AI Chat'}
                   </span>
                </div>
             </div>
             <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-500">
                {currentSession?.provider} / {currentSession?.model}
             </div>
          </div>

          {/* Messages */}
          <div 
             ref={scrollRef}
             className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar scroll-smooth"
          >
             {!currentSession || currentSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center mb-6">
                      <Bot className="w-10 h-10 text-purple-500" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How can I help you?</h3>
                   <p className="text-gray-500 max-w-xs text-center">Configure your model settings below and start chatting.</p>
                </div>
             ) : (
                currentSession.messages.map((msg, idx) => (
                   <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      isLatestAssistant={msg.role === 'assistant' && idx === currentSession.messages.length - 1} 
                      onDelete={handleDeleteMessage}
                   />
                ))
             )}
             {isLoading && (
               <div className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                     <Bot className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                     <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
                     <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-75" />
                     <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-150" />
                  </div>
               </div>
             )}
          </div>

          {/* Input Area */}
          <div className="p-6 pt-2 bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-black/80 dark:via-black/40">
             <div className="flex items-center gap-3 mb-3 px-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-semibold ${
                     attachedImage 
                     ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' 
                     : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                  }`}
                >
                   <ImageIcon className="w-4 h-4" />
                   {attachedImage ? 'Image Attached' : 'Upload'}
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                <div className="relative">
                   <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-semibold ${
                        showSettings 
                        ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                     }`}
                   >
                      <Settings className="w-4 h-4" />
                      <span>Config</span>
                   </button>
                   
                   {showSettings && currentSession && (
                      <div className="absolute bottom-full left-0 mb-3 w-64 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-zoom-in z-50">
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Chat Settings</h4>
                         <div className="space-y-4">
                            <div>
                               <div className="flex justify-between text-xs mb-1">
                                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><Thermometer className="w-3 h-3"/> Temp</span>
                                  <span className="font-mono">{currentSession.settings.temperature}</span>
                               </div>
                               <input 
                                 type="range" min="0" max="1" step="0.1"
                                 value={currentSession.settings.temperature}
                                 onChange={(e) => updateSession(currentSession.id, { 
                                    settings: { ...currentSession.settings, temperature: parseFloat(e.target.value) } 
                                 })}
                                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                               />
                            </div>
                            <div>
                               <div className="flex justify-between text-xs mb-1">
                                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><Box className="w-3 h-3"/> Context</span>
                                  <span className="font-mono">{currentSession.settings.maxContext} msgs</span>
                               </div>
                               <input 
                                 type="range" min="2" max="20" step="2"
                                 value={currentSession.settings.maxContext}
                                 onChange={(e) => updateSession(currentSession.id, { 
                                    settings: { ...currentSession.settings, maxContext: parseInt(e.target.value) } 
                                 })}
                                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                               />
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>

             <div className="relative flex items-end gap-2 bg-white dark:bg-[#151517] p-2 rounded-[28px] border border-gray-200 dark:border-gray-700 shadow-lg focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <div className="relative shrink-0 mb-1 ml-1 group">
                   <button 
                     className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                     onClick={() => {
                        const newProvider = currentSession?.provider === ProviderType.OpenAI ? ProviderType.Gemini : ProviderType.OpenAI;
                        const newModel = MODELS[newProvider][0].id;
                        if(currentSession) updateSession(currentSession.id, { provider: newProvider, model: newModel });
                     }}
                     title="Switch Model"
                   >
                      {currentSession?.provider === ProviderType.OpenAI ? <Zap className="w-5 h-5 fill-current" /> : <Sparkles className="w-5 h-5" />}
                   </button>
                   <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {currentSession?.provider}
                   </span>
                </div>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                     }
                  }}
                  placeholder="Message AI..."
                  className="flex-1 max-h-[150px] min-h-[44px] py-3 px-2 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none custom-scrollbar"
                  rows={1}
                />
                
                {isLoading ? (
                  <button 
                    onClick={handleStop}
                    className="w-10 h-10 mb-1 mr-1 rounded-full flex items-center justify-center transition-all bg-red-500 text-white hover:bg-red-600 shadow-md transform hover:scale-105"
                    title="Stop Generating"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSend}
                    disabled={(!input.trim() && !attachedImage)}
                    className={`w-10 h-10 mb-1 mr-1 rounded-full flex items-center justify-center transition-all ${
                       input.trim() || attachedImage
                       ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md transform hover:scale-105' 
                       : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                )}
             </div>
             
             <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">
                   {currentSession?.model} • {currentSession?.settings.temperature} Temp • {currentSession?.settings.maxContext} Context
                </span>
             </div>
          </div>
       </div>
    </div>
  );
};