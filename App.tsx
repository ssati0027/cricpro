
import React, { useState, useEffect, useCallback } from 'react';
import { Match, AppState, Innings } from './types';
import Header from './components/Header';
import MatchList from './components/MatchList';
import CreateMatch from './components/CreateMatch';
import LiveScorecard from './components/LiveScorecard';
import ScoringPanel from './components/ScoringPanel';
import Scoreboard from './components/Scoreboard';
import { syncToGoogleSheets, fetchFromGoogleSheets } from './services/syncService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cricscore_v2_data');
    return saved ? JSON.parse(saved) : { matches: [], currentMatchId: null, isScorer: false };
  });

  const [view, setView] = useState<'home' | 'create' | 'match' | 'scoreboard'>('home');
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Ready');

  // Load from Sheets on Mount
  useEffect(() => {
    const loadFromSheets = async () => {
      setSyncStatus('Connecting...');
      try {
        const sheetData = await fetchFromGoogleSheets();
        if (sheetData && sheetData.length > 0) {
          setState(prev => {
            const existingMatches = [...prev.matches];
            const existingIds = new Set(existingMatches.map(m => m.id));
            const matchesToUpdate: Match[] = [];
            
            // Map sheet rows to objects
            const latestStates: Record<string, any> = {};
            sheetData.forEach(row => {
              const id = row.MatchID || row.matchId;
              if (id) latestStates[id] = row;
            });

            Object.values(latestStates).forEach(row => {
              const id = row.MatchID || row.matchId;
              if (!existingIds.has(id)) {
                // Safely convert to string before splitting to avoid "split is not a function"
                const matchName = String(row.MatchName || row.matchName || "TEAM A vs TEAM B");
                const teams = matchName.split(" vs ");
                const t1 = teams[0]?.trim() || "TEAM A";
                const t2 = teams[1]?.trim() || "TEAM B";
                
                const scoreStr = String(row.Score || row.score || "0/0");
                const scoreParts = scoreStr.split("/");
                
                const innNumStr = String(row.Innings || row.inningsNum || "1");
                const innNum = parseInt(innNumStr) || 1;
                
                const batsmenStr = String(row.Batsmen || row.batsmen || "");
                const statusStr = String(row.Status || row.status || 'completed').toLowerCase();
                const bowlerStr = row.Bowler || row.bowler || null;
                const battingTeamStr = String(row.BattingTeam || row.battingTeam || t1);

                matchesToUpdate.push({
                  id: String(id),
                  team1: t1,
                  team2: t2,
                  totalOvers: 5,
                  password: 'password', 
                  status: statusStr as any,
                  currentInnings: (innNum === 2 ? 2 : 1) as 1 | 2,
                  innings: [{
                    battingTeam: battingTeamStr,
                    bowlingTeam: battingTeamStr === t1 ? t2 : t1,
                    runs: parseInt(scoreParts[0]) || 0,
                    wickets: parseInt(scoreParts[1]) || 0,
                    balls: 0, extras: 0, batsmen: [], bowlers: [], 
                    currentBatsmenNames: batsmenStr ? batsmenStr.split(", ").map(s => s.replace('*', '').trim()) : [],
                    currentBowlerName: bowlerStr ? String(bowlerStr) : null, 
                    ballByBall: [], currentOverBalls: []
                  }, null],
                  allPlayers: { [t1]: [], [t2]: [] }
                });
              }
            });

            return { ...prev, matches: [...existingMatches, ...matchesToUpdate] };
          });
        }
        setSyncStatus('Online');
      } catch (err) {
        console.error("Hydration Error:", err);
        setSyncStatus('Offline');
      }
    };
    loadFromSheets();
  }, []);

  useEffect(() => {
    localStorage.setItem('cricscore_v2_data', JSON.stringify(state));
  }, [state]);

  const currentMatch = state.matches.find(m => m.id === state.currentMatchId);

  useEffect(() => {
    if (currentMatch && state.isScorer) {
      const performSync = async () => {
        setSyncStatus('Syncing...');
        const success = await syncToGoogleSheets(currentMatch);
        setSyncStatus(success ? 'Online' : 'Sync Error');
      };
      const timer = setTimeout(performSync, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentMatch, state.isScorer]);

  const handleCreateMatch = (match: Match) => {
    setState(prev => ({
      ...prev,
      matches: [...prev.matches, match],
      currentMatchId: match.id,
      isScorer: true
    }));
    setView('match');
  };

  const handleSelectMatch = (id: string) => {
    setState(prev => ({ ...prev, currentMatchId: id, isScorer: false }));
    setView('match');
  };

  const handleBecomeScorer = (password: string) => {
    const match = state.matches.find(m => m.id === state.currentMatchId);
    if (match && match.password === password) {
      setState(prev => ({ ...prev, isScorer: true }));
      setAuthError(null);
    } else {
      setAuthError("Incorrect Password");
    }
  };

  const updateMatchState = useCallback((updatedMatch: Match) => {
    setState(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id === updatedMatch.id ? updatedMatch : m)
    }));
  }, []);

  const startSecondInnings = () => {
    if (!currentMatch) return;
    const m = JSON.parse(JSON.stringify(currentMatch)) as Match;
    m.currentInnings = 2;
    m.status = 'live';
    m.innings[1] = {
      battingTeam: m.innings[0]!.bowlingTeam,
      bowlingTeam: m.innings[0]!.battingTeam,
      runs: 0, wickets: 0, balls: 0, extras: 0,
      batsmen: [], bowlers: [], currentBatsmenNames: [], currentBowlerName: null,
      ballByBall: [], currentOverBalls: []
    };
    updateMatchState(m);
  };

  return (
    <div className="h-screen flex flex-col text-slate-100 bg-[#022c22] overflow-hidden">
      <Header 
        onHome={() => { setView('home'); setState(p => ({ ...p, isScorer: false, currentMatchId: null })); }} 
        title={currentMatch ? `${currentMatch.team1} vs ${currentMatch.team2}` : "CRICSCORE PRO"} 
        syncStatus={syncStatus}
      />
      
      <main className="flex-1 overflow-hidden p-3 flex flex-col gap-3">
        {view === 'home' && (
          <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-2xl font-bebas tracking-widest text-emerald-400">Match Lobby</h2>
              <button onClick={() => setView('create')} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all shadow-lg shadow-emerald-950/40">NEW MATCH</button>
            </div>
            <MatchList matches={state.matches} onSelect={handleSelectMatch} />
          </div>
        )}

        {view === 'create' && <CreateMatch onSubmit={handleCreateMatch} onCancel={() => setView('home')} />}

        {view === 'match' && currentMatch && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden max-w-2xl mx-auto w-full">
            <LiveScorecard match={currentMatch} onToggleScoreboard={() => setView('scoreboard')} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {currentMatch.status === 'inningsBreak' && !state.isScorer && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-white/5">
                  <h3 className="text-4xl font-bebas text-amber-400 mb-2">Innings Break</h3>
                  <p className="text-sm font-bold uppercase mb-6 tracking-widest">Target: {currentMatch.innings[0]!.runs + 1}</p>
                  <button onClick={() => setView('scoreboard')} className="bg-slate-800 px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest">Full Scorecard</button>
                </div>
              )}
              {currentMatch.status === 'completed' && !state.isScorer && (
                <div className="absolute inset-0 bg-[#022c22]/90 backdrop-blur-lg z-10 flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-emerald-500/20">
                  <h3 className="text-5xl font-bebas text-emerald-400 mb-4 tracking-wider">MATCH FINISHED</h3>
                  <p className="text-xl font-bold mb-8 italic">"{getWinnerMessage(currentMatch)}"</p>
                  <button onClick={() => setView('scoreboard')} className="bg-emerald-600 px-10 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-2xl">Detailed Stats</button>
                </div>
              )}
              {state.isScorer ? (
                <div className="flex-1 flex flex-col overflow-hidden gap-3">
                  {currentMatch.status === 'inningsBreak' && (
                    <button onClick={startSecondInnings} className="w-full bg-amber-600 hover:bg-amber-500 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-xl">Start 2nd Innings</button>
                  )}
                  {currentMatch.status === 'completed' && (
                    <div className="bg-emerald-900/40 p-6 rounded-2xl border border-emerald-500/30 text-center">
                       <h4 className="text-xl font-bebas text-emerald-400 mb-2">MATCH COMPLETED</h4>
                       <p className="text-sm text-white font-bold mb-4">{getWinnerMessage(currentMatch)}</p>
                       <button onClick={() => setView('scoreboard')} className="bg-emerald-600 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">View Final Scorecard</button>
                    </div>
                  )}
                  {currentMatch.status === 'live' && (
                    <ScoringPanel match={currentMatch} onUpdate={updateMatchState} />
                  )}
                </div>
              ) : (
                currentMatch.status === 'live' && (
                  <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center my-auto">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl">🔐</span>
                    </div>
                    <h3 className="text-lg font-bebas text-emerald-400 mb-1 tracking-widest">SCORER AUTHENTICATION</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 tracking-tighter">Enter match password to update scores</p>
                    <div className="w-full max-w-[240px] space-y-3">
                      <input 
                        type="password" placeholder="PASSWORD" 
                        className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-center tracking-[0.4em]"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleBecomeScorer(e.currentTarget.value); }}
                      />
                      <button 
                        onClick={(e) => handleBecomeScorer((e.currentTarget.previousSibling as HTMLInputElement).value)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg"
                      >
                        AUTHORIZE
                      </button>
                      {authError && <p className="text-red-500 text-center text-[10px] font-bold uppercase animate-pulse">{authError}</p>}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {view === 'scoreboard' && currentMatch && (
          <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <button onClick={() => setView('match')} className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span>←</span> BACK
              </button>
              <h2 className="text-2xl font-bebas text-white tracking-widest">SCOREBOARD</h2>
              <div className="w-10"></div>
            </div>
            <Scoreboard match={currentMatch} />
          </div>
        )}
      </main>
    </div>
  );
};

function getWinnerMessage(m: Match) {
  const inn1 = m.innings[0]!;
  const inn2 = m.innings[1];
  if (!inn2) return "First Innings Complete";
  if (inn2.runs > inn1.runs) return `${inn2.battingTeam} won by ${10 - inn2.wickets} wickets`;
  if (m.status === 'completed') {
    if (inn1.runs > inn2.runs) return `${inn1.battingTeam} won by ${inn1.runs - inn2.runs} runs`;
    return "Match Tied";
  }
  return `${inn2.battingTeam} needs ${inn1.runs + 1 - inn2.runs} runs to win`;
}

export default App;
