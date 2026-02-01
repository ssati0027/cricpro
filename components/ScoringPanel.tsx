
import React, { useState, useMemo } from 'react';
import { Match, Innings, BallRecord, PlayerStats, BowlerStats } from '../types';
import PlayerModal from './PlayerModal';

interface ScoringPanelProps {
  match: Match;
  onUpdate: (match: Match) => void;
}

const ScoringPanel: React.FC<ScoringPanelProps> = ({ match, onUpdate }) => {
  const [showPlayerModal, setShowPlayerModal] = useState<'batsman' | 'bowler' | null>(null);
  const [showOversModal, setShowOversModal] = useState<boolean>(false);
  const [wicketModal, setWicketModal] = useState<boolean>(false);
  const [extraRunSelector, setExtraRunSelector] = useState<{type: 'wide'|'noball'|'bye'|'legbye'} | null>(null);
  const [attributionModal, setAttributionModal] = useState<{type: any, runs: number} | null>(null);
  const [fielderPrompt, setFielderPrompt] = useState<{type: string, runs?: number} | null>(null);
  const [fielderName, setFielderName] = useState('');
  const [oversInput, setOversInput] = useState(match.totalOvers.toString());

  const innIdx = (match.currentInnings || 1) - 1;
  const currentInnings = match.innings[innIdx];
  if (!currentInnings) return null;

  const availablePlayers = useMemo(() => {
    const teamName = showPlayerModal === 'batsman' ? currentInnings.battingTeam : currentInnings.bowlingTeam;
    const teamPlayerNames = match.allPlayers[teamName] || [];
    
    if (showPlayerModal === 'batsman') {
      const allBattersOut = currentInnings.batsmen.filter(p => p.out).map(p => p.name);
      const currentlyAtCrease = currentInnings.currentBatsmenNames;
      return teamPlayerNames.filter(name => !allBattersOut.includes(name) && !currentlyAtCrease.includes(name));
    }
    return teamPlayerNames;
  }, [showPlayerModal, currentInnings, match.allPlayers]);

  const clearModals = () => {
    setExtraRunSelector(null);
    setAttributionModal(null);
    setWicketModal(false);
    setFielderPrompt(null);
    setFielderName('');
    setShowPlayerModal(null);
    setShowOversModal(false);
  };

  const handleManualSwap = () => {
    if (currentInnings.currentBatsmenNames.length < 2) return;
    const updatedMatch = JSON.parse(JSON.stringify(match)) as Match;
    const inn = updatedMatch.innings[innIdx]!;
    
    const swapBall: BallRecord = {
      ballId: `swap_${Date.now()}`,
      runs: 0,
      isExtra: false,
      isWicket: false,
      manualStrikeRotate: true,
      striker: inn.currentBatsmenNames[0],
      bowler: inn.currentBowlerName || 'N/A'
    };

    inn.ballByBall.push(swapBall);
    recalculate(updatedMatch);
  };

  const validateAndAddBall = (ball: Partial<BallRecord>) => {
    if (currentInnings.currentBatsmenNames.length < 2) {
      setShowPlayerModal('batsman');
      return;
    }
    if (!currentInnings.currentBowlerName) {
      setShowPlayerModal('bowler');
      return;
    }

    const updatedMatch = JSON.parse(JSON.stringify(match)) as Match;
    const inn = updatedMatch.innings[innIdx]!;
    
    const newBall: BallRecord = {
      ballId: `b_${Date.now()}`,
      runs: ball.runs || 0,
      isExtra: ball.isExtra || false,
      extraType: ball.extraType,
      isWicket: ball.isWicket || false,
      wicketType: ball.wicketType,
      fielderName: ball.fielderName,
      striker: inn.currentBatsmenNames[0],
      bowler: inn.currentBowlerName!,
      runsToBatsman: ball.runsToBatsman ?? !ball.isExtra
    };

    inn.ballByBall.push(newBall);
    recalculate(updatedMatch);
    clearModals();
  };

  const handleUndo = () => {
    const updatedMatch = JSON.parse(JSON.stringify(match)) as Match;
    const inn = updatedMatch.innings[innIdx]!;
    if (inn.ballByBall.length === 0) return;
    inn.ballByBall.pop();
    recalculate(updatedMatch);
  };

  const recalculate = (m: Match) => {
    const inn = m.innings[innIdx]!;
    const history = [...inn.ballByBall];
    const battingOrder = inn.batsmen.map(p => p.name);

    inn.runs = 0; 
    inn.wickets = 0; 
    inn.balls = 0; 
    inn.extras = 0;
    inn.currentOverBalls = [];
    inn.batsmen.forEach(p => { 
      p.runs = 0; p.balls = 0; p.fours = 0; p.sixes = 0; p.out = false; 
      delete p.dismissal; delete p.fielder; delete p.bowler;
    });
    inn.bowlers.forEach(p => { 
      p.overs = 0; p.balls = 0; p.runs = 0; p.wickets = 0; p.maidens = 0; 
    });

    let nextBatterIdx = 0;
    inn.currentBatsmenNames = [];
    if (battingOrder.length > 0) {
      inn.currentBatsmenNames.push(battingOrder[0]);
      nextBatterIdx = 1;
    }
    if (battingOrder.length > 1) {
      inn.currentBatsmenNames.push(battingOrder[1]);
      nextBatterIdx = 2;
    }

    history.forEach((ball) => {
      if (ball.manualStrikeRotate) {
        if (inn.currentBatsmenNames.length === 2) {
          inn.currentBatsmenNames = [inn.currentBatsmenNames[1], inn.currentBatsmenNames[0]];
        }
        return;
      }

      const striker = findOrAddBatter(inn, ball.striker);
      const bowler = findOrAddBowler(inn, ball.bowler);
      
      inn.currentOverBalls.push(ball);

      if (ball.isWicket) {
        inn.wickets += 1;
        inn.balls += 1;
        striker.balls += 1;
        striker.runs += ball.runs;
        striker.out = true;
        striker.dismissal = ball.wicketType;
        striker.fielder = ball.fielderName;
        striker.bowler = ball.bowler;
        if (ball.wicketType !== 'Run Out') bowler.wickets += 1;
        bowler.balls += 1;
        bowler.runs += ball.runs;
        
        inn.currentBatsmenNames = inn.currentBatsmenNames.filter(n => n !== ball.striker);
        if (nextBatterIdx < battingOrder.length) {
          inn.currentBatsmenNames.push(battingOrder[nextBatterIdx]);
          nextBatterIdx++;
        }
      } else if (ball.isExtra) {
        if (ball.extraType === 'wide' || ball.extraType === 'noball') {
          inn.runs += (ball.runs + 1);
          inn.extras += (ball.runs + 1);
          bowler.runs += (ball.runs + 1);
          if (ball.runsToBatsman) striker.runs += ball.runs;
          if (ball.extraType === 'noball') striker.balls += 1;
        } else {
          inn.runs += ball.runs;
          inn.extras += ball.runs;
          inn.balls += 1;
          bowler.balls += 1;
          striker.balls += 1;
        }
      } else {
        inn.runs += ball.runs;
        inn.balls += 1;
        striker.runs += ball.runs;
        striker.balls += 1;
        bowler.runs += ball.runs;
        bowler.balls += 1;
        if (ball.runs === 4) striker.fours += 1;
        if (ball.runs === 6) striker.sixes += 1;
      }

      let rotate = false;
      if (!ball.isExtra && (ball.runs % 2 !== 0)) rotate = true;
      if (ball.isExtra && (ball.runs % 2 !== 0) && ['bye', 'legbye', 'noball'].includes(ball.extraType!)) rotate = true;
      
      if (rotate && inn.currentBatsmenNames.length === 2) {
        inn.currentBatsmenNames = [inn.currentBatsmenNames[1], inn.currentBatsmenNames[0]];
      }

      const legalBallsThisOver = inn.currentOverBalls.filter(b => !(b.isExtra && (b.extraType === 'wide' || b.extraType === 'noball'))).length;
      if (legalBallsThisOver === 6) {
        inn.currentOverBalls = [];
        bowler.overs += 1;
        bowler.balls = 0;
        if (inn.currentBatsmenNames.length === 2) {
          inn.currentBatsmenNames = [inn.currentBatsmenNames[1], inn.currentBatsmenNames[0]];
        }
        inn.currentBowlerName = null; 
      }
    });

    const isSecondInnings = m.currentInnings === 2;
    const firstInningsScore = m.innings[0]?.runs ?? 0;
    const reachedTarget = isSecondInnings && inn.runs > firstInningsScore;
    const allOut = inn.wickets >= 10;
    const totalOversPlayed = inn.balls / 6;
    const oversDone = totalOversPlayed >= m.totalOvers;

    if (reachedTarget || allOut || oversDone) {
      m.status = m.currentInnings === 1 ? 'inningsBreak' : 'completed';
    } else {
      m.status = 'live';
      if (inn.currentBatsmenNames.length < 2) {
        setShowPlayerModal('batsman');
      } else if (!inn.currentBowlerName) {
        setShowPlayerModal('bowler');
      }
    }
    
    onUpdate(m);
  };

  const findOrAddBatter = (inn: Innings, name: string): PlayerStats => {
    let p = inn.batsmen.find(b => b.name === name);
    if (!p) {
      p = { name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      inn.batsmen.push(p);
    }
    return p;
  };

  const findOrAddBowler = (inn: Innings, name: string): BowlerStats => {
    let p = inn.bowlers.find(b => b.name === name);
    if (!p) {
      p = { name, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
      inn.bowlers.push(p);
    }
    return p;
  };

  const handlePlayerSelected = (name: string) => {
    const updated = JSON.parse(JSON.stringify(match)) as Match;
    const inn = updated.innings[innIdx]!;
    if (showPlayerModal === 'batsman') {
      if (inn.currentBatsmenNames.length >= 2) {
        inn.currentBatsmenNames[0] = name;
      } else {
        inn.currentBatsmenNames.push(name);
      }
      findOrAddBatter(inn, name);
      if (!updated.allPlayers[inn.battingTeam].includes(name)) updated.allPlayers[inn.battingTeam].push(name);
    } else {
      inn.currentBowlerName = name;
      findOrAddBowler(inn, name);
      if (!updated.allPlayers[inn.bowlingTeam].includes(name)) updated.allPlayers[inn.bowlingTeam].push(name);
    }
    onUpdate(updated);
    setShowPlayerModal(null);
  };

  const handleAdjustOvers = () => {
    const newOvers = parseFloat(oversInput);
    if (!isNaN(newOvers) && newOvers > 0) {
      const updated = JSON.parse(JSON.stringify(match)) as Match;
      updated.totalOvers = newOvers;
      recalculate(updated);
      setShowOversModal(false);
    }
  };

  const isCreaseReady = currentInnings.currentBatsmenNames.length === 2 && !!currentInnings.currentBowlerName;

  return (
    <div className="flex flex-col gap-1.5 flex-1 h-full py-0.5 overflow-hidden">
      {/* Top Controls Row */}
      <div className="grid grid-cols-4 gap-1 shrink-0 px-1 min-h-[38px]">
        <button 
          onClick={() => setShowPlayerModal('batsman')} 
          className={`py-1.5 rounded-lg text-[7px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center text-center ${currentInnings.currentBatsmenNames.length < 2 ? 'bg-amber-900/40 border-amber-500/40 text-amber-400 animate-pulse' : 'bg-emerald-900/40 border-emerald-500/20 text-emerald-400'}`}
        >
           {currentInnings.currentBatsmenNames.length < 2 ? 'Add' : 'Swap'} Batter
        </button>
        
        <button 
          onClick={handleManualSwap}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 active:scale-90 transition-all hover:bg-emerald-500/20"
          title="Swap Strike"
        >
          <span className="text-sm">⇄</span>
        </button>

        <button 
          onClick={() => setShowPlayerModal('bowler')} 
          className={`py-1.5 rounded-lg text-[7px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center text-center ${!currentInnings.currentBowlerName ? 'bg-amber-900/40 border-amber-500/40 text-amber-400 animate-pulse' : 'bg-emerald-900/40 border-emerald-500/20 text-emerald-400'}`}
        >
          {currentInnings.currentBowlerName ? 'Change' : 'Add'} Bowler
        </button>
        
        <button onClick={handleUndo} className="bg-slate-800/60 py-1.5 rounded-lg text-[7px] font-bold uppercase border border-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center">Undo</button>
      </div>

      {!isCreaseReady && match.status === 'live' && (
        <div className="bg-amber-500/10 border border-amber-500/20 mx-1 p-0.5 rounded-lg text-center shrink-0">
          <p className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">⚠️ CREASE NOT READY</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col gap-1.5 min-h-0 transition-opacity ${( !isCreaseReady || match.status !== 'live' ) ? 'opacity-30 pointer-events-none' : ''}`}>
        {/* Core Runs Grid */}
        <div className="grid grid-cols-4 gap-1.5 px-1 shrink-0">
          {[0, 1, 2, 3].map(r => (
            <button key={r} onClick={() => validateAndAddBall({runs: r})} className="bg-slate-800/80 aspect-[1.2] rounded-xl font-bebas text-xl border border-white/5 shadow-md transition-all active:scale-90">{r}</button>
          ))}
          {[4, 6].map(r => (
            <button key={r} onClick={() => validateAndAddBall({runs: r})} className="bg-emerald-900/60 aspect-[1.2] rounded-xl font-bebas text-xl border border-emerald-500/30 text-emerald-400 shadow-md active:scale-90">{r}</button>
          ))}
          <button onClick={() => setWicketModal(true)} className="bg-red-950/40 aspect-[1.2] rounded-xl font-bebas text-xl border border-red-500/30 text-red-500 shadow-md active:scale-90">OUT</button>
          <button 
            onClick={() => { setOversInput(match.totalOvers.toString()); setShowOversModal(true); }} 
            className="bg-slate-800/40 aspect-[1.2] rounded-xl flex flex-col items-center justify-center border border-dashed border-slate-600 active:scale-95"
          >
             <span className="text-[5px] font-bold uppercase">Adjust</span>
             <span className="font-bebas text-[10px]">OVERS</span>
          </button>
        </div>

        {/* Extras Registry */}
        <div className="bg-black/40 p-2 rounded-xl border border-white/5 mx-1 flex-1 flex flex-col justify-center min-h-0">
           <p className="text-[6px] font-bold uppercase tracking-[0.3em] text-slate-500 text-center mb-1">Extras</p>
           <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
              <button onClick={() => setExtraRunSelector({type: 'wide'})} className="bg-slate-800/60 rounded-lg flex flex-col items-center justify-center border border-white/5 hover:bg-emerald-900/40 transition-all py-1.5"><span className="text-[8px] font-bebas text-emerald-400 tracking-widest">WIDE</span></button>
              <button onClick={() => setExtraRunSelector({type: 'noball'})} className="bg-slate-800/60 rounded-lg flex flex-col items-center justify-center border border-white/5 hover:bg-emerald-900/40 transition-all py-1.5"><span className="text-[8px] font-bebas text-emerald-400 tracking-widest">NO BALL</span></button>
              <button onClick={() => setExtraRunSelector({type: 'bye'})} className="bg-slate-800/60 rounded-lg flex flex-col items-center justify-center border border-white/5 hover:bg-emerald-900/40 transition-all py-1.5"><span className="text-[8px] font-bebas text-emerald-400 tracking-widest">BYES</span></button>
              <button onClick={() => setExtraRunSelector({type: 'legbye'})} className="bg-slate-800/60 rounded-lg flex flex-col items-center justify-center border border-white/5 hover:bg-emerald-900/40 transition-all py-1.5"><span className="text-[8px] font-bebas text-emerald-400 tracking-widest">LEG BYES</span></button>
           </div>
        </div>
      </div>

      {/* Adjust Overs Modal */}
      {showOversModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[450] flex items-center justify-center p-8">
           <div className="bg-slate-900 p-6 rounded-3xl w-full max-w-[280px] border border-white/10 shadow-2xl">
              <h4 className="text-lg font-bebas text-emerald-400 mb-2 uppercase tracking-widest text-center">Adjust Overs</h4>
              <input 
                type="number"
                autoFocus
                value={oversInput}
                onChange={(e) => setOversInput(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 mb-4 text-center text-xl font-bebas text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setShowOversModal(false)} className="py-3 bg-slate-800/40 rounded-xl font-bold text-[8px] uppercase tracking-widest text-slate-500">Cancel</button>
                 <button onClick={handleAdjustOvers} className="py-3 bg-emerald-600 rounded-xl font-bold text-[8px] uppercase tracking-widest text-white shadow-lg">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* Attribution Modal */}
      {attributionModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[400] flex items-center justify-center p-8 text-center">
          <div className="bg-slate-900 p-6 rounded-3xl w-full max-w-[300px] border border-white/10 shadow-2xl">
            <h4 className="text-lg font-bebas text-emerald-400 mb-1 uppercase tracking-widest">{attributionModal.type} Runs</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase mb-4">Attribute {attributionModal.runs} runs to:</p>
            <div className="grid gap-2 mb-4">
              <button onClick={() => validateAndAddBall({runs: attributionModal.runs, isExtra: true, extraType: attributionModal.type, runsToBatsman: true})} className="bg-emerald-600/20 border border-emerald-500/40 py-3 rounded-xl font-bold text-[9px] uppercase tracking-widest text-emerald-400">Batter Score</button>
              <button onClick={() => validateAndAddBall({runs: attributionModal.runs, isExtra: true, extraType: attributionModal.type, runsToBatsman: false})} className="bg-slate-800 border border-white/5 py-3 rounded-xl font-bold text-[9px] uppercase tracking-widest text-slate-300">Team Extras</button>
            </div>
            <button onClick={() => setAttributionModal(null)} className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {/* Extra Run Selector */}
      {extraRunSelector && !attributionModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[350] flex items-center justify-center p-8 text-center">
          <div className="bg-slate-900 p-6 rounded-3xl w-full max-w-[280px] border border-white/10 shadow-2xl">
            <h4 className="text-lg font-bebas text-emerald-400 mb-1 uppercase tracking-widest">{extraRunSelector.type}</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase mb-4">Additional runs?</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0, 1, 2, 3, 4, 6].map(num => (
                <button 
                  key={num} 
                  onClick={() => {
                    if (extraRunSelector.type === 'wide') validateAndAddBall({runs: num, isExtra: true, extraType: 'wide', runsToBatsman: false});
                    else setAttributionModal({ type: extraRunSelector.type, runs: num });
                  }} 
                  className="bg-slate-800 h-10 rounded-lg font-bebas text-lg border border-white/5"
                >
                  {num}
                </button>
              ))}
            </div>
            <button onClick={() => setExtraRunSelector(null)} className="w-full py-3 bg-slate-800/40 rounded-xl font-bold text-[8px] uppercase tracking-widest text-slate-500">Back</button>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {wicketModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-6 text-center">
          <div className="bg-slate-900 p-6 rounded-3xl w-full max-w-[340px] border border-white/10 shadow-2xl">
            {!fielderPrompt ? (
              <>
                <h4 className="text-lg font-bebas text-red-500 mb-4 uppercase tracking-[0.2em]">How's That?!</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'C & B'].map(type => (
                    <button 
                      key={type}
                      onClick={() => {
                        if (['Caught', 'Run Out', 'Stumped'].includes(type)) setFielderPrompt({ type });
                        else if (type === 'C & B') validateAndAddBall({isWicket: true, wicketType: 'Caught', fielderName: currentInnings.currentBowlerName!});
                        else validateAndAddBall({isWicket: true, wicketType: type});
                      }}
                      className="bg-slate-800 py-2 rounded-lg font-bold text-[8px] uppercase tracking-widest border border-white/5"
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button onClick={() => setWicketModal(false)} className="w-full py-3 bg-slate-800/40 rounded-xl font-bold text-[8px] uppercase tracking-widest text-slate-500">Cancel</button>
              </>
            ) : (
              <div className="space-y-3 text-left">
                <h4 className="text-md font-bebas text-emerald-400 uppercase tracking-widest text-center">{fielderPrompt.type}</h4>
                <input 
                  autoFocus value={fielderName} onChange={(e) => setFielderName(e.target.value)}
                  placeholder="Fielder name..."
                  className="w-full bg-black/50 border border-slate-700 rounded-xl p-2.5 text-xs outline-none text-white"
                />
                {fielderPrompt.type === 'Run Out' && (
                  <div className="grid grid-cols-4 gap-1">
                    {[0,1,2,3].map(n => (
                      <button key={n} onClick={() => setFielderPrompt({...fielderPrompt, runs: n})} className={`py-1.5 rounded-lg font-bebas text-lg border ${fielderPrompt.runs === n ? 'bg-emerald-600' : 'bg-slate-800'}`}>{n}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setFielderPrompt(null)} className="flex-1 py-2.5 bg-slate-800 rounded-lg text-[8px] font-bold uppercase">Back</button>
                  <button onClick={() => {
                    validateAndAddBall({isWicket: true, wicketType: fielderPrompt.type, fielderName: fielderName || 'Fielder', runs: fielderPrompt.runs || 0});
                  }} className="flex-1 py-2.5 bg-emerald-600 rounded-lg text-[8px] font-bold uppercase">Confirm</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPlayerModal && (
        <PlayerModal 
          type={showPlayerModal} 
          existingPlayers={availablePlayers} 
          onSelect={handlePlayerSelected} 
          onClose={() => setShowPlayerModal(null)} 
        />
      )}
    </div>
  );
};

export default ScoringPanel;
