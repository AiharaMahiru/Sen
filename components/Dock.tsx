
import React, { useState } from 'react';
import { AppView } from '../types';
import { Search, MessageSquare, Languages, Image as ImageIcon, Github, Moon, Sun, Eraser, Clock, Settings as SettingsIcon } from 'lucide-react';

interface DockProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onImageTranslateClick: () => void;
  onHistoryClick: () => void;
  onClearClick: () => void;
  onThemeToggle: () => void;
  isDark: boolean;
}

export const Dock: React.FC<DockProps> = ({
  currentView,
  onChangeView,
  onImageTranslateClick,
  onHistoryClick,
  onClearClick,
  onThemeToggle,
  isDark
}) => {
  const [hoveredTranslate, setHoveredTranslate] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      
      {/* Dock Container */}
      <div 
        className="flex items-center gap-1 px-2 py-2 h-auto box-content
                   bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl
                   border border-gray-200/50 dark:border-gray-800
                   rounded-full shadow-2xl transition-all"
      >
        <DockItem 
           icon={<Search strokeWidth={2} size={20} />} 
           isActive={currentView === AppView.Search} 
           onClick={() => onChangeView(AppView.Search)}
        />
        
        <DockItem 
           icon={<MessageSquare strokeWidth={2} size={20} />} 
           isActive={currentView === AppView.Chat} 
           onClick={() => onChangeView(AppView.Chat)}
        />

        {/* Separator */}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

        {/* Translate Group */}
        <div 
          className="relative flex flex-col items-center justify-end"
          onMouseEnter={() => setHoveredTranslate(true)}
          onMouseLeave={() => setHoveredTranslate(false)}
        >
           {/* Sub Menu */}
           <div 
             className={`absolute bottom-full left-1/2 -translate-x-1/2 pb-3 flex flex-col-reverse gap-2 transition-all duration-200 ${
               hoveredTranslate 
                 ? 'opacity-100 translate-y-0 scale-100' 
                 : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
             }`}
           >
              <SubMenuItem icon={<Eraser size={16} />} onClick={(e) => { e.stopPropagation(); onClearClick(); }} isDanger />
              <SubMenuItem icon={<Clock size={16} />} onClick={(e) => { e.stopPropagation(); onHistoryClick(); }} />
              <SubMenuItem icon={<ImageIcon size={16} />} onClick={(e) => { e.stopPropagation(); onImageTranslateClick(); }} />
           </div>

           <DockItem 
             icon={<Languages strokeWidth={2} size={20} />} 
             isActive={currentView === AppView.Translate || currentView === AppView.ImageTranslate} 
             onClick={() => onChangeView(AppView.Translate)}
           />
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

        <DockItem 
           icon={<SettingsIcon strokeWidth={2} size={20} />} 
           isActive={currentView === AppView.Settings} 
           onClick={() => onChangeView(AppView.Settings)}
        />

        {/* Theme Toggle (Optional kept as quick action, or can be removed if strictly in settings) */}
        {/* We keep it for convenience as requested in previous prompt to allow quick toggle, 
            but settings panel also has it. */}
        <DockItem 
           icon={isDark ? <Sun strokeWidth={2} size={20} /> : <Moon strokeWidth={2} size={20} />} 
           isActive={false} 
           onClick={onThemeToggle}
        />

      </div>
    </div>
  );
};

// --- Sub Components ---

interface DockItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const DockItem: React.FC<DockItemProps> = ({ icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
        }
      `}
    >
      {icon}
    </button>
  );
};

interface SubMenuItemProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  isDanger?: boolean;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ icon, onClick, isDanger }) => {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-sm transition-all duration-200 hover:scale-110 active:scale-95
        ${isDanger 
           ? 'bg-red-50/90 dark:bg-red-900/60 border-red-200/50 dark:border-red-500/30 text-red-500 dark:text-red-400' 
           : 'bg-white/90 dark:bg-[#2C2C2E]/90 border-gray-200/50 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
        }
      `}
    >
      {icon}
    </button>
  );
};
