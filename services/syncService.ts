
import { Match, Innings } from "../types";

/**
 * IMPORTANT: Ensure your Google Apps Script is deployed with these settings:
 * 1. Execute as: Me
 * 2. Who has access: Anyone (This is the most common cause of "Failed to fetch")
 */
const SYNC_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwMtn3tZCyaxjiYLyTLe9CKQOqxGDgupQJJ1-5MQzNqYH3v_hGT217PBOyQQj5n9l1iJw/exec"; 

export async function fetchFromGoogleSheets(): Promise<any[]> {
  if (!SYNC_WEB_APP_URL) return [];
  try {
    console.log("CRICSCORE_SYNC: Attempting to fetch from", SYNC_WEB_APP_URL);
    
    // Using a simple fetch. If this fails with "Failed to fetch", the script 
    // is likely NOT deployed as "Anyone" or the URL is restricted.
    const response = await fetch(`${SYNC_WEB_APP_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors', // Apps Script supports CORS for GET if deployed as 'Anyone'
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("CRICSCORE_SHEET_ERROR:", data.error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    // If you see "TypeError: Failed to fetch", it's almost certainly a deployment permission issue.
    console.error("CRICSCORE_LOAD_ERROR: Connection failed.", e.message);
    console.warn("Checklist:\n1. Open Apps Script\n2. Deploy -> New Deployment\n3. Set 'Who has access' to 'Anyone'\n4. Use the NEW URL generated.");
    return [];
  }
}

export async function syncToGoogleSheets(match: Match): Promise<boolean> {
  if (!SYNC_WEB_APP_URL) return true;

  const innIdx = match.currentInnings - 1;
  const currentInnings = match.innings[innIdx] as Innings;
  if (!currentInnings) return false;

  const b1 = currentInnings.currentBatsmenNames[0] || "N/A";
  const b2 = currentInnings.currentBatsmenNames[1] || "N/A";
  const bowler = currentInnings.currentBowlerName || "N/A";

  const payload = {
    matchId: match.id,
    team1: match.team1,
    team2: match.team2,
    inningsNum: match.currentInnings,
    battingTeam: currentInnings.battingTeam,
    score: `${currentInnings.runs}/${currentInnings.wickets}`,
    overs: `${Math.floor(currentInnings.balls / 6)}.${currentInnings.balls % 6}`,
    batsmen: `${b1}*, ${b2}`,
    bowler: bowler,
    status: match.status,
    timestamp: new Date().toLocaleString()
  };

  try {
    // mode: 'no-cors' is required for POSTing to Apps Script because it returns a 302 redirect
    // which the browser blocks under standard CORS rules for POST. 
    // Data still reaches the server if deployed as 'Anyone'.
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

export function exportMatchData(match: Match) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(match));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `match_${match.id}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
