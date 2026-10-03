import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/theme";

export interface TrendBarDatum {
  id: string;
  label: string;
  value: number;
}

interface TrendBarChartProps {
  data: TrendBarDatum[];
  color: string;
  formatValue: (value: number) => string;
  scaleFromMinimum?: boolean;
}

export const TrendBarChart: React.FC<TrendBarChartProps> = ({
  data,
  color,
  formatValue,
  scaleFromMinimum = false,
}) => {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const minimum = Math.min(...data.map((item) => item.value));
  const range = maximum - minimum;

  return (
    <View style={styles.chart} accessibilityRole="image">
      {data.map((item) => {
        const height = scaleFromMinimum
          ? range === 0
            ? 62
            : 32 + ((item.value - minimum) / range) * 68
          : Math.max(4, (item.value / maximum) * 100);

        return (
          <View key={item.id} style={styles.column}>
            <Text style={styles.valueLabel} numberOfLines={1}>
              {formatValue(item.value)}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${height}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.dateLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    minHeight: 158,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  valueLabel: {
    width: "100%",
    height: 18,
    textAlign: "center",
    color: Colors.light.textSecondary,
    fontSize: 10,
    fontWeight: Typography.weights.medium,
  },
  barTrack: {
    width: "100%",
    height: 104,
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  bar: {
    width: "62%",
    minHeight: 3,
    alignSelf: "center",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dateLabel: {
    width: "100%",
    height: 18,
    marginTop: 4,
    textAlign: "center",
    color: Colors.light.textMuted,
    fontSize: 10,
  },
});
