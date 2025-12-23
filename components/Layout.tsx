
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#F9F9FB] dark:bg-[#000000] text-[#1C1C1E] dark:text-white transition-colors duration-300 overflow-hidden flex flex-col">
      {/* 
         Added pt-8 (32px) to create space from the top edge.
         Added pb-28 (112px) to ensure bottom Dock doesn't overlap content and provide visual balance.
      */}
      <div className="flex-1 w-full h-full relative flex flex-col pt-8 pb-28">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-full min-h-0 justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};
