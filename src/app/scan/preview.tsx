import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { PhotoPreview } from "../../components/PhotoPreview";
import { SecondaryButton } from "../../components/SecondaryButton";
import { Colors } from "../../constants/theme";
import {
  CapturedImageData,
  FoodAnalysis,
  getCapturedImage,
} from "../../services/foodAnalysis";
import { persistPhotoFromBase64 } from "../../services/imageStorage";

export default function ScanPhotoPreviewScreen() {
  const params = useLocalSearchParams<{ photoUri?: string | string[] }>();
  const rawPhotoUri = Array.isArray(params.photoUri)
    ? params.photoUri[0]
    : params.photoUri;

  const cached = getCapturedImage(rawPhotoUri);
  const photoUri = rawPhotoUri || cached?.uri || "";

  if (!photoUri && !cached?.base64) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No photo captured</Text>
        <SecondaryButton title="Back to Camera" onPress={() => router.back()} />
      </View>
    );
  }

  const handleRetake = () => {
    router.back();
  };

  const handleUseResult = async (
    analysis: FoodAnalysis,
    image: CapturedImageData,
  ) => {
    try {
      // Persist the exact bytes that were analyzed, before leaving the preview.
      // The picker URI may be an expired cache/content URI by this point.
      const stablePhotoUri = await persistPhotoFromBase64(
        image.base64,
        "image/jpeg",
      );

      router.replace({
        pathname: "/food/add",
        params: {
          photoUri: stablePhotoUri,
          foodName: analysis.foodName,
          calories: String(Math.round(analysis.calories)),
          protein: String(analysis.protein),
          carbs: String(analysis.carbs),
          fat: String(analysis.fat),
          fiber: String(analysis.fiber),
          servingEstimate: String(analysis.servingEstimate),
          servingUnit: analysis.servingUnit,
          notes: analysis.notes || "",
        },
      });
    } catch {
      Alert.alert(
        "Photo Could Not Be Saved",
        "The analyzed photo could not be saved. Please retake or choose it again.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <PhotoPreview
        key={photoUri}
        photoUri={photoUri}
        onRetake={handleRetake}
        onUseResult={handleUseResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
});
