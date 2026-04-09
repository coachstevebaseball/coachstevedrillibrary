/**
 * Video Analysis Service — Gemini Vision powered baseball mechanics analysis
 *
 * Calls Gemini 1.5 Pro (gemini-1.5-pro) directly via @google/generative-ai
 * using the fileData / videoUrl multimodal approach for video input.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ENV } from "./_core/env";

export interface VideoAnalysisResult {
  overallAssessment: string;
  mechanicsBreakdown: {
    phase: string;
    observation: string;
    rating: number;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  drillRecommendations: string[];
  coachingCues: string[];
  confidenceScore: number;
}

const SYSTEM_PROMPT = `You are Coach Steve — an expert baseball hitting instructor with D1 and Cape Cod League experience (Stony Brook University, 2012 College World Series). Your philosophy is Process Over Outcome. You have coached players alongside Aaron Judge, Kyle Schwarber, and Alex Bregman.

When analyzing hitting video:
- Break down each mechanical phase: Stance, Load, Stride, Hip Rotation, Hand Path, Contact, Follow-Through
- Note timing, balance, bat path, hip/shoulder sequence, and weight transfer
- Be direct but encouraging — highlight what's working first
- Give actionable coaching cues (short phrases athletes can repeat in their head)
- Recommend specific drills from your library that address the issues
- Rate each phase 1–5 (1=needs significant work, 3=developing, 5=excellent)
- Overall confidence score 0–100 based on video quality and angle
- Speak to the coach, not the athlete — use "the hitter" or athlete's name`;

/**
 * Analyze a baseball swing video using Gemini Vision.
 */
export async function analyzeAthleteVideo(params: {
  videoUrl: string;
  drillName: string;
  athleteName?: string;
  athleteAge?: string;
  athletePosition?: string;
  additionalContext?: string;
}): Promise<VideoAnalysisResult> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to your environment variables.");
  }

  const { videoUrl, drillName, athleteName, athleteAge, athletePosition, additionalContext } = params;

  const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

  // Use gemini-1.5-pro for video — it has the best multimodal video understanding
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build prompt
  let prompt = `Analyze this baseball video.\n\n`;
  prompt += `Drill/Type: ${drillName}\n`;
  if (athleteName) prompt += `Athlete: ${athleteName}\n`;
  if (athleteAge) prompt += `Age: ${athleteAge}\n`;
  if (athletePosition) prompt += `Position: ${athletePosition}\n`;
  if (additionalContext) prompt += `Notes: ${additionalContext}\n`;
  prompt += `\nReturn a comprehensive JSON analysis of mechanics, strengths, areas for improvement, drill recommendations, and coaching cues.`;

  // Determine if URL is a direct video file or a hosted platform link
  // Gemini supports: mp4, mpeg, mov, avi, webm via fileUri (Google Files API)
  // For public URLs we use the fileData approach with a mimeType hint
  const videoPart = {
    fileData: {
      fileUri: videoUrl,
      mimeType: "video/mp4" as const,
    },
  };

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      overallAssessment: {
        type: SchemaType.STRING,
        description: "2-3 sentence overall assessment of the athlete's swing",
      },
      mechanicsBreakdown: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            phase: { type: SchemaType.STRING },
            observation: { type: SchemaType.STRING },
            rating: { type: SchemaType.NUMBER },
          },
          required: ["phase", "observation", "rating"],
        },
      },
      strengths: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      areasForImprovement: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      drillRecommendations: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      coachingCues: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      confidenceScore: { type: SchemaType.NUMBER },
    },
    required: [
      "overallAssessment", "mechanicsBreakdown", "strengths",
      "areasForImprovement", "drillRecommendations", "coachingCues", "confidenceScore",
    ],
  };

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [videoPart, { text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  });

  const text = result.response.text();
  if (!text) throw new Error("Gemini returned no content for video analysis");

  let parsed: VideoAnalysisResult;
  try {
    parsed = JSON.parse(text.replace(/^```json\n?|```$/g, "").trim());
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 200)}`);
  }

  if (!parsed.overallAssessment || !Array.isArray(parsed.mechanicsBreakdown)) {
    throw new Error("Invalid analysis structure from Gemini");
  }

  return parsed;
}

/**
 * Format AI analysis into a readable coach-editable text block.
 */
export function formatAnalysisForCoachEdit(analysis: VideoAnalysisResult): string {
  let text = `## Overall Assessment\n${analysis.overallAssessment}\n\n`;

  text += `## Mechanics Breakdown\n`;
  for (const phase of analysis.mechanicsBreakdown) {
    const stars = "★".repeat(phase.rating) + "☆".repeat(5 - phase.rating);
    text += `### ${phase.phase} ${stars}\n${phase.observation}\n\n`;
  }

  text += `## Strengths\n`;
  for (const s of analysis.strengths) text += `- ${s}\n`;
  text += `\n`;

  text += `## Areas for Improvement\n`;
  for (const a of analysis.areasForImprovement) text += `- ${a}\n`;
  text += `\n`;

  text += `## Recommended Drills\n`;
  for (const d of analysis.drillRecommendations) text += `- ${d}\n`;
  text += `\n`;

  text += `## Coaching Cues\n`;
  for (const c of analysis.coachingCues) text += `- "${c}"\n`;

  return text;
}

/**
 * Text-based fallback analysis using forge LLM when Gemini Vision is unavailable.
 * Generates feedback based on swing type and athlete context without video.
 */
export async function analyzeAthleteVideoWithFallback(params: {
  videoUrl: string;
  drillName: string;
  athleteName?: string;
  athleteAge?: string;
  athletePosition?: string;
  additionalContext?: string;
}): Promise<VideoAnalysisResult> {
  // Try Gemini Vision first
  try {
    return await analyzeAthleteVideo(params);
  } catch (geminiError) {
    console.warn("[VideoAnalysis] Gemini Vision failed, using text-based fallback:", 
      geminiError instanceof Error ? geminiError.message : String(geminiError));
  }

  // Forge text-based fallback — generates structured feedback without video
  try {
    const { invokeLLM } = await import("./_core/llm");
    const prompt = `You are Coach Steve, an elite baseball hitting instructor (Cape Cod League, Stony Brook CWS 2012). 
A ${params.athleteAge || "youth"} athlete submitted a ${params.drillName} video for analysis.
${params.athleteName ? `Athlete: ${params.athleteName}.` : ""}
${params.additionalContext ? `Notes: ${params.additionalContext}` : ""}

Generate a realistic, helpful swing analysis as if you watched the video. Be specific about common mechanical issues for this drill type. Return ONLY valid JSON matching this exact structure:
{
  "overallAssessment": "2-3 sentence assessment",
  "mechanicsBreakdown": [
    {"phase": "Stance", "observation": "...", "rating": 3},
    {"phase": "Load", "observation": "...", "rating": 3},
    {"phase": "Stride", "observation": "...", "rating": 3},
    {"phase": "Hip Rotation", "observation": "...", "rating": 3},
    {"phase": "Contact", "observation": "...", "rating": 3}
  ],
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "drillRecommendations": ["drill 1", "drill 2"],
  "coachingCues": ["cue 1", "cue 2", "cue 3"],
  "confidenceScore": 40
}
Note: confidenceScore should be 40 since this is based on drill type context, not direct video observation.`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") throw new Error("No fallback response");

    const clean = text.replace(/^```json\n?|```$/g, "").trim();
    const parsed = JSON.parse(clean) as VideoAnalysisResult;
    parsed.overallAssessment = "[Note: Video could not be processed — analysis based on drill type context] " + parsed.overallAssessment;
    return parsed;
  } catch (fallbackError) {
    throw new Error(
      `Video analysis unavailable: Gemini Vision requires active billing at console.cloud.google.com. ` +
      `Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
    );
  }
}
