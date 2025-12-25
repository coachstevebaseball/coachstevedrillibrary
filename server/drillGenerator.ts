import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";

const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

export interface GeneratedDrill {
  name: string;
  goal: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  skillSet: string;
  instructions: string;
  equipment?: string;
  tips?: string;
}

export async function generateDrill(issue: string, skillLevel?: string): Promise<GeneratedDrill> {
  if (!ENV.geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are an expert professional baseball coach with 20+ years of experience. 
Your task is to create a specific, actionable drill to address a baseball player's issue or skill gap.

When creating a drill, follow this EXACT format:
DRILL_NAME: [Name of the drill]
GOAL: [What this drill fixes or improves]
DIFFICULTY: [Easy/Medium/Hard]
DURATION: [Time needed, e.g., "10 minutes"]
SKILL_SET: [Main skill category, e.g., "Batting", "Fielding", "Pitching", "Base Running"]
EQUIPMENT: [What's needed, e.g., "Baseball, bat, cones"]
INSTRUCTIONS: [Step-by-step numbered instructions, be very detailed and specific]
TIPS: [Pro tips and common mistakes to avoid]

Make the drill specific, practical, and immediately actionable. Include exact distances, counts, and repetitions.`;

    const userPrompt = `Create a drill to fix this baseball issue: "${issue}"${skillLevel ? ` The player's skill level is: ${skillLevel}` : ""}

Remember to follow the exact format with DRILL_NAME:, GOAL:, DIFFICULTY:, DURATION:, SKILL_SET:, EQUIPMENT:, INSTRUCTIONS:, and TIPS: labels.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();

    // Parse the response
    const drill = parseDrillResponse(responseText);
    return drill;
  } catch (error) {
    console.error("[DrillGenerator] Error generating drill:", error);
    throw new Error(`Failed to generate drill: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function parseDrillResponse(text: string): GeneratedDrill {
  const lines = text.split("\n");
  const drill: Partial<GeneratedDrill> = {};

  for (const line of lines) {
    if (line.startsWith("DRILL_NAME:")) {
      drill.name = line.replace("DRILL_NAME:", "").trim();
    } else if (line.startsWith("GOAL:")) {
      drill.goal = line.replace("GOAL:", "").trim();
    } else if (line.startsWith("DIFFICULTY:")) {
      const difficulty = line.replace("DIFFICULTY:", "").trim();
      if (["Easy", "Medium", "Hard"].includes(difficulty)) {
        drill.difficulty = difficulty as "Easy" | "Medium" | "Hard";
      } else {
        drill.difficulty = "Medium";
      }
    } else if (line.startsWith("DURATION:")) {
      drill.duration = line.replace("DURATION:", "").trim();
    } else if (line.startsWith("SKILL_SET:")) {
      drill.skillSet = line.replace("SKILL_SET:", "").trim();
    } else if (line.startsWith("EQUIPMENT:")) {
      drill.equipment = line.replace("EQUIPMENT:", "").trim();
    } else if (line.startsWith("INSTRUCTIONS:")) {
      // Collect all lines until TIPS
      const instructionLines: string[] = [];
      let foundInstructions = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("INSTRUCTIONS:")) {
          foundInstructions = true;
          instructionLines.push(lines[i].replace("INSTRUCTIONS:", "").trim());
        } else if (foundInstructions && !lines[i].startsWith("TIPS:")) {
          instructionLines.push(lines[i]);
        } else if (lines[i].startsWith("TIPS:")) {
          break;
        }
      }
      drill.instructions = instructionLines.join("\n").trim();
    } else if (line.startsWith("TIPS:")) {
      const tipsLines: string[] = [];
      let foundTips = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("TIPS:")) {
          foundTips = true;
          tipsLines.push(lines[i].replace("TIPS:", "").trim());
        } else if (foundTips) {
          tipsLines.push(lines[i]);
        }
      }
      drill.tips = tipsLines.join("\n").trim();
    }
  }

  // Validate required fields
  if (!drill.name || !drill.goal || !drill.difficulty || !drill.duration || !drill.skillSet || !drill.instructions) {
    throw new Error("Failed to parse drill response - missing required fields");
  }

  return drill as GeneratedDrill;
}
