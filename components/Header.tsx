
import React from 'react';

interface HeaderProps {
  onHome: () => void;
  title: string;
  syncStatus?: string;
}

const Header: React.FC<HeaderProps> = ({ onHome, title, syncStatus }) => {
  return (
    <header className="bg-emerald-900/90 backdrop-blur-md shadow-lg py-1.5 px-4 sticky top-0 z-50 border-b border-emerald-500/10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 
            onClick={onHome} 
            className="text-base sm:text-lg font-bebas tracking-tight cursor-pointer text-white flex items-center gap-1.5"
          >
            <span className="text-emerald-400">🏏</span> CRICSCORE <span className="text-emerald-400 font-normal">PRO</span>
          </h1>
          {syncStatus && (
            <div className="hidden xs:flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest text-emerald-400/70">
              <div className={`w-1 h-1 rounded-full ${syncStatus.includes('Syncing') ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              {syncStatus.split(':')[0]}
            </div>
          )}
        </div>
        <div className="text-emerald-100/50 text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-[250px]">
          {title}
        </div>
      </div>
    </header>
  );
};

export default Header;
