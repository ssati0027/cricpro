
import React, { useState } from 'react';

interface PlayerModalProps {
  type: 'batsman' | 'bowler';
  existingPlayers: string[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ type, existingPlayers, onSelect, onClose }) => {
  const [newName, setNewName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 px-4 py-3 flex justify-between items-center border-b border-white/5">
          <div>
            <h3 className="text-base font-bebas text-emerald-400 tracking-wider uppercase leading-none">Select {type}</h3>
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-1">Squad selection</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">×</button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* New Entry Input */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Add New Player</label>
            <div className="flex gap-2">
              <input 
                autoFocus
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="flex-1 bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-white placeholder-slate-700"
                placeholder={`Type ${type} name...`}
                onKeyDown={(e) => { if(e.key === 'Enter' && newName.trim()) onSelect(newName.trim()); }}
              />
              <button 
                disabled={!newName.trim()}
                onClick={() => { if(newName.trim()) onSelect(newName.trim()); }}
                className="bg-emerald-600 disabled:opacity-50 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing Players Grid */}
          {existingPlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Select From Team</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {existingPlayers.map(p => (
                  <button 
                    key={p} 
                    onClick={() => onSelect(p)}
                    className="bg-slate-800/40 border border-white/5 py-2 px-2.5 rounded-lg text-[9px] font-bold text-slate-300 hover:bg-emerald-600/20 hover:border-emerald-500 hover:text-emerald-400 transition-all text-left truncate"
                  >
                    • {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-slate-800 border border-white/5 rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
