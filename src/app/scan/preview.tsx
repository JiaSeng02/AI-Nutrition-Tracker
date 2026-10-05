import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PhotoPreview } from "../../components/PhotoPreview";
import { SecondaryButton } from "../../components/SecondaryButton";
import { Colors } from "../../constants/theme";
import { FoodAnalysis } from "../../services/foodAnalysis";

export default function ScanPhotoPreviewScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  if (!photoUri) {
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

  const handleUseResult = (analysis: FoodAnalysis) => {
    router.replace({
      pathname: "/food/add",
      params: {
        photoUri,
        foodName: analysis.foodName,
        calories: String(analysis.calories),
        protein: String(analysis.protein),
        carbs: String(analysis.carbs),
        fat: String(analysis.fat),
        fiber: String(analysis.fiber),
        servingEstimate: String(analysis.servingEstimate),
        servingUnit: analysis.servingUnit,
      },
    });
  };

  return (
    <View style={styles.container}>
      <PhotoPreview
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
