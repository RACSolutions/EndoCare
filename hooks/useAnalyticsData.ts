import { useMemo } from 'react';
import { SymptomEntry } from '../types';

type TimeFilter = '30d' | '3m' | '6m' | '1y' | 'all';

const timeFilterOptions = [
  { key: '30d', label: '30 Days', days: 30 },
  { key: '3m', label: '3 Months', days: 90 },
  { key: '6m', label: '6 Months', days: 180 },
  { key: '1y', label: '1 Year', days: 365 },
  { key: 'all', label: 'All Time', days: null },
];

interface AnalyticsData {
  totalEntries: number;
  totalEntriesWithSymptoms: number;
  totalUniqueSymptoms: number;
  avgSymptomsPerDay: number;
  goodDays: number;
  badDays: number;
  expectedTotalDays: number;
  topSymptoms: [string, number][];
  mostSevereSymptoms: [string, number][];
  topActivities: [string, number][];
  symptomFrequency: { [symptom: string]: number };
  activityFrequency: { [activity: string]: number };
  categoryFrequency: { [category: string]: number };
  dailySymptomCounts: { [date: string]: number };
}

export const useAnalyticsData = (
  entries: { [key: string]: SymptomEntry },
  selectedTimeFilter: TimeFilter
): { filteredEntries: typeof entries; analytics: AnalyticsData } => {
  // Filter entries based on selected time period
  const filteredEntries = useMemo(() => {
    const filterOption = timeFilterOptions.find(opt => opt.key === selectedTimeFilter);
    if (!filterOption || !filterOption.days) {
      return entries; // Return all entries for "All Time"
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterOption.days);

    const filtered: typeof entries = {};
    Object.entries(entries).forEach(([dateKey, entry]) => {
      const entryDate = new Date(dateKey);
      if (entryDate >= cutoffDate) {
        filtered[dateKey] = entry;
      }
    });

    return filtered;
  }, [entries, selectedTimeFilter]);

  // Calculate analytics from filtered data
  const analytics = useMemo((): AnalyticsData => {
    const symptomFrequency: { [symptom: string]: number } = {};
    const symptomSeveritySum: { [symptom: string]: { total: number, count: number } } = {};
    const activityFrequency: { [activity: string]: number } = {};
    const categoryFrequency: { [category: string]: number } = {};
    const dailySymptomCounts: { [date: string]: number } = {};
    
    let totalEntriesWithSymptoms = 0;
    let totalEntries = Object.keys(filteredEntries).length;
    let noSymptomDays = 0;

    // Calculate the expected number of days in the selected time period
    const calculateExpectedDays = () => {
      const filterOption = timeFilterOptions.find(opt => opt.key === selectedTimeFilter);
      if (!filterOption || !filterOption.days) {
        // For "All Time", calculate days since earliest entry or a reasonable start date
        if (Object.keys(entries).length === 0) return 0;
        
        const allDates = Object.keys(entries).map(dateStr => new Date(dateStr));
        const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      return filterOption.days;
    };

    const expectedTotalDays = calculateExpectedDays();

    // Process each entry
    Object.entries(filteredEntries).forEach(([dateKey, entry]) => {
      let dailySymptomCount = 0;

      // Handle "no symptoms recorded" entries
      if (entry.noSymptomsRecorded) {
        noSymptomDays++;
        dailySymptomCounts[dateKey] = 0;
        return;
      }

      // Count symptoms
      if (entry.symptoms && Object.keys(entry.symptoms).length > 0) {
        totalEntriesWithSymptoms++;
        
        Object.entries(entry.symptoms).forEach(([category, categorySymptoms]) => {
          categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
          
          Object.entries(categorySymptoms).forEach(([symptom, severity]) => {
            symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
            
            if (!symptomSeveritySum[symptom]) {
              symptomSeveritySum[symptom] = { total: 0, count: 0 };
            }
            symptomSeveritySum[symptom].total += severity;
            symptomSeveritySum[symptom].count += 1;
            
            dailySymptomCount++;
          });
        });
      }

      // Count activities
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          activityFrequency[activity] = (activityFrequency[activity] || 0) + 1;
        });
      }

      dailySymptomCounts[dateKey] = dailySymptomCount;
    });

    // Calculate derived metrics
    const totalUniqueSymptoms = Object.keys(symptomFrequency).length;
    const totalSymptomInstances = Object.values(symptomFrequency).reduce((sum, freq) => sum + freq, 0);
    const avgSymptomsPerDay = totalEntries > 0 ? totalSymptomInstances / totalEntries : 0;
    
    const goodDays = noSymptomDays;
    const badDays = totalEntriesWithSymptoms;

    // Sort and get top items
    const topSymptoms = Object.entries(symptomFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const mostSevereSymptoms = Object.entries(symptomSeveritySum)
      .map(([symptom, data]) => [symptom, data.total / data.count] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topActivities = Object.entries(activityFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalEntries,
      totalEntriesWithSymptoms,
      totalUniqueSymptoms,
      avgSymptomsPerDay,
      goodDays,
      badDays,
      expectedTotalDays,
      topSymptoms,
      mostSevereSymptoms,
      topActivities,
      symptomFrequency,
      activityFrequency,
      categoryFrequency,
      dailySymptomCounts,
    };
  }, [filteredEntries, entries, selectedTimeFilter]);

  return { filteredEntries, analytics };
};