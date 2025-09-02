import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface SeverityAnalysisProps {
  mostSevereSymptoms: [string, number][];
}

export const SeverityAnalysis = React.memo<SeverityAnalysisProps>(({
  mostSevereSymptoms,
}) => {
  if (mostSevereSymptoms.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔥 Highest Severity Symptoms</Text>
      <Text style={styles.sectionSubtitle}>Average severity when experienced</Text>
      {mostSevereSymptoms.map(([symptom, avgSeverity]) => (
        <View key={symptom} style={styles.severityItem}>
          <Text style={styles.severityName}>{symptom}</Text>
          <View style={styles.severityBadge}>
            <Text style={styles.severityText}>{avgSeverity.toFixed(1)}/3</Text>
          </View>
        </View>
      ))}
    </View>
  );
});

SeverityAnalysis.displayName = 'SeverityAnalysis';

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
  severityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  severityName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  severityBadge: {
    backgroundColor: colors.red100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.red800,
  },
});