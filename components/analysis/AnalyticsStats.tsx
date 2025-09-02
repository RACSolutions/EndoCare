import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface AnalyticsStatsProps {
  totalEntries: number;
  totalUniqueSymptoms: number;
  avgSymptomsPerDay: number;
}

export const AnalyticsStats = React.memo<AnalyticsStatsProps>(({
  totalEntries,
  totalUniqueSymptoms,
  avgSymptomsPerDay,
}) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{totalEntries}</Text>
        <Text style={styles.statLabel}>Total Days</Text>
        <Text style={styles.statSubtext}>Tracked</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{totalUniqueSymptoms}</Text>
        <Text style={styles.statLabel}>Symptoms</Text>
        <Text style={styles.statSubtext}>Experienced</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{avgSymptomsPerDay.toFixed(1)}</Text>
        <Text style={styles.statLabel}>Avg Daily</Text>
        <Text style={styles.statSubtext}>Symptoms</Text>
      </View>
    </View>
  );
});

AnalyticsStats.displayName = 'AnalyticsStats';

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
});