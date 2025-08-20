import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEndoData } from '../../hooks/useEndoData';
import { colors } from '../../utils/constants';

type TimeFilter = '30d' | '3m' | '6m' | '1y' | 'all';

const timeFilterOptions = [
  { key: '30d', label: '30 Days', days: 30 },
  { key: '3m', label: '3 Months', days: 90 },
  { key: '6m', label: '6 Months', days: 180 },
  { key: '1y', label: '1 Year', days: 365 },
  { key: 'all', label: 'All Time', days: null },
];

export default function AnalysisScreen() {
  const { entries, refreshEntries, profileData, medications, diagnoses } = useEndoData();
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('3m');
  const [bannerVisible, setBannerVisible] = useState(true);

  // Extract data from profileData for easier access in PDF generation
  const surgeries = profileData?.surgeries || [];
  const selectedVitamins = profileData?.selectedVitamins || [];

  // Force refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Analysis screen focused - refreshing data...');
      refreshEntries();
    }, [refreshEntries])
  );

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
  const analytics = useMemo(() => {
    console.log('Recalculating analytics...');
    console.log('Filtered entries:', Object.keys(filteredEntries).length);
    console.log('All entries:', Object.keys(entries).length);
    
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

    Object.entries(filteredEntries).forEach(([dateKey, entry]) => {
      let dailySymptomCount = 0;
      
      // Check if this is a "no symptoms" day
      if (entry.noSymptomsRecorded) {
        noSymptomDays++;
        dailySymptomCounts[dateKey] = 0;
        console.log('Found no symptoms day:', dateKey);
        return; // Skip processing symptoms for this day
      }
      
      // Process symptoms
      if (entry.symptoms && Object.keys(entry.symptoms).length > 0) {
        totalEntriesWithSymptoms++;
        
        Object.entries(entry.symptoms).forEach(([category, categorySymptoms]) => {
          categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
          
          Object.entries(categorySymptoms).forEach(([symptom, severity]) => {
            symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
            
            if (!symptomSeveritySum[symptom]) {
              symptomSeveritySum[symptom] = { total: 0, count: 0 };
            }
            symptomSeveritySum[symptom].total += severity as number;
            symptomSeveritySum[symptom].count += 1;
            dailySymptomCount++;
          });
        });
      }
      
      dailySymptomCounts[dateKey] = dailySymptomCount;
      
      // Process activities
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          activityFrequency[activity] = (activityFrequency[activity] || 0) + 1;
        });
      }
    });

    // Calculate average severities
    const symptomAverageSeverity: { [symptom: string]: number } = {};
    Object.entries(symptomSeveritySum).forEach(([symptom, data]) => {
      symptomAverageSeverity[symptom] = data.total / data.count;
    });

    // Get top symptoms by frequency
    const topSymptoms = Object.entries(symptomFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Get most severe symptoms (by average severity)
    const mostSevereSymptoms = Object.entries(symptomAverageSeverity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Get top activities/triggers
    const topActivities = Object.entries(activityFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Calculate symptom burden (average symptoms per day)
    const avgSymptomsPerDay = totalEntries > 0 ? 
      Object.values(dailySymptomCounts).reduce((sum, count) => sum + count, 0) / totalEntries : 0;

    // Calculate good vs bad days
    const badDays = Object.values(dailySymptomCounts).filter(count => count >= 3).length;
    const goodDays = noSymptomDays; // Only count explicitly recorded "no symptom" days
    const daysWithSymptoms = totalEntriesWithSymptoms; // Days with any symptoms
    
    // Calculate missed days properly based on the selected time period
    const missedDays = Math.max(0, expectedTotalDays - totalEntries);

    console.log('Analytics calculated:', {
      totalEntries,
      expectedTotalDays,
      noSymptomDays,
      goodDays,
      daysWithSymptoms,
      badDays,
      missedDays
    });

    return {
      totalEntries,
      totalEntriesWithSymptoms,
      totalUniqueSymptoms: Object.keys(symptomFrequency).length,
      topSymptoms,
      mostSevereSymptoms,
      topActivities,
      avgSymptomsPerDay,
      goodDays,
      badDays,
      daysWithSymptoms,
      missedDays, // Now properly calculated based on time period
      categoryFrequency,
      noSymptomDays,
      symptomAverageSeverity,
    };
  }, [filteredEntries, selectedTimeFilter, entries]); // Added entries to dependencies

  const selectedFilterLabel = timeFilterOptions.find(opt => opt.key === selectedTimeFilter)?.label || '3 Months';

  // Helper function to format date for entries lookup
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to generate month data
  const generateMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day
    for (let i = 0; i < firstDayWeekday; i++) {
      const prevDate = new Date(year, month, 1 - firstDayWeekday + i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Add empty cells to complete the grid
    while (days.length % 7 !== 0) {
      const nextDate = new Date(year, month + 1, days.length - lastDay.getDate() - firstDayWeekday + 1);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return { monthName, days };
  };

  // Severity color mapping for borders
  const getSeverityColor = (severity: number): string => {
    switch(severity) {
      case 1: return '#2196f3'; // Blue for mild
      case 2: return '#ff9800'; // Orange for moderate  
      case 3: return '#f44336'; // Red for severe
      default: return '#9e9e9e'; // Gray fallback
    }
  };

  // Updated generateMonthHTML function without emojis, using colored borders
  const generateMonthHTML = (monthData: any) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return `
      <div class="month-calendar">
          <div class="month-header">${monthData.monthName}</div>
          <div class="calendar-grid">
              ${weekdays.map(day => `<div class="day-header">${day}</div>`).join('')}
              ${monthData.days.map((dayData: any) => {
                const dateKey = formatDate(dayData.date);
                const entry = entries[dateKey]; // Use all entries for calendar display
                const isCurrentMonth = dayData.isCurrentMonth;
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                
                let dayContent = '';
                
                if (entry && isCurrentMonth) {
                  if (entry.noSymptomsRecorded) {
                    dayContent = '<div class="no-symptoms">✓ No Symptoms</div>';
                  } else {
                    // Add symptoms with colored borders instead of emojis
                    if (entry.symptoms) {
                      Object.entries(entry.symptoms).forEach(([category, categorySymptoms]) => {
                        Object.entries(categorySymptoms as any).forEach(([symptom, severity]) => {
                          const severityColor = getSeverityColor(severity as number);
                          dayContent += `<div class="symptom-tag" style="border-color: ${severityColor};">${symptom} ${severity}</div>`;
                        });
                      });
                    }
                    
                    // Add activities with purple background
                    if (entry.activities && entry.activities.length > 0) {
                      entry.activities.forEach((activity: string) => {
                        dayContent += `<div class="activity-tag">${activity}</div>`;
                      });
                    }
                  }
                }
                
                return `
                  <div class="${dayClass}">
                      <div class="day-number">${dayData.date.getDate()}</div>
                      <div class="day-content">${dayContent}</div>
                  </div>
                `;
              }).join('')}
          </div>
      </div>
    `;
  };

  // Generate last 3 months for calendar (current + 2 previous)
  const generateLast3MonthsCalendar = () => {
    const calendarMonths = [];
    const currentDate = new Date();
    
    // Generate exactly 3 months: current month and 2 previous months
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthData = generateMonthData(monthDate);
      calendarMonths.push(monthData);
    }
    
    return calendarMonths;
  };

  // NEW: Calculate monthly analysis for the entire report period
  const calculateReportPeriodMonthlyAnalysis = () => {
    if (Object.keys(filteredEntries).length === 0) return [];

    // Get all months covered by the filtered entries
    const entryDates = Object.keys(filteredEntries).map(dateStr => new Date(dateStr));
    const earliestDate = new Date(Math.min(...entryDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...entryDates.map(d => d.getTime())));

    const monthlyAnalysis = [];
    const currentMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

    while (currentMonth <= latestDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Filter entries for this specific month
      const monthlyEntries: typeof entries = {};
      Object.entries(filteredEntries).forEach(([dateKey, entry]) => {
        const entryDate = new Date(dateKey);
        if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
          monthlyEntries[dateKey] = entry;
        }
      });

      if (Object.keys(monthlyEntries).length === 0) {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        continue;
      }

      // Calculate monthly analytics
      const monthlySymptomFrequency: { [symptom: string]: number } = {};
      const monthlySymptomSeveritySum: { [symptom: string]: { total: number, count: number } } = {};
      const monthlyActivityFrequency: { [activity: string]: number } = {};
      
      let monthlyTotalEntries = Object.keys(monthlyEntries).length;
      let monthlyNoSymptomDays = 0;
      let monthlyDaysWithSymptoms = 0;

      Object.entries(monthlyEntries).forEach(([dateKey, entry]) => {
        if (entry.noSymptomsRecorded) {
          monthlyNoSymptomDays++;
          return;
        }
        
        if (entry.symptoms && Object.keys(entry.symptoms).length > 0) {
          monthlyDaysWithSymptoms++;
          
          Object.entries(entry.symptoms).forEach(([category, categorySymptoms]) => {
            Object.entries(categorySymptoms).forEach(([symptom, severity]) => {
              monthlySymptomFrequency[symptom] = (monthlySymptomFrequency[symptom] || 0) + 1;
              
              if (!monthlySymptomSeveritySum[symptom]) {
                monthlySymptomSeveritySum[symptom] = { total: 0, count: 0 };
              }
              monthlySymptomSeveritySum[symptom].total += severity as number;
              monthlySymptomSeveritySum[symptom].count += 1;
            });
          });
        }
        
        if (entry.activities && entry.activities.length > 0) {
          entry.activities.forEach(activity => {
            monthlyActivityFrequency[activity] = (monthlyActivityFrequency[activity] || 0) + 1;
          });
        }
      });

      // Calculate monthly averages
      const monthlySymptomAverages: { [symptom: string]: number } = {};
      Object.entries(monthlySymptomSeveritySum).forEach(([symptom, data]) => {
        monthlySymptomAverages[symptom] = data.total / data.count;
      });

      // Get all symptoms sorted by frequency
      const allMonthlySymptoms = Object.entries(monthlySymptomFrequency)
        .sort(([,a], [,b]) => b - a);

      // Get all activities sorted by frequency
      const allMonthlyActivities = Object.entries(monthlyActivityFrequency)
        .sort(([,a], [,b]) => b - a);

      monthlyAnalysis.push({
        monthName,
        totalEntries: monthlyTotalEntries,
        noSymptomDays: monthlyNoSymptomDays,
        daysWithSymptoms: monthlyDaysWithSymptoms,
        symptoms: allMonthlySymptoms,
        activities: allMonthlyActivities,
        symptomAverages: monthlySymptomAverages,
      });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return monthlyAnalysis;
  };

  // Updated generatePDFMedicalReport function
  const generatePDFMedicalReport = async () => {
    try {
      const currentDate = new Date().toLocaleDateString();
      
      // Generate last 3 months for calendar
      const calendarMonths = generateLast3MonthsCalendar();
      
      // Calculate monthly analysis for the entire report period
      const reportPeriodMonthlyAnalysis = calculateReportPeriodMonthlyAnalysis();
      
      // Generate HTML for PDF
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>EndoCare Medical Report</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.3;
                  color: #333;
                  background: #fff;
                  margin: 0;
                  padding: 0;
              }
              
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 40px 30px 30px 30px;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #e91e63;
                  padding-bottom: 10px;
              }
              
              .header h1 {
                  color: #e91e63;
                  font-size: 1.8em;
                  margin-bottom: 5px;
              }
              
              .header .subtitle {
                  color: #666;
                  font-size: 0.9em;
              }
              
              .summary-section {
                  background: #f8f9fa;
                  border-radius: 4px;
                  padding: 12px;
                  margin-bottom: 15px;
                  border-left: 3px solid #e91e63;
              }
              
              .summary-title {
                  color: #e91e63;
                  font-size: 1.0em;
                  margin-bottom: 8px;
                  display: flex;
                  align-items: center;
              }
              
              .summary-info {
                  font-size: 0.8em;
                  margin-bottom: 10px;
                  line-height: 1.3;
              }
              
              .summary-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 8px;
                  margin-bottom: 8px;
              }
              
              .summary-item {
                  background: white;
                  padding: 8px;
                  border-radius: 4px;
                  border: 1px solid #e0e0e0;
                  text-align: center;
              }
              
              .summary-item label {
                  font-weight: 600;
                  color: #555;
                  display: block;
                  margin-bottom: 3px;
                  font-size: 0.75em;
              }
              
              .summary-item .value {
                  font-size: 1.1em;
                  font-weight: bold;
                  color: #e91e63;
              }
              
              .legend-section {
                  margin: 15px 0;
                  background: #f8f9fa;
                  padding: 12px;
                  border-radius: 4px;
                  border-left: 3px solid #e91e63;
              }
              
              .legend-title {
                  color: #e91e63;
                  font-size: 1.0em;
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
              }
              
              .legend-subsection {
                  margin-bottom: 8px;
              }
              
              .legend-subsection-title {
                  color: #666;
                  font-size: 0.8em;
                  font-weight: 600;
                  margin-bottom: 5px;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 2px;
              }
              
              .legend-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                  gap: 5px;
                  margin-bottom: 8px;
              }
              
              .legend-item {
                  display: flex;
                  align-items: center;
                  background: white;
                  padding: 4px 6px;
                  border-radius: 3px;
                  border: 1px solid #e0e0e0;
                  font-size: 0.7em;
              }
              
              .legend-icon {
                  width: 18px;
                  height: 18px;
                  margin-right: 6px;
                  border-radius: 2px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 9px;
                  border: 1px solid rgba(0,0,0,0.2);
              }
              
              .example-display {
                  margin-top: 6px;
                  padding: 6px;
                  background: white;
                  border-radius: 3px;
                  border: 1px solid #e0e0e0;
                  font-size: 0.7em;
              }
              
              .page-break {
                  page-break-before: always;
                  height: 0;
                  margin: 0;
                  padding: 0;
              }

              /* Monthly Analysis Section for Report Period */
              .monthly-analysis-section {
                  background: #fff3e0;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 60px 0 20px 0;
                  border-left: 4px solid #ff9800;
                  padding-top: 20px;
              }

              .monthly-analysis-item {
                  background: white;
                  border-radius: 6px;
                  padding: 15px;
                  margin-bottom: 20px;
                  border: 1px solid #e0e0e0;
                  page-break-inside: avoid;
              }

              .monthly-analysis-header {
                  color: #ff9800;
                  font-size: 1.1em;
                  font-weight: bold;
                  margin-bottom: 12px;
                  text-align: center;
                  border-bottom: 2px solid #ff9800;
                  padding-bottom: 8px;
              }

              .monthly-analysis-stats {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 10px;
                  margin-bottom: 15px;
              }

              .monthly-analysis-stat {
                  text-align: center;
                  background: #f8f9fa;
                  padding: 8px;
                  border-radius: 4px;
                  border: 1px solid #e0e0e0;
              }

              .monthly-analysis-stat-value {
                  font-size: 1.2em;
                  font-weight: bold;
                  color: #ff9800;
                  display: block;
              }

              .monthly-analysis-stat-label {
                  font-size: 0.75em;
                  color: #666;
                  margin-top: 4px;
              }

              .monthly-symptoms-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                  font-size: 0.8em;
              }

              .monthly-symptoms-table th {
                  background: #ff9800;
                  color: white;
                  padding: 8px;
                  text-align: left;
                  font-weight: bold;
              }

              .monthly-symptoms-table td {
                  padding: 6px 8px;
                  border-bottom: 1px solid #e0e0e0;
              }

              .monthly-symptoms-table tr:nth-child(even) {
                  background: #f8f9fa;
              }
              
              .calendar-section {
                  margin: 60px 0 20px 0;
                  padding-top: 20px;
              }
              
              .calendar-title {
                  color: #e91e63;
                  font-size: 1.2em;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
              }
              
              .month-calendar {
                  margin-bottom: 25px;
                  background: white;
                  border-radius: 6px;
                  overflow: hidden;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                  page-break-inside: avoid;
              }
              
              .month-header {
                  background: #e91e63;
                  color: white;
                  text-align: center;
                  padding: 12px;
                  font-size: 1.2em;
                  font-weight: bold;
              }
              
              .calendar-grid {
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
              }
              
              .day-header {
                  background: #f5f5f5;
                  padding: 12px 5px;
                  text-align: center;
                  font-weight: bold;
                  color: #666;
                  border-right: 1px solid #e0e0e0;
                  font-size: 0.9em;
              }
              
              .day-header:last-child {
                  border-right: none;
              }
              
              .calendar-day {
                  min-height: 130px;
                  border-right: 1px solid #e0e0e0;
                  border-bottom: 1px solid #e0e0e0;
                  padding: 6px;
                  position: relative;
                  background: white;
              }
              
              .calendar-day:last-child {
                  border-right: none;
              }
              
              .day-number {
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 4px;
                  font-size: 0.9em;
              }
              
              .day-content {
                  font-size: 0.75em;
                  line-height: 1.2;
              }
              
              .symptom-tag {
                  color: #333;
                  background: white;
                  padding: 2px 4px;
                  border-radius: 3px;
                  margin: 1px 0;
                  display: block;
                  font-size: 0.65em;
                  text-align: center;
                  font-weight: 500;
                  border: 2px solid;
              }
              
              .activity-tag {
                  background: #9c27b0;
                  color: white;
                  padding: 2px 4px;
                  border-radius: 3px;
                  margin: 1px 0;
                  display: block;
                  font-size: 0.65em;
                  text-align: center;
                  border: 2px solid #7b1fa2;
                  font-weight: 500;
              }
              
              .no-symptoms {
                  background: #4caf50;
                  color: white;
                  padding: 3px 4px;
                  border-radius: 3px;
                  font-size: 0.65em;
                  text-align: center;
                  font-weight: bold;
                  border: 2px solid #388e3c;
              }
              
              .other-month {
                  color: #ccc;
                  background: #fafafa;
              }
              
              .analysis-section {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 60px 0 20px 0;
                  border-left: 4px solid #e91e63;
                  padding-top: 20px;
              }
              
              .analysis-title {
                  color: #e91e63;
                  font-size: 1.2em;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
              }
              
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                  gap: 12px;
                  margin-bottom: 15px;
              }
              
              .stat-card {
                  background: white;
                  padding: 12px;
                  border-radius: 4px;
                  text-align: center;
                  border: 1px solid #e0e0e0;
              }
              
              .stat-value {
                  font-size: 1.8em;
                  font-weight: bold;
                  color: #e91e63;
                  display: block;
              }
              
              .stat-label {
                  color: #666;
                  margin-top: 10px;
                  font-weight: 600;
              }
              
              .symptoms-list, .triggers-list {
                  background: white;
                  padding: 12px;
                  border-radius: 4px;
                  margin: 12px 0;
                  border: 1px solid #e0e0e0;
              }
              
              .list-title {
                  color: #e91e63;
                  font-size: 1.0em;
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
              }
              
              .symptom-item, .trigger-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 8px 0;
                  border-bottom: 1px solid #f0f0f0;
              }
              
              .symptom-item:last-child, .trigger-item:last-child {
                  border-bottom: none;
              }
              
              .notes-section {
                  background: #f0f4f8;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 60px 0 20px 0;
                  border-left: 4px solid #2196f3;
                  padding-top: 20px;
              }
              
              .notes-title {
                  color: #2196f3;
                  font-size: 1.1em;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
              }
              
              .notes-list {
                  list-style: none;
              }
              
              .notes-list li {
                  margin: 8px 0;
                  padding-left: 20px;
                  position: relative;
                  line-height: 1.4;
              }
              
              .notes-list li:before {
                  content: "•";
                  color: #2196f3;
                  position: absolute;
                  left: 0;
                  font-weight: bold;
              }
              
              .print-date {
                  text-align: center;
                  color: #666;
                  margin-top: 20px;
                  font-style: italic;
              }
              
              .emoji {
                  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", sans-serif;
                  font-style: normal;
                  font-variant: normal;
                  text-rendering: auto;
                  -webkit-font-smoothing: antialiased;
              }
              
              @media print {
                  body { 
                      margin: 0;
                      padding: 0;
                  }
                  .container {
                      padding: 60px 40px 40px 40px;
                  }
                  .page-break {
                      page-break-before: always;
                      height: 60px;
                      margin: 0;
                      padding: 0;
                  }
                  .monthly-analysis-section { 
                      margin-top: 0;
                      padding-top: 20px;
                  }
                  .calendar-section { 
                      margin-top: 0;
                      padding-top: 20px;
                  }
                  .analysis-section { 
                      margin-top: 0;
                      padding-top: 20px;
                  }
                  .notes-section { 
                      margin-top: 0;
                      padding-top: 20px;
                  }
                  .month-calendar { 
                      page-break-inside: avoid; 
                  }
                  .monthly-analysis-item { 
                      page-break-inside: avoid; 
                  }
                  @page {
                      margin: 60px 40px 40px 40px;
                      size: A4;
                  }
                  
                  .symptom-tag, .activity-tag, .no-symptoms {
                      -webkit-print-color-adjust: exact;
                      color-adjust: exact;
                      print-color-adjust: exact;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1><span class="emoji">✨</span> EndoCare Medical Report <span class="emoji">✨</span></h1>
                  <div class="subtitle">Comprehensive Endometriosis Symptom Analysis</div>
              </div>

              <div class="summary-section">
                  <div class="summary-title"><span class="emoji">📋</span> Report Summary</div>
                  <div class="summary-info">
                      <strong>Generated:</strong> ${currentDate} | <strong>Period:</strong> ${selectedFilterLabel} Analysis + Last 3 Months Calendar | <strong>Source:</strong> Self-reported tracking<br>
                      ${profileData.name ? `<strong>Patient:</strong> ${profileData.name}` : ''}${profileData.age ? `, Age: ${profileData.age}` : ''}${profileData.diagnosisYear ? ` | <strong>Diagnosed:</strong> ${profileData.diagnosisYear}` : ''}${profileData.endoStage ? ` (${profileData.endoStage})` : ''}
                  </div>
                  
                  <div class="summary-grid">
                      <div class="summary-item">
                          <label>Total Days:</label>
                          <div class="value">${analytics.totalEntries}</div>
                      </div>
                      <div class="summary-item">
                          <label>Symptom-Free:</label>
                          <div class="value">${analytics.goodDays}</div>
                      </div>
                      <div class="summary-item">
                          <label>With Symptoms:</label>
                          <div class="value">${analytics.daysWithSymptoms}</div>
                      </div>
                      <div class="summary-item">
                          <label>Avg Daily:</label>
                          <div class="value">${analytics.avgSymptomsPerDay.toFixed(1)}</div>
                      </div>
                  </div>
              </div>

              <div class="legend-section">
                  <div class="legend-title"><span class="emoji">📅</span> Comprehensive Legend</div>
                  
                  <div class="legend-subsection">
                      <div class="legend-subsection-title">Calendar Status</div>
                      <div class="legend-grid">
                          <div class="legend-item">
                              <div class="legend-icon" style="background: #4caf50; color: white; border: 1px solid #388e3c;">✓</div>
                              <span>No Symptoms</span>
                          </div>
                          <div class="legend-item">
                              <div class="legend-icon" style="background: #e0e0e0; color: #666; border: 1px solid #bdbdbd;">-</div>
                              <span>No Data</span>
                          </div>
                      </div>
                  </div>

                  <div class="legend-subsection">
                      <div class="legend-subsection-title">Severity & Types</div>
                      <div class="legend-grid">
                          <div class="legend-item">
                              <div class="legend-icon" style="background: white; border: 2px solid #2196f3; color: #2196f3;">1</div>
                              <span>Mild (Blue Border)</span>
                          </div>
                          <div class="legend-item">
                              <div class="legend-icon" style="background: white; border: 2px solid #ff9800; color: #ff9800;">2</div>
                              <span>Moderate (Orange Border)</span>
                          </div>
                          <div class="legend-item">
                              <div class="legend-icon" style="background: white; border: 2px solid #f44336; color: #f44336;">3</div>
                              <span>Severe (Red Border)</span>
                          </div>
                          <div class="legend-item">
                              <div class="legend-icon" style="background: #9c27b0; color: white; border: 1px solid #7b1fa2;">A</div>
                              <span>Activities</span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="example-display">
                      <strong>Format:</strong> "Back pain 2" = symptom name + severity number with colored border (orange=moderate)
                  </div>
              </div>

              ${reportPeriodMonthlyAnalysis.length > 0 ? `
              <div class="page-break"></div>
              
              <!-- Monthly Analysis for Report Period -->
              <div class="monthly-analysis-section">
                  <div class="analysis-title"><span class="emoji">📊</span> Monthly Analysis (${selectedFilterLabel})</div>
                  
                  ${reportPeriodMonthlyAnalysis.map(monthData => `
                      <div class="monthly-analysis-item">
                          <div class="monthly-analysis-header">${monthData.monthName}</div>
                          
                          <div class="monthly-analysis-stats">
                              <div class="monthly-analysis-stat">
                                  <span class="monthly-analysis-stat-value">${monthData.totalEntries}</span>
                                  <div class="monthly-analysis-stat-label">Days Tracked</div>
                              </div>
                              <div class="monthly-analysis-stat">
                                  <span class="monthly-analysis-stat-value">${monthData.noSymptomDays}</span>
                                  <div class="monthly-analysis-stat-label">Symptom-Free Days</div>
                              </div>
                              <div class="monthly-analysis-stat">
                                  <span class="monthly-analysis-stat-value">${monthData.daysWithSymptoms}</span>
                                  <div class="monthly-analysis-stat-label">Days with Symptoms</div>
                              </div>
                          </div>

                          ${monthData.symptoms.length > 0 ? `
                          <table class="monthly-symptoms-table">
                              <thead>
                                  <tr>
                                      <th>Symptom</th>
                                      <th>Days Experienced</th>
                                      <th>Average Severity</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${monthData.symptoms.map(([symptom, frequency]) => `
                                      <tr>
                                          <td><strong>${symptom}</strong></td>
                                          <td>${frequency}</td>
                                          <td>${monthData.symptomAverages[symptom]?.toFixed(1) || 'N/A'}/3</td>
                                      </tr>
                                  `).join('')}
                              </tbody>
                          </table>
                          ` : '<div style="text-align: center; color: #666; font-style: italic; margin: 20px 0;">No symptoms recorded this month</div>'}

                          ${monthData.activities.length > 0 ? `
                          <div style="margin-top: 15px;">
                              <strong style="color: #ff9800;">Activities/Triggers:</strong>
                              <div style="margin-top: 5px;">
                                  ${monthData.activities.map(([activity, frequency]) => `
                                      <span style="display: inline-block; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 0.8em; border: 1px solid #e0e0e0;">
                                          ${activity} (${frequency}x)
                                      </span>
                                  `).join('')}
                              </div>
                          </div>
                          ` : ''}
                      </div>
                  `).join('')}
              </div>
              ` : ''}

              <div class="page-break"></div>
              
              <div class="calendar-section">
                  <div class="calendar-title"><span class="emoji">📅</span> Last 3 Months Symptom Calendar</div>
                  ${calendarMonths.map(month => generateMonthHTML(month)).join('')}
              </div>

              <div class="page-break"></div>

              <div class="analysis-section">
                  <div class="analysis-title"><span class="emoji">📊</span> Overall Analysis Summary (${selectedFilterLabel})</div>
                  
                  <div class="stats-grid">
                      <div class="stat-card">
                          <span class="stat-value">${analytics.totalEntries}</span>
                          <div class="stat-label">Total Days</div>
                      </div>
                      <div class="stat-card">
                          <span class="stat-value">${analytics.totalUniqueSymptoms}</span>
                          <div class="stat-label">Unique Symptoms</div>
                      </div>
                      <div class="stat-card">
                          <span class="stat-value">${analytics.badDays}</span>
                          <div class="stat-label">High Symptom Days</div>
                      </div>
                      <div class="stat-card">
                          <span class="stat-value">${analytics.avgSymptomsPerDay.toFixed(1)}</span>
                          <div class="stat-label">Avg Daily Symptoms</div>
                      </div>
                  </div>

                  ${analytics.topSymptoms.length > 0 ? `
                  <div class="symptoms-list">
                      <div class="list-title"><span class="emoji">🔥</span> Most Frequent Symptoms</div>
                      ${analytics.topSymptoms.map(([symptom, frequency]) => {
                        const percentage = ((frequency / analytics.totalEntries) * 100).toFixed(1);
                        const avgSeverity = analytics.symptomAverageSeverity[symptom]?.toFixed(1) || 'N/A';
                        return `
                          <div class="symptom-item">
                              <span><strong>${symptom}</strong> (${frequency} days, ${percentage}%)</span>
                              <span><strong>Avg Severity:</strong> ${avgSeverity}/3</span>
                          </div>
                        `;
                      }).join('')}
                  </div>
                  ` : ''}

                  ${analytics.topActivities.length > 0 ? `
                  <div class="triggers-list">
                      <div class="list-title"><span class="emoji">⚡</span> Common Triggers & Activities</div>
                      ${analytics.topActivities.map(([activity, frequency]) => `
                          <div class="trigger-item">
                              <span><strong>${activity}</strong></span>
                              <span><strong>${frequency} occurrences</strong></span>
                          </div>
                      `).join('')}
                  </div>
                  ` : ''}
              </div>

              <div class="page-break"></div>

              <div class="notes-section">
                  <div class="notes-title"><span class="emoji">📝</span> Notes for Healthcare Provider</div>
                  <ul class="notes-list">
                      <li>This report was generated by EndoCare, a personal symptom tracking mobile application</li>
                      <li>All symptom data is self-reported by the patient using a standardized severity scale (1=Mild, 2=Moderate, 3=Severe)</li>
                      <li>Report period for analysis: ${selectedFilterLabel.toLowerCase()} | Calendar view: Last 3 months only</li>
                      <li>Symptom display format: [Symptom Name] [Severity Number] with color-coded borders</li>
                      <li>Color coding: Blue=Mild(1), Orange=Moderate(2), Red=Severe(3), Purple=Activities/Triggers</li>
                      <li>Green calendar days indicate patient recorded "No Symptoms" for that day</li>
                      <li>Orange tags show symptoms, blue tags show activities/triggers</li>
                      ${medications && medications.length > 0 ? `<li><strong>Current medications:</strong> ${medications.map(med => `${med.name} (${med.dosage}, ${med.frequency})`).join('; ')}</li>` : ''}
                      ${selectedVitamins && selectedVitamins.length > 0 ? `<li><strong>Current supplements/vitamins:</strong> ${selectedVitamins.join(', ')}</li>` : ''}
                      ${surgeries && surgeries.length > 0 ? `<li><strong>Previous surgeries/procedures:</strong> ${surgeries.join('; ')}</li>` : ''}
                      ${diagnoses && diagnoses.length > 0 ? `<li><strong>Other medical conditions:</strong> ${diagnoses.map(diag => `${diag.condition} (diagnosed: ${diag.date})`).join('; ')}</li>` : ''}
                      <li>Please consider this data alongside clinical assessment and examination</li>
                      <li>Patient may have additional symptoms not captured in this digital tracking</li>
                  </ul>
              </div>

              <div class="print-date">
                  Report generated on ${currentDate}
              </div>
          </div>
      </body>
      </html>
      `;
      
      return htmlContent;
    } catch (error) {
      console.error('Error generating PDF content:', error);
      throw error;
    }
  };

  // Export PDF medical report function
  const exportPDFMedicalReport = async () => {
    try {
      console.log('Starting PDF export...');
      console.log('Current entries count:', Object.keys(entries).length);
      console.log('Current filtered entries count:', Object.keys(filteredEntries).length);
      console.log('Selected time filter:', selectedTimeFilter);
      
      // Generate the HTML content with current data
      const htmlContent = await generatePDFMedicalReport();
      
      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `EndoCare-Medical-Report-${timestamp}.pdf`;
      const newUri = FileSystem.documentDirectory + filename;
      
      // Move the file to a permanent location
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      
      // Share the PDF
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Medical Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Medical Report',
        });
      }
      
    } catch (error) {
      Alert.alert(
        'Export Error', 
        'Unable to generate PDF report. Please ensure you have enough storage space and try again.'
      );
      console.error('PDF export error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ EndoCare ✨</Text>
        <Text style={styles.headerSubtitle}>Your personal endometriosis tracker</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Clarity Banner */}
        {bannerVisible && (
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <Text style={styles.bannerIcon}>ℹ️</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>About Your Data</Text>
                <Text style={styles.bannerText}>
                  Only days with recorded entries are included. Use "No Symptoms" button on days you feel well to track symptom-free days accurately.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBannerVisible(false)}
                style={styles.bannerCloseButton}
              >
                <Text style={styles.bannerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add consistent spacing when banner is dismissed */}
        {!bannerVisible && <View style={styles.headerSpacing} />}

        {/* Time Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Analysis Period</Text>
          <Text style={styles.scrollHint}>👆 Scroll to see more options →</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <View style={styles.filterContainer}>
              {timeFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterButton,
                    selectedTimeFilter === option.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedTimeFilter(option.key as TimeFilter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedTimeFilter === option.key && styles.filterButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
            <Text style={styles.statSubtext}>Tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalUniqueSymptoms}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
            <Text style={styles.statSubtext}>Experienced</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.avgSymptomsPerDay.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
            <Text style={styles.statSubtext}>Symptoms</Text>
          </View>
        </View>

        {/* Good vs Bad Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😊 Good vs Bad Days</Text>
          <View style={styles.spacer} />
          <View style={styles.goodBadContainer}>
            <View style={styles.goodBadItem}>
              <View style={[styles.goodBadCircle, { backgroundColor: '#4ade80' }]}>
                <Text style={styles.goodBadNumber}>{analytics.goodDays}</Text>
              </View>
              <Text style={styles.goodBadLabel}>Symptom-Free Days</Text>
              <Text style={styles.goodBadSubtext}>(recorded)</Text>
            </View>
            <View style={styles.goodBadItem}>
              <View style={[styles.goodBadCircle, { backgroundColor: '#f87171' }]}>
                <Text style={styles.goodBadNumber}>{analytics.badDays}</Text>
              </View>
              <Text style={styles.goodBadLabel}>High Symptom Days</Text>
              <Text style={styles.goodBadSubtext}>(3+ symptoms)</Text>
            </View>
          </View>
          
          {/* Additional circles row */}
          <View style={styles.goodBadContainer}>
            <View style={styles.goodBadItem}>
              <View style={[styles.goodBadCircle, { backgroundColor: '#fbbf24' }]}>
                <Text style={styles.goodBadNumber}>{analytics.daysWithSymptoms}</Text>
              </View>
              <Text style={styles.goodBadLabel}>Days with Symptoms</Text>
              <Text style={styles.goodBadSubtext}>(1+ symptom)</Text>
            </View>
            <View style={styles.goodBadItem}>
              <View style={[styles.goodBadCircle, { backgroundColor: '#9ca3af' }]}>
                <Text style={styles.goodBadNumber}>{analytics.missedDays}</Text>
              </View>
              <Text style={styles.goodBadLabel}>Missed Days</Text>
              <Text style={styles.goodBadSubtext}>(No data)</Text>
            </View>
          </View>
          
          <Text style={styles.goodBadNote}>
            💡 Tip: Use "No Symptoms" button daily to track more symptom-free days
          </Text>
        </View>

        {/* Most Frequent Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Most Frequent Symptoms</Text>
          <Text style={styles.sectionSubtitle}>In the last {selectedFilterLabel.toLowerCase()}</Text>
          {analytics.topSymptoms.length > 0 ? (
            analytics.topSymptoms.map(([symptom, frequency]) => (
              <View key={symptom} style={styles.symptomFrequencyItem}>
                <Text style={styles.symptomFrequencyName}>{symptom}</Text>
                <View style={styles.frequencyBar}>
                  <View 
                    style={[
                      styles.frequencyFill,
                      { width: `${(frequency / analytics.totalEntries) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.frequencyText}>{frequency} days</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Start tracking symptoms to see analysis</Text>
          )}
        </View>

        {/* Most Severe Symptoms */}
        {analytics.mostSevereSymptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Highest Severity Symptoms</Text>
            <Text style={styles.sectionSubtitle}>Average severity when experienced</Text>
            {analytics.mostSevereSymptoms.map(([symptom, avgSeverity]) => (
              <View key={symptom} style={styles.severityItem}>
                <Text style={styles.severityName}>{symptom}</Text>
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>{avgSeverity.toFixed(1)}/3</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Common Triggers */}
        {analytics.topActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Common Triggers & Activities</Text>
            <Text style={styles.sectionSubtitle}>Activities recorded with symptoms</Text>
            {analytics.topActivities.map(([activity, frequency]) => (
              <View key={activity} style={styles.activityItem}>
                <Text style={styles.activityName}>{activity}</Text>
                <Text style={styles.activityFrequency}>{frequency} times</Text>
              </View>
            ))}
          </View>
        )}

        {/* Medical Export Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Medical Export</Text>
          <Text style={styles.sectionSubtitle}>Generate a professional PDF report for your healthcare provider</Text>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportPDFMedicalReport}
          >
            <Text style={styles.exportButtonIcon}>📄</Text>
            <View style={styles.exportButtonTextContainer}>
              <Text style={styles.exportButtonTitle}>Export PDF Medical Report</Text>
              <Text style={styles.exportButtonSubtitle}>
                {selectedFilterLabel} monthly analysis + last 3 months calendar + summary • Share or save
              </Text>
            </View>
            <Text style={styles.exportButtonArrow}>→</Text>
          </TouchableOpacity>
          
          <View style={styles.exportInfo}>
            <Text style={styles.exportInfoTitle}>PDF Report includes:</Text>
            <Text style={styles.exportInfoText}>
              • Monthly breakdown for {selectedFilterLabel.toLowerCase()} period with symptom tables{'\n'}
              • Visual 3-month calendar with color-coded borders{'\n'}
              • Severity levels (Blue=Mild, Orange=Moderate, Red=Severe){'\n'}
              • Personal medical information from your profile{'\n'}
              • Professional formatting for medical use{'\n'}
              • Ready to print or share digitally
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 100 }} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filterScrollView: {
    marginHorizontal: -16,
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
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
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
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
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.gray500,
  },
  goodBadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goodBadItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  goodBadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    textAlign: 'center',
    minHeight: 36,
    display: 'flex',
    alignItems: 'center',
  },
  goodBadSubtext: {
    fontSize: 11,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 2,
    minHeight: 24,
  },
  spacer: {
    height: 12,
  },
  headerSpacing: {
    height: 16,
  },
  symptomFrequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  symptomFrequencyName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  frequencyBar: {
    flex: 2,
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  frequencyFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  frequencyText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'right',
  },
  severityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  severityName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  activityFrequency: {
    fontSize: 12,
    color: colors.gray500,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.gray500,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  bannerContainer: {
    margin: 16,
    marginBottom: 8,
  },
  banner: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 16,
  },
  bannerCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 105, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bannerCloseText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: 'bold',
  },
  goodBadNote: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exportButtonTextContainer: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  exportButtonSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  exportButtonArrow: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  exportInfo: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
  },
  exportInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 6,
  },
  exportInfoText: {
    fontSize: 12,
    color: colors.gray600,
    lineHeight: 18,
  },
});