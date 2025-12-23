
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Search, Globe, Sparkles, X, RotateCcw, Monitor, FileText, ArrowRight, ArrowUpRight, ExternalLink, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { translationService } from '../services/translationService';
import { SearchResult } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';

// --- Mermaid Code Cleaner Utility ---
const cleanMermaidCode = (code: string) => {
  let cleaned = code
    // Remove Markdown code block syntax
    .replace(/^```mermaid\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim();
    
  // Strategy: Auto-quote labels for common shapes ([], {}, ()) if they are not already quoted.
  // We use the pattern: NodeID + Bracket + Content + Bracket.
  // We exclude content that already contains quotes to avoid double-quoting or breaking syntax.

  // 1. Square brackets [text] -> ["text"]
  // Matches: id[text] or id [text]
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\[([^"\[\]\n\r]+?)\]/g, '$1["$2"]');
  
  // 2. Rhombus {text} -> {"text"} (Fixes the specific error reported)
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\{([^"\{\}\n\r]+?)\}/g, '$1{"$2"}');
  
  // 3. Round (text) -> ("text")
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\(([^"()\n\r]+?)\)/g, '$1("$2")');
  
  // 4. Stadium ([text]) -> (["text"])
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*\(([^"\[\]\n\r]+?)\]\)/g, '$1(["$2"])');

  // 5. Fix: Nested quotes inside function calls like e("t") -> e('t')
  // Replaces (" with (' and ") with ')
  cleaned = cleaned.replace(/\("/g, "('").replace(/"\)/g, "')");

  // 6. Fix: Newlines inside quoted strings breaking parsing.
  cleaned = cleaned.replace(/"([^"]*?)\n([^"]*?)"/g, (match, p1, p2) => {
     return `"${p1} ${p2}"`;
  });
  
  return cleaned;
};

// --- Mermaid Component ---
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
        console.error('Mermaid rendering failed:', error);
        setRenderError(true);
      }
    };
    renderChart();
  }, [chart]);

  if (renderError) {
     return (
        <div className="my-6 rounded-xl overflow-hidden border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
           <div className="px-4 py-2 border-b border-red-100 dark:border-red-800/50 flex justify-between items-center">
              <span className="text-xs font-bold text-red-500">Diagram Error</span>
           </div>
           <pre className="p-4 text-xs font-mono text-red-600/80 dark:text-red-400/80 overflow-x-auto whitespace-pre-wrap">
              {chart}
           </pre>
        </div>
     );
  }

  return (
    <div 
      ref={ref} 
      className="flex justify-center my-8 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// --- Copyable Code Block Component ---
const CodeBlock: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  
  // Check if it's mermaid
  const isMermaid = /language-mermaid/.test(className || '');

  // For mermaid, children is typically the raw text because highlight.js doesn't highlight it
  if (isMermaid) {
    return <MermaidDiagram chart={String(children)} />;
  }

  const handleCopy = () => {
    if (codeRef.current) {
      // Get the plain text content from the rendered DOM node
      // This works even if children are syntax-highlighted React elements
      const text = codeRef.current.textContent || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#1e1e1e] shadow-lg">
      <div className="flex justify-between items-center px-4 py-3 bg-[#2d2d2d] border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 font-bold tracking-wider uppercase">
          {className?.replace('language-', '') || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-6 overflow-x-auto custom-scrollbar">
         <code ref={codeRef} className={className} style={{ whiteSpace: 'pre-wrap' }}>{children}</code>
      </div>
    </div>
  );
};

interface SearchPanelProps {
  defaultModel: string;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ defaultModel }) => {
  const [query, setQuery] = useState('');
  
  // Data States
  const [result, setResult] = useState<SearchResult | null>(null);
  const [pageSummary, setPageSummary] = useState<string | null>(null);
  
  // UI States
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPageSummary, setLoadingPageSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Navigation State
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<'summary' | 'browser' | 'page-ai'>('summary');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // Reset States
    setLoadingSearch(true);
    setError(null);
    setHasSearched(true);
    setResult(null);
    setActiveUrl(null);
    setRightPanelMode('summary');
    setPageSummary(null);

    try {
      // Use the default model passed from props
      const data = await translationService.search(query, defaultModel);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUrlClick = (url: string) => {
    setActiveUrl(url);
    setRightPanelMode('browser');
    setPageSummary(null);
    if (isExpanded) setIsExpanded(false);
  };

  const handleSummarizePage = async () => {
    if (!activeUrl) return;
    setRightPanelMode('page-ai');
    setLoadingPageSummary(true);
    try {
      const summary = await translationService.summarizePage(activeUrl, defaultModel);
      setPageSummary(summary);
    } catch (e: any) {
      setPageSummary("Error summarizing this page. It might be inaccessible.");
    } finally {
      setLoadingPageSummary(false);
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return '';
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'link';
    }
  };

  const externalEngines = [
    { name: 'Baidu', icon: '度', url: (q: string) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`, color: 'hover:bg-blue-600 hover:text-white' },
    { name: 'Quark', icon: '夸', url: (q: string) => `https://quark.sm.cn/s?q=${encodeURIComponent(q)}`, color: 'hover:bg-green-600 hover:text-white' },
    { name: 'Zhihu', icon: '知', url: (q: string) => `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(q)}`, color: 'hover:bg-blue-500 hover:text-white' },
    { name: 'Bing', icon: 'Bi', url: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`, color: 'hover:bg-teal-600 hover:text-white' },
  ];

  // --- Render Sections ---

  const renderLeftPanel = () => (
    <div className="h-full flex flex-col bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-800 overflow-hidden">
      {/* 1. AI & Wiki Sources */}
      <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800/50">
        <Globe className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Web Sources</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loadingSearch ? (
          // Skeleton List
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-white/20 dark:border-gray-800 animate-pulse" />
          ))
        ) : result?.sources && result.sources.length > 0 ? (
          result.sources.map((source, idx) => {
            const isActive = activeUrl === source.uri;
            return (
              <button
                key={idx}
                onClick={() => handleUrlClick(source.uri)}
                className={`w-full text-left group flex flex-col p-4 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1C1C1E] dark:bg-white border-[#1C1C1E] dark:border-white shadow-lg transform scale-[1.02] z-10'
                    : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={getFaviconUrl(source.uri)}
                    alt=""
                    className="w-4 h-4 rounded-sm object-contain"
                  />
                  <span className={`text-[10px] font-medium truncate opacity-70 ${
                    isActive ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'
                  }`}>
                    {getDomain(source.uri)}
                  </span>
                </div>
                <div className={`text-sm font-semibold line-clamp-2 leading-snug ${
                  isActive ? 'text-white dark:text-black' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {source.title}
                </div>
              </button>
            );
          })
        ) : (
          !loadingSearch && hasSearched && <div className="text-center text-gray-400 text-sm mt-10">No sources found</div>
        )}
      </div>

      {/* 2. Deep Search (External Engines) */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-white/5">
        <div className="flex items-center gap-2 mb-3">
           <ExternalLink className="w-3 h-3 text-gray-400" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Deep Search On</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
           {externalEngines.map((eng) => (
             <button
               key={eng.name}
               onClick={() => window.open(eng.url(query), '_blank')}
               className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all active:scale-95 group ${eng.color}`}
               title={`Search on ${eng.name}`}
             >
               <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
                 {eng.icon}
               </div>
               <span className="text-[9px] font-medium opacity-70 group-hover:opacity-100">{eng.name}</span>
             </button>
           ))}
        </div>
      </div>
    </div>
  );

  const renderRightPanel = () => {
    // 1. Loading Search (Main)
    if (loadingSearch) {
      return (
        <div className="h-full flex flex-col gap-6 p-8 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
               <Sparkles className="w-4 h-4 text-amber-500" />
             </div>
             <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
             <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
             <div className="h-4 w-11/12 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse delay-75" />
             <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse delay-150" />
             <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse delay-200" />
          </div>
        </div>
      );
    }

    // 2. Browser Mode (Iframe)
    if (rightPanelMode === 'browser' && activeUrl) {
      return (
        <div className="h-full flex flex-col overflow-hidden relative rounded-[32px] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl">
          {/* Browser Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md">
             <div className="flex items-center gap-3 flex-1 overflow-hidden mr-4 bg-white dark:bg-gray-800 py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <Monitor className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-mono">{activeUrl}</span>
             </div>
             <div className="flex items-center gap-2">
                <Button 
                   onClick={handleSummarizePage}
                   className="!py-1.5 !px-3 !text-xs !rounded-lg !bg-purple-600 hover:!bg-purple-700 text-white shadow-md shadow-purple-500/20"
                >
                   <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Summarize
                </Button>
                <button 
                  onClick={() => setRightPanelMode('summary')}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
             </div>
          </div>
          
          {/* Iframe with fallback warning */}
          <div className="flex-1 relative bg-white">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0">
               <p className="mb-2 font-medium">Preview loading...</p>
               <p className="text-xs max-w-xs text-center px-4">Most modern websites block embedding. <br/> If blank, click <b>Summarize</b> to read the content via AI.</p>
               <Button 
                   variant="secondary" 
                   onClick={() => window.open(activeUrl, '_blank')}
                   className="mt-4 !text-xs"
                >
                   <ArrowUpRight className="w-3 h-3 mr-1" /> Open in New Tab
                </Button>
            </div>
            <iframe 
               src={activeUrl} 
               className="absolute inset-0 w-full h-full z-10 bg-transparent"
               sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
               title="Preview"
            />
          </div>
        </div>
      );
    }

    // 3. Specific Page AI Summary
    if (rightPanelMode === 'page-ai') {
      return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl rounded-[32px] border border-white/40 dark:border-gray-800 overflow-hidden relative">
           <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                   <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Page Summary</h3>
                   <p className="text-xs text-gray-500 truncate max-w-[200px] opacity-70">{getDomain(activeUrl || '')}</p>
                 </div>
              </div>
              <button 
                onClick={() => setRightPanelMode('browser')}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              {loadingPageSummary ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 animate-pulse mb-6">
                    <Sparkles className="w-4 h-4" /> Reading page content with Gemini Flash...
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                  <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-p:leading-loose prose-a:text-blue-500 hover:prose-a:text-blue-600">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                  >
                    {pageSummary || "Failed to generate summary."}
                  </ReactMarkdown>
                </div>
              )}
           </div>
        </div>
      );
    }

    // 4. Default: Main Query Summary
    return (
      <div className="h-full flex flex-col">
        {/* Increased padding x to 10 for more breathing room */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-[40px] rounded-[32px] px-10 py-0 border border-white/50 dark:border-gray-800 shadow-sm transition-all relative">
           
           {/* Sticky Header: Adjusted negative margin to match parent padding (-mx-10) for full bleed effect */}
           <div className="sticky top-0 z-30 flex items-center justify-between py-6 mb-2 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-10 px-10 shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Overview</h3>
               </div>
               
               {/* Expand/Collapse Button - Enhanced visibility */}
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="p-2 rounded-xl text-gray-500 dark:text-gray-300 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
                 title={isExpanded ? "Collapse View" : "Expand View"}
               >
                 {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
               </button>
           </div>
           
           <div className="pb-10">
             {error ? (
                <div className="text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">{error}</div>
             ) : result?.text ? (
                <div className="markdown-body">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    components={{
                      code({node, className, children, ...props}) {
                        if (!className && typeof children === 'string' && !children.includes('\n')) {
                          return <code className={className} {...props}>{children}</code>;
                        }
                        return (
                          <CodeBlock className={className}>
                            {children}
                          </CodeBlock>
                        )
                      },
                      pre({ children }) {
                          return <>{children}</>;
                      }
                    }}
                  >
                    {result.text}
                  </ReactMarkdown>
                </div>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm py-20">
                  No summary available.
                </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      hasSearched 
        ? 'justify-start pt-2' 
        : 'justify-center items-center pb-[10vh]'
    }`}>
      
      {/* Search Header */}
      <div className={`w-full flex flex-col items-center transition-all duration-700 z-50 ${
        hasSearched ? 'mb-4' : 'mb-8'
      }`}>
        <div className={`text-center transition-all duration-700 ${hasSearched ? 'h-0 opacity-0 overflow-hidden mb-0' : 'mb-6 opacity-100'}`}>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1C1C1E] dark:text-white mb-2 tracking-tight">
            Axi Search
          </h2>
        </div>

        <div className={`w-full relative group transition-all duration-700 ${hasSearched ? 'max-w-4xl' : 'max-w-2xl scale-100'}`}>
          {/* Glow Effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/40 dark:to-purple-900/40 rounded-[32px] blur-2xl transition-opacity duration-500 ${hasSearched ? 'opacity-20' : 'opacity-40 group-hover:opacity-60'}`}></div>
          
          <div className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-700 shadow-zen flex items-center p-2 transition-all duration-300 ${
            loadingSearch ? 'rounded-[28px] ring-2 ring-blue-500/20' : 'rounded-[32px] focus-within:ring-2 focus-within:ring-blue-500/20'
          }`}>
            <div className="pl-5 text-gray-400 dark:text-gray-500">
               {loadingSearch ? <Sparkles className="w-6 h-6 animate-pulse text-blue-500" /> : <Search className="w-6 h-6" />}
            </div>
            <input 
              ref={searchInputRef}
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasSearched ? "Ask a follow up..." : "Search anything..."}
              className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium"
              autoComplete="off"
            />
            
            {hasSearched && (
              <button onClick={() => { setHasSearched(false); setQuery(''); }} className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <Button 
              onClick={() => handleSearch()} 
              isLoading={loadingSearch}
              className="rounded-[24px] !py-3 !px-5 !bg-[#1C1C1E] dark:!bg-white !text-white dark:!text-black shadow-lg"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Split View) */}
      <div 
        className={`w-full transition-all duration-700 delay-100 flex-1 overflow-hidden ${
          hasSearched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none h-0 hidden'
        }`}
      >
         {/* Replaced Grid with Flexbox to fix "Shrinks to bottom" bug on expansion */}
         <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 h-full pb-24">
            
            {/* Left Panel: Source List */}
            {/* Desktop Only Sidebar with explicit width transition */}
            <div className={`hidden lg:block h-full min-h-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
               ${isExpanded ? 'w-0 opacity-0 overflow-hidden' : 'w-[320px] xl:w-[360px] opacity-100 mr-6'} 
               ${loadingSearch ? 'opacity-50 blur-sm' : ''}
            `}>
               <div className="w-[320px] xl:w-[360px] h-full">
                  {renderLeftPanel()}
               </div>
            </div>

            {/* Right Panel: AI Content / Browser */}
            {/* Desktop: Takes remaining space */}
            <div className="hidden lg:flex h-full min-h-0 flex-1 flex-col min-w-0 transition-all">
               {renderRightPanel()}
            </div>

            {/* Mobile View: Stacked (Always standard) */}
            <div className="lg:hidden h-full flex flex-col w-full gap-4">
               {!activeUrl && (
                  <div className="shrink-0 max-h-[40vh] overflow-hidden">
                    {renderLeftPanel()}
                  </div>
               )}
               <div className="flex-1 min-h-0">
                 {activeUrl ? renderRightPanel() : renderRightPanel()} 
                 {/* Note: logic logic above simplifies showing AI overview by default if no active URL */}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};
