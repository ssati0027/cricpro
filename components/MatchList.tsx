
import React from 'react';
import { Match } from '../types';

interface MatchListProps {
  matches: Match[];
  onSelect: (id: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onSelect }) => {
  if (matches.length === 0) {
    return (
      <div className="text-center py-20 bg-black/20 rounded-[2rem] border-2 border-dashed border-white/5">
        <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">No Matches Found</p>
      </div>
    );
  }

  // Sort by ID or status to show live matches first
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 gap-3 pb-8">
      {sortedMatches.map(match => {
        const inn1 = match.innings[0];
        const inn2 = match.innings[1];
        
        if (!inn1) return null;

        return (
          <div 
            key={match.id}
            onClick={() => onSelect(match.id)}
            className="group bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 hover:border-emerald-500/40 cursor-pointer transition-all active:scale-[0.98] shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${match.status === 'live' ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                {match.status}
              </span>
              <span className="text-[9px] text-slate-600 font-bold">MATCH ID: {String(match.id).slice(-6)}</span>
            </div>
            
            <div className="flex justify-between items-end gap-4">
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl tracking-tight group-hover:text-emerald-400 transition-colors text-white">{match.team1}</span>
                  <div className="text-right">
                    <span className="text-2xl font-bebas text-white">{inn1.runs}/{inn1.wickets}</span>
                    <span className="text-[9px] text-slate-500 font-bold ml-2">({Math.floor(inn1.balls/6)}.{inn1.balls%6})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl tracking-tight text-slate-300 group-hover:text-emerald-300 transition-colors">{match.team2}</span>
                  <div className="text-right">
                    {inn2 ? (
                      <>
                        <span className="text-2xl font-bebas text-white">{inn2.runs}/{inn2.wickets}</span>
                        <span className="text-[9px] text-slate-500 font-bold ml-2">({Math.floor(inn2.balls/6)}.{inn2.balls%6})</span>
                      </>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Yet to bat</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchList;
