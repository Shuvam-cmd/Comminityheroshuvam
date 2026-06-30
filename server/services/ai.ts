import { GoogleGenAI } from "@google/genai";
import { Issues, IIssue } from "../db/collections";

// Initialize the Gemini API client lazily to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    } else {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined. AI analysis will run in Mock Fallback mode.");
    }
  }
  return aiClient;
}

// Haversine formula to calculate distance between two coordinates in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export interface IAiAnalysisResult {
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  department: string;
  description: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
}

export async function analyzeReport(
  description: string,
  imageBuffer?: Buffer,
  imageMimeType?: string,
  location?: { latitude: number; longitude: number }
): Promise<IAiAnalysisResult> {
  const client = getAiClient();

  let analysis: Omit<IAiAnalysisResult, "isDuplicate"> = {
    title: "Public Infrastructure Issue",
    category: "Infrastructure",
    priority: "Medium",
    department: "Public Works Department",
    description: description || "Reported community issue requiring inspection."
  };

  if (client) {
    try {
      const contents: any[] = [];
      let prompt = `You are an AI civic assistant for "Community Hero". Your job is to analyze community issues reported by citizens and categorize them.
      `;

      if (description) {
        prompt += `The citizen provided the following brief note/description: "${description}"\n`;
      }

      prompt += `Analyze the input and provide:
      1. A concise, clear title (e.g. "Pothole near Elm St", "Damaged Streetlight", "Illegal Trash Dumping").
      2. The correct category. Choose from: "Roads & Potholes", "Streetlights & Electricity", "Water Leakage & Sewage", "Garbage & Sanitation", "Public Parks & Trees", "Vandalism & Safety", "Other".
      3. The priority level. Choose from: "Low", "Medium", "High", "Urgent".
      4. The recommended Municipal Department to handle this issue (e.g. "Department of Transportation", "Sanitation Department", "Water & Sewage Board", "Parks & Recreation Department", "Energy & Power Department").
      5. An automatic professional issue description that clarifies the danger, inconvenience, and what needs fixing. Keep it polite, objective, and action-oriented.
      
      Respond STRICTLY in JSON format with keys: title, category, priority, department, description.`;

      contents.push(prompt);

      if (imageBuffer && imageMimeType) {
        contents.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBuffer.toString("base64")
          }
        });
      }

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              category: { type: "STRING" },
              priority: { type: "STRING", enum: ["Low", "Medium", "High", "Urgent"] },
              department: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["title", "category", "priority", "department", "description"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const result = JSON.parse(responseText);
        analysis = {
          title: result.title || analysis.title,
          category: result.category || analysis.category,
          priority: result.priority || analysis.priority,
          department: result.department || analysis.department,
          description: result.description || analysis.description
        };
      }
    } catch (err) {
      console.error("Gemini API Error, using heuristic fallback:", err);
      // Heuristic fallback if API fails
      analysis = heuristicAnalysis(description);
    }
  } else {
    // Local fallback if no Gemini Key configured
    analysis = heuristicAnalysis(description);
  }

  // Duplicate Check Bonus
  let isDuplicate = false;
  let duplicateOfId: string | undefined;

  if (location && location.latitude && location.longitude) {
    const activeIssues = await Issues.find({ status: "Pending" });
    for (const issue of activeIssues) {
      // Check if within 200 meters AND same category
      if (issue.category === analysis.category) {
        const dist = getDistanceMeters(
          location.latitude,
          location.longitude,
          issue.latitude,
          issue.longitude
        );
        if (dist <= 200) {
          isDuplicate = true;
          duplicateOfId = issue.id;
          break;
        }
      }
    }
  }

  return {
    ...analysis,
    isDuplicate,
    duplicateOfId
  };
}

// Simple local heuristic analysis when Gemini is unavailable
function heuristicAnalysis(text: string): Omit<IAiAnalysisResult, "isDuplicate"> {
  const normText = (text || "").toLowerCase();
  let category = "Other";
  let priority: "Low" | "Medium" | "High" | "Urgent" = "Medium";
  let department = "Public Works Department";
  let title = "Civic Problem Report";

  if (normText.includes("pothole") || normText.includes("road") || normText.includes("asphalt")) {
    category = "Roads & Potholes";
    priority = "High";
    department = "Department of Transportation";
    title = "Road Surface Pothole";
  } else if (normText.includes("light") || normText.includes("bulb") || normText.includes("electricity") || normText.includes("dark")) {
    category = "Streetlights & Electricity";
    priority = "Medium";
    department = "Energy & Power Department";
    title = "Damaged Streetlight";
  } else if (normText.includes("water") || normText.includes("leak") || normText.includes("pipe") || normText.includes("sewage")) {
    category = "Water Leakage & Sewage";
    priority = "Urgent";
    department = "Water & Sewage Board";
    title = "Water Line Leakage";
  } else if (normText.includes("garbage") || normText.includes("trash") || normText.includes("bin") || normText.includes("dump")) {
    category = "Garbage & Sanitation";
    priority = "Medium";
    department = "Sanitation Department";
    title = "Accumulated Waste Dumping";
  } else if (normText.includes("tree") || normText.includes("park") || normText.includes("branch") || normText.includes("grass")) {
    category = "Public Parks & Trees";
    priority = "Low";
    department = "Parks & Recreation Department";
    title = "Park Maintenance Request";
  } else if (normText.includes("graffiti") || normText.includes("vandal") || normText.includes("broken glass") || normText.includes("theft")) {
    category = "Vandalism & Safety";
    priority = "High";
    department = "Community Safety & Security";
    title = "Vandalism or Safety Hazard";
  }

  return {
    title,
    category,
    priority,
    department,
    description: text || "A hyperlocal problem reported for inspection and repair."
  };
}
