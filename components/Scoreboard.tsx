
import React, { useState } from 'react';
import { Match, Innings, PlayerStats } from '../types';

interface ScoreboardProps {
  match: Match;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ match }) => {
  const [activeTab, setActiveTab] = useState<number>(match.currentInnings === 2 ? 1 : 0);

  const formatDismissal = (p: PlayerStats) => {
    if (!p.out) return 'not out';
    const type = p.dismissal || 'out';
    if (type === 'Caught') return `c ${p.fielder} b ${p.bowler}`;
    if (type === 'Bowled') return `b ${p.bowler}`;
    if (type === 'LBW') return `lbw b ${p.bowler}`;
    if (type === 'Run Out') return `run out (${p.fielder})`;
    if (type === 'Stumped') return `st ${p.fielder} b ${p.bowler}`;
    return `${type} b ${p.bowler}`;
  };

  const renderTable = (innIdx: number) => {
    const inn = match.innings[innIdx];
    if (!inn) return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-700 py-12 px-6 bg-black/10 rounded-3xl border border-dashed border-white/5 m-2">
        <span className="text-3xl mb-4 opacity-50">🏟️</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center leading-relaxed">Waiting for {innIdx === 1 ? 'Second' : 'First'} Innings to Start</p>
      </div>
    );

    return (
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        {/* Innings Meta */}
        <div className="bg-emerald-950/20 px-4 py-3 rounded-2xl flex justify-between items-center border border-emerald-500/10 mx-1">
           <div className="min-w-0">
              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-1">Batting Performance</p>
              <h3 className="text-lg font-bebas text-white tracking-wide truncate">{inn.battingTeam}</h3>
           </div>
           <div className="text-right shrink-0">
              <p className="text-2xl font-bebas text-emerald-400 leading-none">{inn.runs}-{inn.wickets}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tight">({Math.floor(inn.balls/6)}.{inn.balls%6} Overs)</p>
           </div>
        </div>

        {/* Tables Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
          <div className="space-y-3">
             <h4 className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.4em] px-1">Batting Card</h4>
             <table className="w-full text-left text-[11px]">
               <thead className="text-slate-500 border-b border-white/5">
                 <tr>
                   <th className="py-2 font-bold uppercase text-[8px] tracking-widest">Batter</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">R</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">B</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">4s</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">6s</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {inn.batsmen.map((p, i) => (
                   <tr key={i} className={inn.currentBatsmenNames.includes(p.name) ? 'bg-emerald-500/5' : ''}>
                     <td className="py-3 pr-2">
                       <p className={`font-bold truncate max-w-[140px] ${p.out ? 'text-slate-500' : 'text-white'}`}>
                         {p.name}{inn.currentBatsmenNames.includes(p.name) ? '*' : ''}
                       </p>
                       <p className="text-[7px] text-slate-600 font-bold uppercase mt-1 tracking-tight">{formatDismissal(p)}</p>
                     </td>
                     <td className="py-3 text-right font-bebas text-lg text-emerald-400">{p.runs}</td>
                     <td className="py-3 text-right text-slate-400">{p.balls}</td>
                     <td className="py-3 text-right text-slate-600">{p.fours}</td>
                     <td className="py-3 text-right text-slate-600">{p.sixes}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

          <div className="space-y-3">
             <h4 className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.4em] px-1">Bowling Card</h4>
             <table className="w-full text-left text-[11px]">
               <thead className="text-slate-500 border-b border-white/5">
                 <tr>
                   <th className="py-2 font-bold uppercase text-[8px] tracking-widest">Bowler</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">O</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">R</th>
                   <th className="py-2 text-right uppercase text-[8px] tracking-widest">W</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {inn.bowlers.map((p, i) => (
                   <tr key={i} className={inn.currentBowlerName === p.name ? 'bg-emerald-500/5' : ''}>
                     <td className="py-3 font-bold text-slate-300 truncate max-w-[140px]">{p.name}</td>
                     <td className="py-3 text-right text-slate-500">{p.overs}.{p.balls%6}</td>
                     <td className="py-3 text-right font-bebas text-lg text-emerald-400">{p.runs}</td>
                     <td className="py-3 text-right font-bebas text-lg text-white">{p.wickets}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="h-6"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-[2rem] border border-white/10 p-3 flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-2xl mb-4 shrink-0 border border-white/5">
        <button 
          onClick={() => setActiveTab(0)}
          className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' : 'text-slate-500 hover:bg-white/5'}`}
        >
          {match.team1}
        </button>
        <button 
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' : 'text-slate-500 hover:bg-white/5'}`}
        >
          {match.team2}
        </button>
      </div>

      <div className="flex-1 overflow-hidden h-full">
        {renderTable(activeTab)}
      </div>
    </div>
  );
};

export default Scoreboard;
