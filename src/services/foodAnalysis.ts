const API_URL =
  "https://ai-nutrition-tracker-api-phi.vercel.app/api/analyze-food";

export interface CapturedImageData {
  base64: string;
  mimeType: string;
}

const capturedImages = new Map<string, CapturedImageData>();\n\nexport async function loadCapturedImage(uri: string, mimeType = "image/jpeg"): Promise<CapturedImageData> {\n  const cached = getCapturedImage(uri);\n  if (cached?.base64) return cached;\n  if (!uri) throw new Error("No image was selected. Please choose a photo again.");\n\n  try {\n    const { File } = await import("expo-file-system");\n    const file = new File(uri);\n    const base64 = await file.base64();\n    if (!base64) throw new Error("The selected image could not be read.");\n    const data = { base64, mimeType };\n    storeCapturedImage(uri, base64, mimeType);\n    return data;\n  } catch (error) {\n    console.error("Failed to read captured image:", error);\n    throw new Error("The selected image could not be read. Please choose the photo again.");\n  }\n}

export function storeCapturedImage(
  uri: string,
  base64: string,
  mimeType: string = "image/jpeg",
): void {
  capturedImages.set(uri, { base64, mimeType });
}

export function getCapturedImage(uri: string): CapturedImageData | null {
  return capturedImages.get(uri) ?? null;
}

export interface FoodAnalysis {
  foodName: string;
  confidence: number;
  servingEstimate: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  notes: string;
}

export interface AnalyzeFoodResult {
  success: boolean;
  estimated: boolean;
  model: string;
  analysis: FoodAnalysis;
}

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string = "image/jpeg",
): Promise<AnalyzeFoodResult> {
  if (!base64Image) {
    throw new Error("The selected image is no longer available. Please retake the photo.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64Image,
      mimeType,
    }),
  });

  const data = (await response.json()) as
    | AnalyzeFoodResult
    | { error?: string; message?: string };

  if (!response.ok) {
    const message =
      "message" in data && data.message
        ? data.message
        : "Unable to analyze the food image.";

    throw new Error(message);
  }

  if (!("analysis" in data)) {
    throw new Error("The AI returned an invalid response.");
  }

  return data;
}
