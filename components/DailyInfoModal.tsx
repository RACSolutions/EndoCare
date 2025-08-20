import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useEndoData } from '../hooks/useEndoData';
import { colors, symptomCategories } from '../utils/constants';

interface DailyInfoModalProps {
  isVisible: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  onEdit?: (date: Date) => void;
}

export const DailyInfoModal: React.FC<DailyInfoModalProps> = ({
  isVisible,
  selectedDate,
  onClose,
  onEdit,
}) => {
  const { getCurrentEntry, entries, refreshEntries } = useEndoData();
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a stable date string for dependency tracking
  const selectedDateString = selectedDate ? selectedDate.toISOString().split('T')[0] : null;

  // Helper functions defined at the top
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getSeverityText = (severity: number): string => {
    switch (severity) {
      case 1: return 'Mild';
      case 2: return 'Moderate';
      case 3: return 'Severe';
      default: return '';
    }
  };

  const getSeverityColor = (severity: number): string => {
    switch (severity) {
      case 1: return colors.primary;
      case 2: return '#ff9500';
      case 3: return '#ff3b30';
      default: return colors.gray500;
    }
  };
  
  // Force refresh when modal becomes visible or date changes
  useEffect(() => {
    if (isVisible && selectedDate) {
      const refreshModalData = async () => {
        setIsLoading(true);
        console.log('Modal opened - forcing hard refresh for:', selectedDate.toLocaleDateString());
        
        // Force refresh entries from AsyncStorage
        await refreshEntries();
        setIsLoading(false);
      };
      
      refreshModalData();
    }
  }, [isVisible, selectedDateString]);

  // Update current entry when entries change or modal opens
  useEffect(() => {
    if (selectedDate && !isLoading) {
      const entry = getCurrentEntry(selectedDate);
      console.log('Updating current entry:', entry);
      console.log('noSymptomsRecorded value:', entry.noSymptomsRecorded);
      setCurrentEntry(entry);
    }
  }, [entries, selectedDate, isLoading]);

  // Early returns to prevent unnecessary rendering
  if (!isVisible) {
    return null;
  }
  
  if (!selectedDate) {
    return null;
  }
  
  if (isLoading || !currentEntry) {
    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
        transparent={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Daily Summary</Text>
              <Text style={styles.headerDate}>{formatDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  const hasSymptoms = currentEntry && Object.keys(currentEntry.symptoms || {}).length > 0;
  const hasActivities = (currentEntry && currentEntry.activities && currentEntry.activities.length > 0) || 
                      (currentEntry && currentEntry.customActivities && currentEntry.customActivities.trim());
  const hasNotes = currentEntry && currentEntry.notes && currentEntry.notes.trim();
  const hasNoSymptomsRecorded = currentEntry && currentEntry.noSymptomsRecorded === true;

  const hasData = hasSymptoms || hasActivities || hasNotes || hasNoSymptomsRecorded;

  console.log('Modal render - hasData:', hasData, 'currentEntry:', currentEntry);
  console.log('noSymptomsRecorded check:', currentEntry?.noSymptomsRecorded);
  console.log('noSymptomsRecorded type:', typeof currentEntry?.noSymptomsRecorded);

  const renderNoSymptomsBanner = () => {
    if (!hasNoSymptomsRecorded) return null;

    return (
      <View style={styles.noSymptomsBanner}>
        <Text style={styles.noSymptomsBannerIcon}>✅</Text>
        <View style={styles.noSymptomsBannerTextContainer}>
          <Text style={styles.noSymptomsBannerTitle}>No Symptoms Recorded</Text>
          <Text style={styles.noSymptomsBannerText}>
            You recorded that you felt well on this day with no symptoms to track.
          </Text>
        </View>
      </View>
    );
  };

  const renderSymptoms = () => {
    const symptoms = currentEntry.symptoms || {};
    const symptomEntries = Object.entries(symptoms);
    if (symptomEntries.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌟 Symptoms</Text>
        {symptomEntries.map(([categoryKey, categorySymptoms]) => {
          const category = symptomCategories[categoryKey];
          if (!category || !categorySymptoms || Object.keys(categorySymptoms).length === 0) return null;

          return (
            <View key={categoryKey} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.icon} {category.name}
              </Text>
              <View style={styles.symptomsGrid}>
                {Object.entries(categorySymptoms).map(([symptom, severity]) => (
                  <View key={symptom} style={styles.symptomItem}>
                    <Text style={styles.symptomName}>{symptom}</Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(severity as number) }
                    ]}>
                      <Text style={styles.severityText}>
                        {getSeverityText(severity as number)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderActivities = () => {
    const hasActivities = currentEntry.activities && Array.isArray(currentEntry.activities) && currentEntry.activities.length > 0;
    const hasCustomActivities = currentEntry.customActivities && typeof currentEntry.customActivities === 'string' && currentEntry.customActivities.trim();
    
    if (!hasActivities && !hasCustomActivities) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Activities & Triggers</Text>
        
        {hasActivities && (
          <View style={styles.activitiesGrid}>
            {currentEntry.activities.map((activity, index) => (
              <View key={`activity-${index}`} style={styles.activityItem}>
                <Text style={styles.activityText}>{String(activity)}</Text>
              </View>
            ))}
          </View>
        )}
        
        {hasCustomActivities && (
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>Other Activities:</Text>
            <Text style={styles.customText}>{String(currentEntry.customActivities)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderNotes = () => {
    if (!currentEntry.notes || typeof currentEntry.notes !== 'string' || !currentEntry.notes.trim()) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💭 Daily Notes</Text>
        <Text style={styles.notesText}>{String(currentEntry.notes)}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Daily Summary</Text>
            <Text style={styles.headerDate}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            {renderNoSymptomsBanner()}
            {renderSymptoms()}
            {renderActivities()}
            {renderNotes()}
            {!hasData && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataTitle}>No data recorded</Text>
                <Text style={styles.noDataText}>
                  No symptoms, activities, or notes were recorded for this day.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Edit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (onEdit && selectedDate) {
                onEdit(selectedDate);
              }
            }}
          >
            <Text style={styles.editButtonText}>✏️ Edit This Day</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
  },
  headerDate: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.gray500,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  symptomsGrid: {
    gap: 8,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  symptomName: {
    fontSize: 14,
    color: colors.gray700,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activityText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  customSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  customTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 4,
  },
  customText: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray500,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  // No Symptoms Banner Styles
  noSymptomsBanner: {
    backgroundColor: '#e6f7e6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  noSymptomsBannerIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  noSymptomsBannerTextContainer: {
    flex: 1,
  },
  noSymptomsBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  noSymptomsBannerText: {
    fontSize: 14,
    color: '#16a34a',
    lineHeight: 18,
  },
});