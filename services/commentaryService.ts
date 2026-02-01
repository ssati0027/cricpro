
import { GoogleGenAI, Modality } from "@google/genai";
import { Match, Innings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface CommentaryResult {
  text: string;
  audioBase64?: string;
}

const LOCAL_TEMPLATES = {
  dot: [
    "Good length ball, defended back to the bowler.",
    "Driven straight to the fielder. No run.",
    "Beaten! That was a peach of a delivery.",
    "Played with a straight bat. Dot ball."
  ],
  run: [
    "Pushed into the gap for a single.",
    "Working the ball away to the leg side for a run.",
    "Good running, they scamper through for one.",
    "Tapped into the off side and they take a quick single."
  ]
};

export async function generateLiveCommentary(match: Match, ball: any): Promise<CommentaryResult> {
  // Ultra-fast local logic for common balls to save quota and increase speed
  if (!ball.isWicket && ball.runs < 4) {
    const pool = ball.runs === 0 ? LOCAL_TEMPLATES.dot : LOCAL_TEMPLATES.run;
    const text = pool[Math.floor(Math.random() * pool.length)];
    return { text: `${ball.striker} ${text}` };
  }

  const currentInnings = match.innings[match.currentInnings - 1] as Innings;
  const situation = `${currentInnings.battingTeam} are ${currentInnings.runs}/${currentInnings.wickets} in ${Math.floor(currentInnings.balls / 6)}.${currentInnings.balls % 6} overs.`;
  const event = ball.isWicket ? `WICKET! ${ball.wicketType}` : `${ball.runs} runs scored! CRUNCHING boundary!`;
  
  const prompt = `Cricket Commentary: ${ball.striker} vs ${ball.bowler}. ${event}. Match score: ${situation}. Short, punchy, 1-sentence professional commentary.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const commentaryText = response.text || "Unbelievable action here!";

    // TTS only for major moments (Wickets, Boundaries)
    let audioBase64;
    try {
      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: commentaryText }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    } catch (e) {
      // Quietly fail TTS if quota hit
    }

    return { text: commentaryText, audioBase64 };
  } catch (error) {
    // Permanent fallback for quota issues
    const fallbackText = ball.isWicket ? `OUT! Huge wicket of ${ball.striker}!` : `CRACKING SHOT! That's gone for ${ball.runs}!`;
    return { text: fallbackText };
  }
}
