import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

type TimeFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface TimeFilterSelectorProps {
  selectedTimeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

const timeFilterOptions = [
  { key: '30d', label: '30 Days', days: 30 },
  { key: '3m', label: '3 Months', days: 90 },
  { key: '6m', label: '6 Months', days: 180 },
  { key: '1y', label: '1 Year', days: 365 },
  { key: 'all', label: 'All Time', days: null },
];

export const TimeFilterSelector = React.memo<TimeFilterSelectorProps>(({
  selectedTimeFilter,
  onFilterChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Analysis Period</Text>
      <Text style={styles.scrollHint}>👆 Scroll to see more options →</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        <View style={styles.filterContainer}>
          {timeFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                selectedTimeFilter === option.key && styles.filterButtonActive
              ]}
              onPress={() => onFilterChange(option.key as TimeFilter)}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} time period`}
              accessibilityState={{ selected: selectedTimeFilter === option.key }}
            >
              <Text style={[
                styles.filterButtonText,
                selectedTimeFilter === option.key && styles.filterButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

TimeFilterSelector.displayName = 'TimeFilterSelector';

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  scrollHint: {
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filterScrollView: {
    marginHorizontal: -8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
});