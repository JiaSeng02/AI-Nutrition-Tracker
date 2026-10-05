import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Colors,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from "../constants/theme";
import {
  analyzeFoodImage,
  getCapturedImage,
  FoodAnalysis,
} from "../services/foodAnalysis";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

interface PhotoPreviewProps {
  photoUri: string;
  onRetake: () => void;
  onUseResult: (analysis: FoodAnalysis) => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photoUri,
  onRetake,
  onUseResult,
}) => {
  const [imageData, setImageData] = useState(getCapturedImage(photoUri));
  const [isLoadingImage, setIsLoadingImage] = useState(!getCapturedImage(photoUri));
  const [imageError, setImageError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);

  useEffect(() => {
    let active = true;

    const loadImage = async () => {
      try {
        setIsLoadingImage(true);
        setImageError(null);
        const data = await loadCapturedImage(photoUri);
        if (active) {
          setImageData(data);
        }
      } catch (error) {
        if (active) {
          setImageError(
            error instanceof Error
              ? error.message
              : "Unable to load the selected photo.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingImage(false);
        }
      }
    };

    if (!imageData?.base64) {
      void loadImage();
    } else {
      setIsLoadingImage(false);
    }

    return () => {
      active = false;
    };
  }, [photoUri]);

  const previewSource = imageData?.base64
    ? `data:${imageData.mimeType};base64,${imageData.base64}`
    : photoUri;

  const handleAnalyze = async () => {
    if (isAnalyzing) return;

    try {
      setIsAnalyzing(true);

      const data = imageData?.base64
        ? imageData
        : await loadCapturedImage(photoUri);

      setImageData(data);

      const result = await analyzeFoodImage(data.base64, data.mimeType);
      setAnalysis(result.analysis);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to analyze the food image.";

      Alert.alert("Analysis Failed", message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseResult = () => {
    if (analysis) {
      onUseResult(analysis);
    }
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="sparkles" size={32} color={Colors.light.primary} />
        </View>
        <ActivityIndicator
          size="large"
          color={Colors.light.primary}
          style={styles.spinner}
        />
        <Text style={styles.loadingTitle}>Analyzing your meal...</Text>
        <Text style={styles.loadingSubtitle}>
          AI is identifying the food and estimating its nutrition.
        </Text>
        <Text style={styles.estimateNotice}>
          Nutrition values are AI estimates and may not be exact.
        </Text>
      </View>
    );
  }

  if (analysis) {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={15} color={Colors.light.primary} />
            <Text style={styles.aiBadgeText}>AI Estimated</Text>
          </View>
        </View>

        <View style={styles.imageCardSmall}>
          <Image
            source={previewSource}
            style={styles.image}
            contentFit="cover"
          />
        </View>

        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{analysis.foodName}</Text>
          <Text style={styles.confidence}>
            {Math.round(analysis.confidence * 100)}% confidence
          </Text>
        </View>

        <View style={styles.nutritionCard}>
          <NutritionValue
            label="Calories"
            value={`${Math.round(analysis.calories)} kcal`}
          />
          <NutritionValue label="Protein" value={`${analysis.protein} g`} />
          <NutritionValue label="Carbs" value={`${analysis.carbs} g`} />
          <NutritionValue label="Fat" value={`${analysis.fat} g`} />
          <NutritionValue label="Fiber" value={`${analysis.fiber} g`} />
        </View>

        <View style={styles.servingRow}>
          <Ionicons
            name="restaurant-outline"
            size={18}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.servingText}>
            Estimated serving: {analysis.servingEstimate} {analysis.servingUnit}
          </Text>
        </View>

        {!!analysis.notes && <Text style={styles.notes}>{analysis.notes}</Text>}

        <Text style={styles.estimateNotice}>
          These nutrition values are estimates. Review them before adding them to your diary.
        </Text>

        <View style={styles.actionsRow}>
          <SecondaryButton
            title="Retake"
            icon="refresh-outline"
            onPress={onRetake}
            variant="outline"
            style={styles.retakeButton}
          />
          <PrimaryButton
            title="Use This Result"
            icon="checkmark"
            onPress={handleUseResult}
            style={styles.continueButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageCard}>
        <Image
          source={previewSource}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />

        {isLoadingImage && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.imageLoadingText}>Loading photo...</Text>
          </View>
        )}

        {imageError && (
          <View style={styles.imageErrorOverlay}>
            <Ionicons
              name="image-outline"
              size={34}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.imageErrorText}>{imageError}</Text>
          </View>
        )}

        <View style={styles.badge}>
          <Ionicons
            name="camera"
            size={14}
            color={Colors.light.textInverse}
          />
          <Text style={styles.badgeText}>Food Photo</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.title}>Food photo captured</Text>
        <Text style={styles.subtitle}>
          Let AI identify the food and estimate its nutrition for you.
        </Text>
      </View>

      <View style={styles.actionsColumn}>
        <PrimaryButton
          title="Analyze Food"
          icon="sparkles"
          onPress={handleAnalyze}
          disabled={isLoadingImage || !!imageError}
        />
        <SecondaryButton
          title="Retake"
          icon="refresh-outline"
          onPress={onRetake}
          variant="outline"
        />
      </View>
    </View>
  );
};

interface NutritionValueProps {
  label: string;
  value: string;
}

const NutritionValue: React.FC<NutritionValueProps> = ({ label, value }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionValue}>{value}</Text>
    <Text style={styles.nutritionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
  },
  resultContainer: {
    flex: 1,
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginVertical: Spacing.lg,
  },
  loadingTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  loadingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  resultHeader: {
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.full,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.light.primaryDark,
  },
  imageCard: {
    width: "100%",
    height: 380,
    borderRadius: Radii.xl,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: "relative",
    ...Shadows.card,
  },
  imageCardSmall: {
    width: "100%",
    height: 180,
    borderRadius: Radii.xl,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceSecondary,
    marginBottom: Spacing.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 6,
  },
  badgeText: {
    color: Colors.light.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  infoSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  foodHeader: {
    marginBottom: Spacing.md,
  },
  foodName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  confidence: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  nutritionCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  nutritionItem: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  nutritionValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  servingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: Spacing.md,
  },
  servingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
  },
  notes: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  estimateNotice: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.md,
  },
  actionsColumn: {
    gap: Spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: "auto",
  },
  retakeButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1.5,
  },
});
