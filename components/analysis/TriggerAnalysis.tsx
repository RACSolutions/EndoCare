import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface TriggerAnalysisProps {
  topActivities: [string, number][];
}

export const TriggerAnalysis = React.memo<TriggerAnalysisProps>(({
  topActivities,
}) => {
  if (topActivities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Common Triggers & Activities</Text>
      <Text style={styles.sectionSubtitle}>Activities recorded with symptoms</Text>
      {topActivities.map(([activity, frequency]) => (
        <View key={activity} style={styles.activityItem}>
          <Text style={styles.activityName}>{activity}</Text>
          <Text style={styles.activityFrequency}>{frequency} times</Text>
        </View>
      ))}
    </View>
  );
});

TriggerAnalysis.displayName = 'TriggerAnalysis';

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
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  activityFrequency: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});