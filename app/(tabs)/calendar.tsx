import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { DailyInfoModal } from '../../components/DailyInfoModal';
import { FilterModal } from '../../components/FilterModal';
import { useEndoData } from '../../hooks/useEndoData';
import { colors, monthNames } from '../../utils/constants';
import { getDaysInMonth } from '../../utils/storage';

export default function CalendarScreen() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'symptoms' | 'activities'>('symptoms');
  const [symptomFilters, setSymptomFilters] = useState<string[]>([]);
  const [activityFilters, setActivityFilters] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAllMode, setShowAllMode] = useState(true); // Start in "show all" mode
  const [dailyModalVisible, setDailyModalVisible] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState<Date | null>(null);
  const [modalTimestamp, setModalTimestamp] = useState(0);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed:', { dailyModalVisible, selectedModalDate: selectedModalDate?.toLocaleDateString() });
  }, [dailyModalVisible, selectedModalDate]);
  
  const { getSymptomSeverityForDate, entries, refreshEntries } = useEndoData();

  // Force refresh whenever we come to this screen or tab is pressed
  useFocusEffect(
    useCallback(() => {
      console.log('Calendar focused - forcing refresh...');
      // Force refresh entries from storage
      refreshEntries();
      // Force a complete re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);
    }, [refreshEntries])
  );

  // Pull to refresh handler - resets to show all
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log('Pull to refresh triggered - resetting to show all');
    
    // Reset to show all mode
    setShowAllMode(true);
    setSymptomFilters([]);
    setActivityFilters([]);
    
    // Force reload entries from AsyncStorage
    await refreshEntries();
    
    // Force a complete re-render
    setRefreshKey(prev => prev + 1);
    
    // Add a delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [refreshEntries]);

  // Helper function to format dates
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const days = getDaysInMonth(calendarDate);

  // Memoized function to get symptom icons for a date
  const getSymptomIconsForDate = useCallback((date: Date) => {
    const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateKey = formatDateString(safeDate);
    const entry = entries[dateKey];
    
    if (!entry) return [];
    
    const icons = [];
    
    // Check for "no symptoms" day first
    if (entry.noSymptomsRecorded) {
      return ['✅']; // Green checkmark for no symptoms day
    }
    
    const categoryIcons = {
      pain: '🔥',
      menstrual: '🩸', 
      digestive: '🤢',
      emotional: '😔',
      physical: '💪',
      sleepEnergy: '😴'  // ADDED: Sleep & Energy category
    };
    
    // In "show all" mode, show everything. Otherwise, apply filters
    if (showAllMode) {
      // Show all symptoms
      if (entry.symptoms) {
        const activeCategories = Object.keys(entry.symptoms);
        activeCategories.forEach(category => {
          if (categoryIcons[category] && Object.keys(entry.symptoms[category]).length > 0) {
            icons.push(categoryIcons[category]);
          }
        });
      }
      
      // Show all activities
      if (entry.activities && entry.activities.length > 0) {
        icons.push('🔍');
      }
    } else {
      // Apply filters
      
      // Handle symptoms
      if (entry.symptoms && symptomFilters.length > 0) {
        const hasMatchingSymptom = Object.values(entry.symptoms).some(categorySymptoms => 
          Object.keys(categorySymptoms).some(symptom => symptomFilters.includes(symptom))
        );
        
        if (hasMatchingSymptom) {
          const activeCategories = Object.keys(entry.symptoms);
          activeCategories.forEach(category => {
            if (categoryIcons[category] && Object.keys(entry.symptoms[category]).some(symptom => symptomFilters.includes(symptom))) {
              icons.push(categoryIcons[category]);
            }
          });
        }
      }
      
      // Handle activities
      if (entry.activities && entry.activities.length > 0 && activityFilters.length > 0) {
        const hasMatchingActivity = entry.activities.some(activity => activityFilters.includes(activity));
        if (hasMatchingActivity) {
          icons.push('🔍');
        }
      }
    }
    
    return icons.slice(0, 3);
  }, [entries, symptomFilters, activityFilters, showAllMode]);

  const openDayModal = (selectedDate: Date) => {
    console.log('Opening day modal for:', selectedDate.toLocaleDateString());
    console.log('Setting modal visible to true');
    setSelectedModalDate(selectedDate);
    setModalTimestamp(Date.now()); // Force modal refresh
    // Small delay to ensure state is set before showing modal
    setTimeout(() => {
      setDailyModalVisible(true);
    }, 50);
  };

  const closeDayModal = () => {
    console.log('Closing day modal');
    setDailyModalVisible(false);
    setSelectedModalDate(null);
  };

  const editDay = (selectedDate: Date) => {
    // Close the modal first
    closeDayModal();
    
    // Navigate to daily tab with the selected date
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    router.push({
      pathname: '/(tabs)/',
      params: { selectedDate: dateString, scrollToTop: 'true' }
    });
  };

  const openFilterModal = (type: 'symptoms' | 'activities') => {
    setFilterType(type);
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: string[]) => {
    if (filterType === 'symptoms') {
      setSymptomFilters(filters);
    } else {
      setActivityFilters(filters);
    }
    
    // Exit "show all" mode when user applies filters
    setShowAllMode(false);
    
    console.log('Filters applied - entering filter mode...');
  };

  const clearAllFilters = () => {
    setSymptomFilters([]);
    setActivityFilters([]);
    setShowAllMode(true); // Return to show all mode
    console.log('Filters cleared - returning to show all mode...');
  };

  const hasActiveFilters = !showAllMode && (symptomFilters.length > 0 || activityFilters.length > 0);
  const hasSymptomFilters = !showAllMode && symptomFilters.length > 0;
  const hasActivityFilters = !showAllMode && activityFilters.length > 0;

  // Memoize the calendar grid to ensure it re-renders when entries change
  const calendarGrid = useMemo(() => {
    console.log('Regenerating calendar grid with refreshKey:', refreshKey);
    console.log('Show all mode:', showAllMode);
    
    return days.map((day, index) => {
      if (!day) {
        return <View key={`empty-${index}-${refreshKey}`} style={styles.calendarDay} />;
      }
      
      const dayStr = formatDateString(day);
      const isTodayDate = isToday(day);
      const isFuture = isFutureDate(day);
      
      // Get fresh icons each render
      const symptomIcons = getSymptomIconsForDate(day);
      
      return (
        <TouchableOpacity
          key={`day-${index}-${dayStr}-${refreshKey}`}
          onPress={() => {
            console.log('Calendar day pressed:', day.toLocaleDateString());
            openDayModal(day);
          }}
          style={[
            styles.calendarDay,
            isTodayDate && styles.todayBorder,
            isFuture && styles.futureDay,
          ]}
        >
          <View style={styles.dayContent}>
            <Text style={[
              styles.calendarDayText,
              isTodayDate && { fontWeight: 'bold', color: colors.primary },
              isFuture && styles.futureDayText,
            ]}>
              {day.getDate()}
            </Text>
            <View style={styles.symptomIconsContainer}>
              {symptomIcons.map((icon, iconIndex) => (
                <Text key={`icon-${iconIndex}-${refreshKey}`} style={[
                  styles.symptomIcon,
                  isFuture && styles.futureIcon,
                ]}>
                  {icon}
                </Text>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }, [days, entries, symptomFilters, activityFilters, getSymptomIconsForDate, refreshKey, showAllMode]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ EndoCare ✨</Text>
        <Text style={styles.headerSubtitle}>Your personal endometriosis tracker</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title="Pull to show all entries..."
            titleColor={colors.primary}
          />
        }
      >
        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            {showAllMode ? 'Showing All Entries' : 'Filter Calendar View'}
          </Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasSymptomFilters && styles.filterButtonActive
              ]}
              onPress={() => openFilterModal('symptoms')}
            >
              <Text style={[
                styles.filterButtonText,
                hasSymptomFilters && styles.filterButtonTextActive
              ]}>
                🥼 Symptoms {hasSymptomFilters && `(${symptomFilters.length})`}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActivityFilters && styles.filterButtonActive
              ]}
              onPress={() => openFilterModal('activities')}
            >
              <Text style={[
                styles.filterButtonText,
                hasActivityFilters && styles.filterButtonTextActive
              ]}>
                🔍 Activities {hasActivityFilters && `(${activityFilters.length})`}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showAllMode ? (
            <Text style={styles.showAllText}>
              Pull down to refresh • Tap filter buttons to customize view
            </Text>
          ) : (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>
                Show All Entries ({hasSymptomFilters ? symptomFilters.length + ' symptoms' : ''}{hasSymptomFilters && hasActivityFilters ? ', ' : ''}{hasActivityFilters ? activityFilters.length + ' activities' : ''} filtered)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const prev = new Date(calendarDate);
              prev.setMonth(prev.getMonth() - 1);
              setCalendarDate(prev);
            }}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.calendarTitle}>
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              const next = new Date(calendarDate);
              next.setMonth(next.getMonth() + 1);
              setCalendarDate(next);
            }}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Legend - UPDATED: Added Sleep & Energy */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>✅</Text>
            <Text style={styles.legendText}>No Symptoms</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔥</Text>
            <Text style={styles.legendText}>Pain</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🩸</Text>
            <Text style={styles.legendText}>Menstrual</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🤢</Text>
            <Text style={styles.legendText}>Digestive</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>😔</Text>
            <Text style={styles.legendText}>Emotional</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>💪</Text>
            <Text style={styles.legendText}>Physical</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>😴</Text>
            <Text style={styles.legendText}>Sleep & Energy</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔍</Text>
            <Text style={styles.legendText}>Activities</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Weekday headers */}
          <View style={styles.weekdayHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar days - Use memoized grid */}
          <View style={styles.calendarGrid}>
            {calendarGrid}
          </View>
        </View>
      </ScrollView>

      {/* Daily Info Modal */}
      <DailyInfoModal
        isVisible={dailyModalVisible}
        selectedDate={selectedModalDate}
        onClose={closeDayModal}
        onEdit={editDay}
      />

      {/* Filter Modal */}
      <FilterModal
        isVisible={filterModalVisible}
        filterType={filterType}
        selectedFilters={filterType === 'symptoms' ? symptomFilters : activityFilters}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
    </SafeAreaView>
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
  content: {
    flex: 1,
  },
  filterSection: {
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
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    alignSelf: 'center',
  },
  clearFiltersText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500',
  },
  showAllText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  filterStatus: {
    alignItems: 'center',
    marginTop: 12,
  },
  refreshStatusText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  calendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray800,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIcon: {
    fontSize: 14,
  },
  legendText: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: '500',
  },
  calendarContainer: {
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
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100/7}%`,
    minHeight: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    padding: 4,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 2,
  },
  symptomIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 24,
    maxWidth: '100%',
    paddingHorizontal: 2,
  },
  symptomIcon: {
    fontSize: 10,
    marginHorizontal: 0.5,
    lineHeight: 12,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  futureDay: {
    opacity: 0.4,
  },
  futureDayText: {
    color: colors.gray400,
  },
  futureIcon: {
    opacity: 0.3,
  },
});