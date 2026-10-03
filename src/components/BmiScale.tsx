import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/theme";
import { getAdultBmiScalePosition } from "../utils/health";

interface BmiScaleProps {
  bmi: number;
}

export const BmiScale: React.FC<BmiScaleProps> = ({ bmi }) => {
  const markerPosition = getAdultBmiScalePosition(bmi);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`BMI ${bmi.toFixed(1)} on adult BMI scale`}
    >
      <View style={styles.track}>
        <View
          style={[
            styles.zone,
            { flex: 2.5, backgroundColor: Colors.light.info },
          ]}
        />
        <View
          style={[
            styles.zone,
            { flex: 6.5, backgroundColor: Colors.light.success },
          ]}
        />
        <View
          style={[
            styles.zone,
            { flex: 5, backgroundColor: Colors.light.warning },
          ]}
        />
        <View
          style={[
            styles.zone,
            { flex: 10, backgroundColor: Colors.light.danger },
          ]}
        />
        <View style={[styles.marker, { left: `${markerPosition}%` }]}>
          <View style={styles.markerDot} />
        </View>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Below 18.5</Text>
        <Text style={styles.legendLabel}>18.5-24.9</Text>
        <Text style={styles.legendLabel}>25-29.9</Text>
        <Text style={styles.legendLabel}>30+</Text>
      </View>
      <View style={styles.endLabels}>
        <Text style={styles.endLabel}>BMI 16</Text>
        <Text style={styles.endLabel}>BMI 40+</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 12,
    flexDirection: "row",
    overflow: "visible",
    borderRadius: 6,
    marginHorizontal: 4,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  zone: {
    height: 12,
  },
  marker: {
    position: "absolute",
    top: -5,
    width: 4,
    height: 22,
    marginLeft: -2,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.surface,
    backgroundColor: Colors.light.textPrimary,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 2,
    marginTop: Spacing.xs,
  },
  legendLabel: {
    flex: 1,
    color: Colors.light.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },
  endLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  endLabel: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
  },
});
