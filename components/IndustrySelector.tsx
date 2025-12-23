
import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronDown, Check } from 'lucide-react';
import { INDUSTRIES } from '../constants';

interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  align?: 'left' | 'right';
}

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({ 
  value, 
  onChange,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (industry: string) => {
    onChange(industry);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChange(customInput.trim());
      setIsOpen(false);
      setCustomInput('');
    }
  };

  return (
    <div className="relative z-30" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600/50 group"
        title="Select Translation Context"
      >
        <Briefcase className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
          {value || 'General'}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute top-full mt-2 w-64 bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
           <div className="mb-2 px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Select Domain</div>
           
           <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar mb-2">
             {INDUSTRIES.map((ind) => (
               <button
                 key={ind}
                 onClick={() => handlePresetClick(ind)}
                 className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                   value === ind 
                     ? 'bg-black dark:bg-white text-white dark:text-black font-medium' 
                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                 }`}
               >
                 <span>{ind}</span>
                 {value === ind && <Check className="w-3 h-3" />}
               </button>
             ))}
           </div>

           <div className="border-t border-gray-200 dark:border-gray-700 pt-2 px-1">
             <form onSubmit={handleCustomSubmit} className="relative">
               <input
                 type="text"
                 placeholder="Custom context..."
                 value={customInput}
                 onChange={(e) => setCustomInput(e.target.value)}
                 className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-3 pr-8 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
               />
               <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                 <Check className="w-3.5 h-3.5" />
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};
