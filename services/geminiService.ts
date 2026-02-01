
import { GoogleGenAI } from "@google/genai";
import { Match, Innings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateCommentary(match: Match, ball: any): Promise<string> {
  const currentInnings = match.innings[match.currentInnings - 1] as Innings;
  const prompt = `
    You are a professional cricket commentator. 
    Match: ${match.team1} vs ${match.team2}.
    Situation: ${currentInnings.battingTeam} is ${currentInnings.runs}/${currentInnings.wickets} in ${Math.floor(currentInnings.balls / 6)}.${currentInnings.balls % 6} overs.
    Last Ball event: ${ball.isWicket ? 'WICKET!' : ball.runs + ' runs'}
    Action: Give a short, energetic 1-sentence commentary about this ball. 
    Mention the player ${ball.striker} or the bowler ${ball.bowler}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "What a delivery!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The crowd is going wild!";
  }
}

export async function getMatchSummary(match: Match): Promise<string> {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  
  const prompt = `
    Summarize this cricket match for a news report.
    Team 1 (${match.team1}) Score: ${inn1.runs}/${inn1.wickets} (${Math.floor(inn1.balls/6)}.${inn1.balls%6} overs)
    ${inn2 ? `Team 2 (${match.team2}) Score: ${inn2.runs}/${inn2.wickets} (${Math.floor(inn2.balls/6)}.${inn2.balls%6} overs)` : 'Second innings in progress'}
    Status: ${match.status}
    Create a catchy summary in 3 sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "A thrilling contest between two great sides.";
  } catch (error) {
    return "Match details unavailable.";
  }
}
