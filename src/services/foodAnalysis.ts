import * as FileSystem from "expo-file-system/legacy";

const API_URL =
  "https://ai-nutrition-tracker-api-phi.vercel.app/api/analyze-food";

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

function getMimeType(uri: string): string {
  const extension = uri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

async function getBase64Image(uri: string): Promise<string> {
  const fileName = `food-analysis-${Date.now()}.jpg`;
  const destination = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.copyAsync({
    from: uri,
    to: destination,
  });

  try {
    return await FileSystem.readAsStringAsync(destination, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } finally {
    await FileSystem.deleteAsync(destination, {
      idempotent: true,
    });
  }
}

export async function analyzeFoodImage(
  photoUri: string,
): Promise<AnalyzeFoodResult> {
  const image = await getBase64Image(photoUri);
  const mimeType = getMimeType(photoUri);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image,
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
