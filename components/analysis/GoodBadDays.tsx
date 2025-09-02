import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface GoodBadDaysProps {
  goodDays: number;
  badDays: number;
  expectedTotalDays: number;
}

export const GoodBadDays = React.memo<GoodBadDaysProps>(({
  goodDays,
  badDays,
  expectedTotalDays,
}) => {
  const unrecordedDays = Math.max(0, expectedTotalDays - goodDays - badDays);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>😊 Good vs Bad Days</Text>
      <View style={styles.spacer} />
      <View style={styles.goodBadContainer}>
        <View style={styles.goodBadItem}>
          <View style={[styles.goodBadCircle, { backgroundColor: '#4ade80' }]}>
            <Text style={styles.goodBadNumber}>{goodDays}</Text>
          </View>
          <Text style={styles.goodBadLabel}>Symptom-Free Days</Text>
          <Text style={styles.goodBadSubtext}>(recorded)</Text>
        </View>
        <View style={styles.goodBadItem}>
          <View style={[styles.goodBadCircle, { backgroundColor: colors.red800 }]}>
            <Text style={styles.goodBadNumber}>{badDays}</Text>
          </View>
          <Text style={styles.goodBadLabel}>Days with Symptoms</Text>
          <Text style={styles.goodBadSubtext}>(recorded)</Text>
        </View>
      </View>
      
      {unrecordedDays > 0 && (
        <>
          <View style={styles.spacer} />
          <View style={styles.unrecordedContainer}>
            <Text style={styles.unrecordedText}>
              📝 {unrecordedDays} days not recorded
            </Text>
            <Text style={styles.unrecordedSubtext}>
              Tip: Use &quot;No Symptoms&quot; button on good days for better tracking
            </Text>
          </View>
        </>
      )}
    </View>
  );
});

GoodBadDays.displayName = 'GoodBadDays';

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
  spacer: {
    height: 12,
  },
  goodBadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  goodBadItem: {
    alignItems: 'center',
    flex: 1,
  },
  goodBadCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  goodBadNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  goodBadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 2,
  },
  goodBadSubtext: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
  unrecordedContainer: {
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  unrecordedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 4,
  },
  unrecordedSubtext: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
});