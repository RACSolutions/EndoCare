import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface SymptomFrequencyProps {
  topSymptoms: [string, number][];
  totalEntries: number;
}

export const SymptomFrequency = React.memo<SymptomFrequencyProps>(({
  topSymptoms,
  totalEntries,
}) => {
  if (topSymptoms.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Most Common Symptoms</Text>
        <Text style={styles.noDataText}>Start tracking symptoms to see analysis</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Most Common Symptoms</Text>
      <Text style={styles.sectionSubtitle}>How often symptoms appear</Text>
      {topSymptoms.map(([symptom, frequency]) => (
        <View key={symptom} style={styles.frequencyItem}>
          <Text style={styles.frequencyName}>{symptom}</Text>
          <View style={styles.frequencyBarContainer}>
            <View 
              style={[
                styles.frequencyFill,
                { width: `${(frequency / totalEntries) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.frequencyText}>{frequency} days</Text>
        </View>
      ))}
    </View>
  );
});

SymptomFrequency.displayName = 'SymptomFrequency';

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
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  frequencyName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  frequencyBarContainer: {
    flex: 2,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  frequencyFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  frequencyText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'right',
  },
});