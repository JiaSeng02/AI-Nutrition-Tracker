import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { formatMonthYear, getDayItemsAround, parseISODate, formatDateToISO, getTodayISOString } from '../utils/date';

interface DateSelectorProps {
  selectedDateStr: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDateStr,
  onSelectDate,
}) => {
  const selectedDate = useMemo(() => parseISODate(selectedDateStr), [selectedDateStr]);
  const todayStr = useMemo(() => getTodayISOString(), []);

  // Generate 7 days centered around selected date (3 days before, 3 days after)
  const days = useMemo(() => getDayItemsAround(selectedDate, 3, 3), [selectedDate]);

  const handlePrevMonth = () => {
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onSelectDate(formatDateToISO(prevMonth));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onSelectDate(formatDateToISO(nextMonth));
  };

  const handleJumpToToday = () => {
    onSelectDate(todayStr);
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.monthText}>{formatMonthYear(selectedDate)}</Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>

        {selectedDateStr !== todayStr && (
          <TouchableOpacity onPress={handleJumpToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Days Strip */}
      <View style={styles.daysRow}>
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDateStr;
          return (
            <TouchableOpacity
              key={item.dateStr}
              activeOpacity={0.7}
              onPress={() => onSelectDate(item.dateStr)}
              style={[
                styles.dayPill,
                isSelected && styles.dayPillSelected,
              ]}>
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                ]}>
                {item.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}>
                {item.dayNumber}
              </Text>
              {item.isToday && (
                <View
                  style={[
                    styles.todayDot,
                    isSelected && { backgroundColor: Colors.light.textInverse },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    position: 'relative',
  },
  arrowButton: {
    padding: Spacing.xs,
  },
  monthText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginHorizontal: Spacing.md,
  },
  todayButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: Colors.light.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  todayButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primaryDark,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: 4,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  dayPillSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  dayTextSelected: {
    color: Colors.light.textInverse,
  },
  dayNumberSelected: {
    color: Colors.light.textInverse,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
    marginTop: 4,
  },
});
