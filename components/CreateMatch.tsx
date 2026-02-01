
import React, { useState } from 'react';
import { Match, Innings } from '../types';

interface CreateMatchProps {
  onSubmit: (match: Match) => void;
  onCancel: () => void;
}

const CreateMatch: React.FC<CreateMatchProps> = ({ onSubmit, onCancel }) => {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [overs, setOvers] = useState('5');
  const [password, setPassword] = useState('');
  const [battingFirst, setBattingFirst] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1 || !team2 || !password) return alert("Please fill all required fields");

    const t1Name = team1.trim();
    const t2Name = team2.trim();
    const battTeam = battingFirst === '1' ? t1Name : t2Name;
    const bowlTeam = battingFirst === '1' ? t2Name : t1Name;

    const initialInnings: Innings = {
      battingTeam: battTeam,
      bowlingTeam: bowlTeam,
      runs: 0, wickets: 0, balls: 0, extras: 0,
      batsmen: [], bowlers: [], currentBatsmenNames: [], currentBowlerName: null,
      ballByBall: [], currentOverBalls: []
    };

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      team1: t1Name,
      team2: t2Name,
      totalOvers: parseInt(overs),
      password,
      status: 'live',
      currentInnings: 1,
      innings: [initialInnings, null],
      allPlayers: { [t1Name]: [], [t2Name]: [] }
    };

    onSubmit(newMatch);
  };

  return (
    <div className="max-w-md mx-auto w-full py-1 flex flex-col justify-center min-h-0">
      <div className="bg-slate-900/90 p-4 rounded-[2rem] border border-emerald-500/30 shadow-2xl backdrop-blur-2xl">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-bebas text-emerald-400 tracking-widest">SETUP FIXTURE</h2>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-full">New Match V3</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest px-1">HOST TEAM</label>
              <input 
                value={team1} onChange={e => setTeam1(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-[11px] font-bold tracking-tight placeholder-slate-800"
                placeholder="Team A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest px-1">VISITOR TEAM</label>
              <input 
                value={team2} onChange={e => setTeam2(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-[11px] font-bold tracking-tight placeholder-slate-800"
                placeholder="Team B"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest px-1">MATCH OVERS</label>
              <input 
                type="number" value={overs} onChange={e => setOvers(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[10px] font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest px-1">TOSS WINNER BATS</label>
              <div className="relative">
                <select 
                  value={battingFirst} onChange={e => setBattingFirst(e.target.value)}
                  className="w-full bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[8px] font-black uppercase tracking-widest appearance-none cursor-pointer text-emerald-300"
                >
                  <option value="1" className="bg-slate-900 text-white">{team1 || 'Team 1'}</option>
                  <option value="2" className="bg-slate-900 text-white">{team2 || 'Team 2'}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-emerald-500/40 text-[7px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest px-1">SCORER PASSWORD</label>
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-[10px] font-bold tracking-[0.3em] text-center"
              placeholder="••••"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button 
              type="button" onClick={onCancel}
              className="flex-1 bg-slate-800/40 py-2.5 rounded-xl font-bold uppercase text-[8px] tracking-[0.1em] hover:bg-slate-800 transition-all border border-white/5 text-slate-500"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-emerald-600 py-2.5 rounded-xl font-bold uppercase text-[8px] tracking-[0.1em] hover:bg-emerald-500 transition-all shadow-xl text-white"
            >
              START FIXTURE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMatch;
