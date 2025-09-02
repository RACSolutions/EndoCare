import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SymptomEntry } from '../types';
import { colors, symptomCategories } from '../utils/constants';
import { getSymptomsByCategory, isCustomSymptom } from '../utils/symptomUtils';

interface SymptomModalProps {
  isVisible: boolean;
  selectedCategory: string | null;
  currentEntry: SymptomEntry;
  onClose: () => void;
  onSymptomChange: (category: string, symptom: string, severity: number) => void;
  customSymptoms?: { [category: string]: string[] };
}

export const SymptomModal = React.memo<SymptomModalProps>(({
  isVisible,
  selectedCategory,
  currentEntry,
  onClose,
  onSymptomChange,
  customSymptoms = {},
}) => {
  if (!isVisible || !selectedCategory) return null;
  
  const category = symptomCategories[selectedCategory];
  const allSymptoms = getSymptomsByCategory(selectedCategory, customSymptoms);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {category.icon} {category.name}
          </Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close symptom modal"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalScrollView} 
          showsVerticalScrollIndicator={true}
          indicatorStyle="default"
        >
          {/* Severity explanation */}
          <View style={styles.severityExplanation}>
            <Text style={styles.explanationText}>Tap 1 (Low) • 2 (Medium) • 3 (High) to rate severity</Text>
            <Text style={styles.scrollHint}>↓ Scroll to see all symptoms ↓</Text>
          </View>
          
          {allSymptoms.map(symptom => {
            const currentSeverity = currentEntry.symptoms[selectedCategory]?.[symptom] || 0;
            const isCustom = isCustomSymptom(selectedCategory, symptom, customSymptoms);

            return (
              <View key={symptom} style={styles.modalSymptomRow}>
                <View style={styles.symptomNameContainer}>
                  <Text style={styles.modalSymptomName}>{symptom}</Text>
                  {isCustom && <Text style={styles.customSymptomBadge}>Custom</Text>}
                </View>
                <View style={styles.modalSeverityButtons}>
                  {[1, 2, 3].map(level => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => {
                        onSymptomChange(selectedCategory, symptom, currentSeverity === level ? 0 : level);
                      }}
                      style={[
                        styles.modalSeverityButton,
                        { borderColor: currentSeverity === level ? colors.primary : colors.gray300 },
                        currentSeverity === level && { backgroundColor: colors.primary }
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${symptom} severity level ${level}${currentSeverity === level ? ', selected' : ''}`}
                      accessibilityHint={`Set ${symptom.toLowerCase()} severity to ${level === 1 ? 'low' : level === 2 ? 'medium' : 'high'}`}
                    >
                      <Text style={[
                        styles.modalSeverityText,
                        { color: currentSeverity === level ? colors.white : colors.gray600 }
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity 
          onPress={onClose} 
          style={styles.modalDoneButton}
          accessibilityRole="button"
          accessibilityLabel="Done editing symptoms"
        >
          <Text style={styles.modalDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

SymptomModal.displayName = 'SymptomModal';

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 0,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.gray500,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  severityExplanation: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.gray50,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  scrollHint: {
    fontSize: 10,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalSymptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  modalSymptomName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray700,
  },
  modalSeverityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSeverityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSeverityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  symptomNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  customSymptomBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
});