import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { activityCategories, colors, symptomCategories } from '../utils/constants';

interface FilterModalProps {
  isVisible: boolean;
  filterType: 'symptoms' | 'activities';
  selectedFilters: string[];
  onClose: () => void;
  onApplyFilters: (filters: string[]) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isVisible,
  filterType,
  selectedFilters,
  onClose,
  onApplyFilters,
}) => {
  const [tempFilters, setTempFilters] = useState<string[]>(selectedFilters);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleFilter = (item: string) => {
    setTempFilters(prev => 
      prev.includes(item) 
        ? prev.filter(f => f !== item)
        : [...prev, item]
    );
  };

  const toggleCategory = (categoryKey: string) => {
    const category = symptomCategories[categoryKey];
    if (!category) return;

    const allCategorySymptoms = category.symptoms;
    const categorySelected = allCategorySymptoms.every(symptom => 
      tempFilters.includes(symptom)
    );

    if (categorySelected) {
      // Deselect all symptoms in this category
      setTempFilters(prev => 
        prev.filter(filter => !allCategorySymptoms.includes(filter))
      );
    } else {
      // Select all symptoms in this category
      setTempFilters(prev => {
        const filtered = prev.filter(filter => !allCategorySymptoms.includes(filter));
        return [...filtered, ...allCategorySymptoms];
      });
    }
  };

  const toggleCategoryExpansion = (categoryKey: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(cat => cat !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const handleDone = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleCancel = () => {
    setTempFilters(selectedFilters);
    setExpandedCategories([]);
    onClose();
  };

  const clearAll = () => {
    setTempFilters([]);
  };

  const selectAll = () => {
    if (filterType === 'symptoms') {
      // Get all symptom names from all categories
      const allSymptoms: string[] = [];
      Object.values(symptomCategories).forEach(category => {
        allSymptoms.push(...category.symptoms);
      });
      setTempFilters(allSymptoms);
    } else {
      // Get all activity names
      const allActivities = Object.values(activityCategories).map(activity => activity.name);
      setTempFilters(allActivities);
    }
  };

  const getCategoryStatus = (categoryKey: string) => {
    const category = symptomCategories[categoryKey];
    if (!category) return 'none';

    const categorySymptoms = category.symptoms;
    const selectedSymptoms = categorySymptoms.filter(symptom => 
      tempFilters.includes(symptom)
    );

    if (selectedSymptoms.length === 0) return 'none';
    if (selectedSymptoms.length === categorySymptoms.length) return 'all';
    return 'partial';
  };

  const renderSymptoms = () => {
    return Object.entries(symptomCategories).map(([categoryKey, category]) => {
      const isExpanded = expandedCategories.includes(categoryKey);
      const categoryStatus = getCategoryStatus(categoryKey);
      const selectedCount = category.symptoms.filter(symptom => 
        tempFilters.includes(symptom)
      ).length;

      return (
        <View key={categoryKey} style={styles.categorySection}>
          {/* Category Header */}
          <View style={styles.categoryHeader}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryStatus === 'all' && styles.categoryButtonSelected,
                categoryStatus === 'partial' && styles.categoryButtonPartial
              ]}
              onPress={() => toggleCategory(categoryKey)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryName,
                categoryStatus !== 'none' && styles.categoryNameSelected
              ]}>
                {category.name}
                {selectedCount > 0 && ` (${selectedCount})`}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleCategoryExpansion(categoryKey)}
            >
              <Text style={styles.expandIcon}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Individual Symptoms (when expanded) */}
          {isExpanded && (
            <View style={styles.symptomsContainer}>
              {category.symptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomItem,
                    tempFilters.includes(symptom) && styles.symptomItemSelected
                  ]}
                  onPress={() => toggleFilter(symptom)}
                >
                  <Text style={[
                    styles.symptomText,
                    tempFilters.includes(symptom) && styles.symptomTextSelected
                  ]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    });
  };

  const renderActivities = () => {
    const selectedActivitiesCount = Object.values(activityCategories).filter(activity => 
      tempFilters.includes(activity.name)
    ).length;
    const allActivitiesSelected = selectedActivitiesCount === Object.values(activityCategories).length;

    return (
      <View style={styles.categorySection}>
        {/* Activities Header - similar to symptoms */}
        <View style={styles.categoryHeader}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              allActivitiesSelected && styles.categoryButtonSelected,
              selectedActivitiesCount > 0 && !allActivitiesSelected && styles.categoryButtonPartial
            ]}
            onPress={() => {
              if (allActivitiesSelected) {
                // Deselect all activities
                setTempFilters(prev => 
                  prev.filter(filter => !Object.values(activityCategories).map(a => a.name).includes(filter))
                );
              } else {
                // Select all activities
                const allActivityNames = Object.values(activityCategories).map(a => a.name);
                setTempFilters(prev => {
                  const filtered = prev.filter(filter => !allActivityNames.includes(filter));
                  return [...filtered, ...allActivityNames];
                });
              }
            }}
          >
            <Text style={styles.categoryIcon}>🔍</Text>
            <Text style={[
              styles.categoryName,
              (selectedActivitiesCount > 0) && styles.categoryNameSelected
            ]}>
              Activities & Triggers
              {selectedActivitiesCount > 0 && ` (${selectedActivitiesCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Individual Activities */}
        <View style={styles.activitiesContainer}>
          {Object.values(activityCategories).map((activity) => (
            <TouchableOpacity
              key={activity.name}
              style={[
                styles.activityItem,
                tempFilters.includes(activity.name) && styles.activityItemSelected
              ]}
              onPress={() => toggleFilter(activity.name)}
            >
              <Text style={[
                styles.activityText,
                tempFilters.includes(activity.name) && styles.activityTextSelected
              ]}>
                {activity.icon} {activity.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Filter {filterType === 'symptoms' ? 'Symptoms' : 'Activities'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Select None</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Select All</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {filterType === 'symptoms' ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Use "Select None" to filter by activities only, or tap category names to select all symptoms in that category
            </Text>
          </View>
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Use "Select None" to filter by symptoms only, or tap the category to select all activities
            </Text>
          </View>
        )}

        {/* Filter Options */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filterType === 'symptoms' ? renderSymptoms() : renderActivities()}
        </ScrollView>

        {/* Done Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>
              DONE ({tempFilters.length} selected)
            </Text>
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
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.gray700,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonPartial: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
    flex: 1,
  },
  categoryNameSelected: {
    color: colors.white,
  },
  expandButton: {
    marginLeft: 12,
    padding: 8,
  },
  expandIcon: {
    fontSize: 14,
    color: colors.gray500,
    fontWeight: 'bold',
  },
  symptomsContainer: {
    paddingLeft: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    marginBottom: 4,
  },
  symptomItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  symptomText: {
    fontSize: 13,
    color: colors.gray700,
  },
  symptomTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
  },
  activitiesContainer: {
    paddingLeft: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    marginBottom: 4,
  },
  activityItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityText: {
    fontSize: 13,
    color: colors.gray700,
  },
  activityTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});