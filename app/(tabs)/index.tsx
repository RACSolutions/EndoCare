import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CategoryCard } from '../../components/CategoryCard';
import { CustomActivityModal } from '../../components/CustomActivityModal';
import { CustomSymptomModal } from '../../components/CustomSymptomModal';
import { EndoFactsBanner } from '../../components/EndoFactsBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary';
import { SymptomModal } from '../../components/SymptomModal';
import { useEndoData } from '../../hooks/useEndoData';
import { activityCategories, colors, symptomCategories } from '../../utils/constants';
import { getCombinedSymptomCategories } from '../../utils/symptomUtils';

export default function DailyScreen() {
  const { selectedDate: paramDate, scrollToTop } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCustomSymptomModalVisible, setIsCustomSymptomModalVisible] = useState(false);
  const [isCustomActivityModalVisible, setIsCustomActivityModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const customActivitiesRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  
  // Update selected date when coming from calendar
  useEffect(() => {
    if (paramDate && typeof paramDate === 'string') {
      try {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(paramDate)) {
          console.warn('Invalid date format:', paramDate);
          return;
        }
        
        // Parse date in local timezone to avoid offset issues
        const parts = paramDate.split('-');
        if (parts.length !== 3) {
          console.warn('Invalid date parts:', paramDate);
          return;
        }
        
        const [year, month, day] = parts.map(Number);
        
        // Validate date components
        if (year < 1900 || year > 2100) {
          console.warn('Invalid year:', year);
          return;
        }
        if (month < 1 || month > 12) {
          console.warn('Invalid month:', month);
          return;
        }
        if (day < 1 || day > 31) {
          console.warn('Invalid day:', day);
          return;
        }
        
        const date = new Date(year, month - 1, day); // month is 0-indexed
        
        // Additional validation: check if the date is valid
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
          console.warn('Invalid date components create invalid date:', paramDate);
          return;
        }
        
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      } catch (error) {
        console.error('Error parsing date parameter:', error);
      }
    }
  }, [paramDate]);

  // Scroll to top when navigating from calendar
  useEffect(() => {
    if (scrollToTop === 'true' && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [scrollToTop, paramDate]);
  
  const {
    getCurrentEntry,
    updateEntry,
    getCategorySymptomCount,
    profileData,
    addCustomSymptom,
    addCustomActivity,
    isLoaded
  } = useEndoData();

  const currentEntry = getCurrentEntry(selectedDate);

  // Get combined symptom categories (default + custom)
  const combinedSymptomCategories = getCombinedSymptomCategories(profileData?.customSymptoms);

  // Handler for adding custom symptoms
  const handleAddCustomSymptom = (category: string, symptom: string) => {
    addCustomSymptom(category, symptom);
  };

  // Handler for adding custom activities
  const handleAddCustomActivity = (activity: string) => {
    addCustomActivity(activity);
  };

  // Toggle custom activity
  const toggleCustomActivity = (activity: string) => {
    const currentActivities = currentEntry.activities || [];
    const isActive = currentActivities.includes(activity);
    
    if (isActive) {
      // Remove activity
      updateEntry(selectedDate, {
        activities: currentActivities.filter(a => a !== activity)
      });
    } else {
      // Add activity
      updateEntry(selectedDate, {
        activities: [...currentActivities, activity]
      });
    }
  };

  // Helper function to scroll to input when focused
  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (inputRef.current && scrollViewRef.current) {
      setTimeout(() => {
        inputRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y, width, height) => {
            // Add extra padding to ensure input is well above keyboard
            const extraPadding = 100;
            scrollViewRef.current?.scrollTo({
              y: y - extraPadding,
              animated: true,
            });
          },
          () => {
            // Fallback if measureLayout fails
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }, 100); // Small delay to ensure keyboard animation starts
    }
  };

  // Helper function to check if date is today in local timezone
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Helper function to check if date is in the future
  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly > todayOnly;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Prevent navigation to future dates
    if (isFutureDate(newDate)) {
      return;
    }
    
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    // Scroll to top when going to today
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const openCategoryModal = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setIsModalVisible(true);
  };

  const closeCategoryModal = () => {
    setIsModalVisible(false);
    setSelectedCategory(null);
  };

  const handleSymptomChange = (category: string, symptom: string, severity: number) => {
    const newSymptoms = { ...currentEntry.symptoms };

    if (!newSymptoms[category]) newSymptoms[category] = {};

    if (severity === 0) {
      delete newSymptoms[category][symptom];
      if (Object.keys(newSymptoms[category]).length === 0) {
        delete newSymptoms[category];
      }
    } else {
      newSymptoms[category][symptom] = severity;
    }

    // If adding symptoms, turn off "no symptoms" flag
    const hasSymptoms = Object.keys(newSymptoms).some(cat => Object.keys(newSymptoms[cat]).length > 0);
    
    updateEntry(selectedDate, { 
      symptoms: newSymptoms,
      noSymptomsRecorded: hasSymptoms ? false : currentEntry.noSymptomsRecorded
    });
  };

  const toggleActivity = (activityKey: string) => {
    const activities = currentEntry.activities || [];
    const activityName = activityCategories[activityKey].name;
    const newActivities = activities.includes(activityName)
      ? activities.filter((a: string) => a !== activityName)
      : [...activities, activityName];

    updateEntry(selectedDate, { activities: newActivities });
  };

  const clearCategory = (categoryKey: string) => {
    const newSymptoms = { ...currentEntry.symptoms };
    delete newSymptoms[categoryKey];
    updateEntry(selectedDate, { symptoms: newSymptoms });
  };

  const recordNoSymptoms = () => {
    if (currentEntry.noSymptomsRecorded) {
      // Turn off "no symptoms" - remove the flag but keep other data
      updateEntry(selectedDate, { noSymptomsRecorded: false });
    } else {
      // Turn on "no symptoms" - clear symptoms but keep activities/notes
      updateEntry(selectedDate, { 
        symptoms: {},
        noSymptomsRecorded: true 
      });
    }
  };

  const hasAnyData = () => {
    return Object.keys(currentEntry.symptoms).length > 0 ||
           (currentEntry.activities && currentEntry.activities.length > 0) ||
           currentEntry.notes ||
           currentEntry.customActivities ||
           currentEntry.noSymptomsRecorded;
  };

  // Show loading indicator while data is loading
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ EndoCare ✨</Text>
          <Text style={styles.headerSubtitle}>Your personal endometriosis tracker</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Daily Tracker Error"
      fallbackMessage="Something went wrong with the daily symptom tracker. Please restart the app and try again."
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ EndoCare ✨</Text>
          <Text style={styles.headerSubtitle}>Your personal endometriosis tracker</Text>
        </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // Important for text input handling
        >
          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              onPress={() => changeDate(-1)} 
              style={styles.navButton}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
              accessibilityHint="Go to previous day"
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.dateButton}>
              <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
              <Text style={styles.dayText}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => changeDate(1)} 
              style={[
                styles.navButton,
                isFutureDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)) && styles.navButtonDisabled
              ]}
              disabled={isFutureDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
              accessibilityRole="button"
              accessibilityLabel="Next day"
              accessibilityHint="Go to next day"
              accessibilityState={{ disabled: isFutureDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)) }}
            >
              <Text style={[
                styles.navButtonText,
                isFutureDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)) && styles.navButtonTextDisabled
              ]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Back to Today Button */}
          {!isToday(selectedDate) && (
            <View style={styles.backToTodayContainer}>
              <TouchableOpacity onPress={goToToday} style={styles.backToTodayButton}>
                <Text style={styles.backToTodayText}>📅 Back to Today</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Endometriosis Facts Banner */}
          {isToday(selectedDate) && (
            <EndoFactsBanner />
          )}

          {/* Symptom Categories */}
          <SectionErrorBoundary sectionName="Symptom Categories">
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌟 How are you feeling today?</Text>
              <Text style={styles.scrollHint}>👆 Tap categories below • Swipe to see more →</Text>
            
            {/* No Symptoms Button */}
            <TouchableOpacity 
              onPress={recordNoSymptoms} 
              style={[
                styles.noSymptomsButton,
                currentEntry.noSymptomsRecorded && styles.noSymptomsButtonActive
              ]}
              accessibilityRole="button"
              accessibilityLabel={currentEntry.noSymptomsRecorded ? "No symptoms recorded" : "Record no symptoms"}
              accessibilityHint={currentEntry.noSymptomsRecorded ? "Tap to undo and add symptoms" : "Tap if you feel well today"}
            >
              <Text style={[
                styles.noSymptomsButtonText,
                currentEntry.noSymptomsRecorded && styles.noSymptomsButtonTextActive
              ]}>
                {currentEntry.noSymptomsRecorded ? '✅ No Symptoms Recorded' : '🌟 Record No Symptoms'}
              </Text>
              <Text style={[
                styles.noSymptomsSubtext,
                currentEntry.noSymptomsRecorded && styles.noSymptomsSubtextActive
              ]}>
                {currentEntry.noSymptomsRecorded ? 'Tap to undo' : 'Tap if you feel well today'}
              </Text>
            </TouchableOpacity>

            {!currentEntry.noSymptomsRecorded && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryContainer}
              >
                {Object.entries(combinedSymptomCategories).map(([categoryKey, category]) => {
                  const symptomCount = getCategorySymptomCount(selectedDate, categoryKey);
                  
                  return (
                    <CategoryCard
                      key={categoryKey}
                      categoryKey={categoryKey}
                      icon={category.icon}
                      name={category.name}
                      isActive={symptomCount > 0}
                      count={symptomCount}
                      onPress={() => openCategoryModal(categoryKey)}
                      onClear={() => clearCategory(categoryKey)}
                    />
                  );
                })}
                
                {/* Add Custom Symptom Button */}
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setIsCustomSymptomModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom symptom"
                  accessibilityHint="Create a new custom symptom to track"
                >
                  <Text style={styles.addCustomIcon}>+</Text>
                  <Text style={styles.addCustomText}>Add Custom</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
            </View>
          </SectionErrorBoundary>

          {/* Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Activities & Triggers</Text>
            <Text style={styles.scrollHint}>👆 Tap activities below • Swipe to see more →</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryScrollView}
              contentContainerStyle={styles.categoryContainer}
            >
              {Object.entries(activityCategories).map(([activityKey, activity]) => {
                const isActive = currentEntry.activities?.includes(activity.name);
                
                return (
                  <CategoryCard
                    key={activityKey}
                    categoryKey={activityKey}
                    icon={activity.icon}
                    name={activity.name}
                    isActive={isActive}
                    onPress={() => toggleActivity(activityKey)}
                    onClear={() => toggleActivity(activityKey)}
                  />
                );
              })}
              
              {/* Add Custom Activity Button */}
              <TouchableOpacity
                style={[styles.addCustomButton, { minWidth: 120 }]}
                onPress={() => setIsCustomActivityModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Add custom activity"
                accessibilityHint="Create a new custom activity or trigger to track"
              >
                <Text style={styles.addCustomIcon}>+</Text>
                <Text style={styles.addCustomText}>Add Custom Activity</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Custom Activities */}
            {profileData?.customActivities && profileData.customActivities.length > 0 && (
              <>
                <Text style={styles.customActivitiesTitle}>Your Custom Activities:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.categoryScrollView}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {profileData.customActivities.map((activity, index) => {
                    const isActive = currentEntry.activities?.includes(activity);
                    
                    return (
                      <CategoryCard
                        key={`custom-${index}`}
                        categoryKey={`custom-${index}`}
                        icon="🔍"
                        name={activity}
                        isActive={isActive}
                        onPress={() => toggleCustomActivity(activity)}
                        onClear={() => toggleCustomActivity(activity)}
                      />
                    );
                  })}
                </ScrollView>
              </>
            )}

            <TextInput
              ref={customActivitiesRef}
              style={styles.textArea}
              value={currentEntry.customActivities || ''}
              onChangeText={(text) => updateEntry(selectedDate, { customActivities: text })}
              placeholder="Add other activities or triggers..."
              placeholderTextColor={colors.primary}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              onFocus={() => scrollToInput(customActivitiesRef)}
              onSubmitEditing={() => {
                customActivitiesRef.current?.blur();
              }}
              accessibilityLabel="Custom activities input"
              accessibilityHint="Enter additional activities or triggers not listed above"
            />
          </View>

          {/* Notes */}
          <View style={[styles.section, { marginBottom: 100 }]}>
            <Text style={styles.sectionTitle}>💭 Daily Notes</Text>
            <TextInput
              ref={notesRef}
              style={[styles.textArea, { height: 100 }]}
              value={currentEntry.notes || ''}
              onChangeText={(text) => updateEntry(selectedDate, { notes: text })}
              placeholder="How are you feeling today? Any important observations..."
              placeholderTextColor={colors.primary}
              multiline
              numberOfLines={4}
              returnKeyType="done"
              onFocus={() => scrollToInput(notesRef)}
              onSubmitEditing={() => {
                notesRef.current?.blur();
              }}
              accessibilityLabel="Daily notes"
              accessibilityHint="Record how you're feeling and any important observations"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal */}
      {isModalVisible && (
        <SectionErrorBoundary sectionName="Symptom Modal">
          <SymptomModal
            isVisible={isModalVisible}
            selectedCategory={selectedCategory}
            currentEntry={currentEntry}
            onClose={closeCategoryModal}
            onSymptomChange={handleSymptomChange}
            customSymptoms={profileData?.customSymptoms}
          />
        </SectionErrorBoundary>
      )}

      {/* Custom Symptom Modal */}
      <CustomSymptomModal
        visible={isCustomSymptomModalVisible}
        onClose={() => setIsCustomSymptomModalVisible(false)}
        onAddSymptom={handleAddCustomSymptom}
        categories={symptomCategories}
      />

      {/* Custom Activity Modal */}
      <CustomActivityModal
        visible={isCustomActivityModalVisible}
        onClose={() => setIsCustomActivityModalVisible(false)}
        onAddActivity={handleAddCustomActivity}
      />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    fontStyle: 'normal',
    color: colors.white,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: colors.gray500,
  },
  backToTodayContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  backToTodayButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backToTodayText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
  },
  dayText: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2,
  },
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
  categoryScrollView: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
    color: colors.primary,
  },
  noSymptomsButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  noSymptomsButtonActive: {
    backgroundColor: '#e6f7e6',
    borderColor: '#4ade80',
  },
  noSymptomsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  noSymptomsButtonTextActive: {
    color: '#16a34a',
  },
  noSymptomsSubtext: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  noSymptomsSubtextActive: {
    color: '#16a34a',
  },
  symptomsRecordedBanner: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomsRecordedText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  changeToNoSymptomsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeToNoSymptomsText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  addCustomButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginRight: 8,
  },
  addCustomIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  addCustomText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  customActivitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
});