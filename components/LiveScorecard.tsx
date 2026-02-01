
import React from 'react';
import { Match, BallRecord } from '../types';

interface LiveScorecardProps {
  match: Match;
  onToggleScoreboard: () => void;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ match, onToggleScoreboard }) => {
  const innIdx = (match.currentInnings || 1) - 1;
  const innings = match.innings[innIdx];
  if (!innings) return null;

  const getBallLabel = (b: BallRecord) => {
    if (b.isWicket) return 'W';
    if (b.isExtra) {
      const map: Record<string, string> = { wide: 'Wd', noball: 'Nb', bye: 'By', legbye: 'Lb' };
      return `${b.runs}${map[b.extraType!] || 'E'}`;
    }
    return b.runs.toString();
  };

  const overs = Math.floor(innings.balls / 6);
  const balls = innings.balls % 6;
  const rr = innings.balls > 0 ? (innings.runs / (innings.balls / 6)).toFixed(2) : "0.00";

  // Second innings specific info
  const isSecondInnings = match.currentInnings === 2;
  const target = isSecondInnings ? (match.innings[0]?.runs ?? 0) + 1 : null;
  const runsNeeded = target !== null ? target - innings.runs : null;
  const ballsRemaining = isSecondInnings ? (match.totalOvers * 6) - innings.balls : null;
  const rrr = (runsNeeded !== null && ballsRemaining !== null && ballsRemaining > 0) 
    ? ((runsNeeded / (ballsRemaining / 6))).toFixed(2) 
    : "0.00";

  const batter1 = innings.batsmen.find(b => b.name === innings.currentBatsmenNames[0]);
  const batter2 = innings.batsmen.find(b => b.name === innings.currentBatsmenNames[1]);
  const bowler = innings.bowlers.find(b => b.name === innings.currentBowlerName);

  return (
    <div className="bg-gradient-to-br from-emerald-900/60 to-black/80 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Banner */}
      <div className="px-5 py-4 flex justify-between items-center border-b border-white/5 bg-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-3xl font-bebas text-white leading-none">{innings.runs}/{innings.wickets}</span>
             <span className="text-xs font-bebas text-emerald-400 mt-1">({overs}.{balls} OV)</span>
          </div>
          <div className="flex flex-col">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">{innings.battingTeam} Batting • CRR: {rr}</p>
            {isSecondInnings && target !== null && (
              <p className="text-[8px] font-bold text-amber-400 uppercase tracking-[0.2em] mt-0.5">
                Target: {target} • Need {runsNeeded} from {ballsRemaining} balls (RRR: {rrr})
              </p>
            )}
          </div>
        </div>
        <button onClick={onToggleScoreboard} className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">Card</button>
      </div>

      {/* Crease Stats */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {/* Batting Side */}
        <div className="space-y-2">
           {[batter1, batter2].map((b, i) => (
             <div key={i} className={`flex justify-between items-center ${i === 1 ? 'opacity-40' : ''}`}>
               <span className="text-xs font-bold text-white truncate max-w-[80px]">{b?.name || '--'}{i === 0 ? '*' : ''}</span>
               <span className="text-sm font-bebas text-emerald-400 tracking-wide">{b?.runs || 0}<span className="text-[10px] font-sans ml-1 text-slate-500">({b?.balls || 0})</span></span>
             </div>
           ))}
        </div>

        {/* Bowling Side */}
        <div className="flex flex-col justify-center border-l border-white/5 pl-4">
          <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mb-1">Current Bowler</p>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">{bowler?.name || '--'}</span>
            <span className="text-sm font-bebas text-emerald-400">{bowler?.overs || 0}.{bowler ? (bowler.balls % 6) : 0}-{bowler?.wickets || 0}</span>
          </div>
        </div>
      </div>

      {/* History Reel */}
      <div className="bg-black/40 px-5 py-3 flex items-center gap-4 border-t border-white/5">
        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Recent:</span>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
           {/* CRITICAL: Filter out manual strike swaps so they don't appear as '0' runs */}
           {innings.ballByBall
            .filter(b => !b.manualStrikeRotate)
            .slice(-12)
            .map((b) => (
             <div key={b.ballId} className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border ${b.isWicket ? 'bg-red-600 border-red-400 text-white' : b.runs >= 4 ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
               {getBallLabel(b)}
             </div>
           ))}
           {innings.ballByBall.filter(b => !b.manualStrikeRotate).length === 0 && <span className="text-[8px] text-slate-700 font-bold uppercase">First ball pending...</span>}
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard;
