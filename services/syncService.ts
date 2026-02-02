
import { Match, Innings } from "../types";

const SYNC_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwMtn3tZCyaxjiYLyTLe9CKQOqxGDgupQJJ1-5MQzNqYH3v_hGT217PBOyQQj5n9l1iJw/exec"; 

export async function fetchFromGoogleSheets(): Promise<any[]> {
  if (!SYNC_WEB_APP_URL) return [];
  try {
    const response = await fetch(`${SYNC_WEB_APP_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    // Google Sheets might return data nested in an object depending on the script
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
    return [];
  } catch (e: any) {
    console.error("CRICSCORE_LOAD_ERROR:", e.message);
    return [];
  }
}

export async function syncToGoogleSheets(match: Match): Promise<boolean> {
  if (!SYNC_WEB_APP_URL) return true;

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const currentInn = match.currentInnings === 1 ? inn1 : (inn2 || inn1);
  
  const b1 = currentInn.currentBatsmenNames[0] || "N/A";
  const b2 = currentInn.currentBatsmenNames[1] || "N/A";
  const bowler = currentInn.currentBowlerName || "N/A";

  // Using redundant keys to ensure the GAS script finds what it needs
  const payload = {
    matchId: String(match.id),
    MatchID: String(match.id),
    matchName: `${match.team1} vs ${match.team2}`,
    team1: match.team1,
    team2: match.team2,
    inningsNum: match.currentInnings,
    battingTeam: currentInn.battingTeam,
    score: `${currentInn.runs}/${currentInn.wickets}`,
    overs: `${Math.floor(currentInn.balls / 6)}.${currentInn.balls % 6}`,
    // Explicit innings data
    inn1Score: `${inn1.runs}/${inn1.wickets}`,
    inn1Overs: `${Math.floor(inn1.balls / 6)}.${inn1.balls % 6}`,
    inn2Score: inn2 ? `${inn2.runs}/${inn2.wickets}` : "N/A",
    inn2Overs: inn2 ? `${Math.floor(inn2.balls / 6)}.${inn2.balls % 6}` : "N/A",
    batsmen: `${b1}*, ${b2}`,
    bowler: bowler,
    status: match.status,
    timestamp: new Date().toLocaleString()
  };

  try {
    // We use no-cors to avoid the redirect error common with Google Apps Scripts,
    // but the data still gets sent to the server.
    await fetch(SYNC_WEB_APP_URL, {
      method: "POST",
      mode: 'no-cors', 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (e) {
    console.error("CRICSCORE_SYNC_ERROR:", e);
    return false;
  }
}
