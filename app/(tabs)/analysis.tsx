import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
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
import { AnalyticsStats } from '../../components/analysis/AnalyticsStats';
import { GoodBadDays } from '../../components/analysis/GoodBadDays';
import { SeverityAnalysis } from '../../components/analysis/SeverityAnalysis';
import { SymptomFrequency } from '../../components/analysis/SymptomFrequency';
import { TimeFilterSelector } from '../../components/analysis/TimeFilterSelector';
import { TriggerAnalysis } from '../../components/analysis/TriggerAnalysis';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { useAppRating } from '../../hooks/useAppRating';
import { useEndoData } from '../../hooks/useEndoData';
import { colors } from '../../utils/constants';

type TimeFilter = '30d' | '3m' | '6m' | '1y' | 'all';

const selectedFilterLabelMap: Record<TimeFilter, string> = {
  '30d': '30 Days',
  '3m': '3 Months', 
  '6m': '6 Months',
  '1y': '1 Year',
  'all': 'All Time'
};

export default function AnalysisScreen() {
  const { entries, refreshEntries, profileData, medications } = useEndoData();
  const { checkAndPromptRating } = useAppRating();
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('3m');
  const [bannerVisible, setBannerVisible] = useState(true);

  // Extract data from profileData for easier access in PDF generation
  const surgeries = profileData?.surgeries || [];
  const selectedVitamins = profileData?.selectedVitamins || [];

  // Use the analytics hook for data processing
  const { filteredEntries, analytics } = useAnalyticsData(entries, selectedTimeFilter);
  const selectedFilterLabel = selectedFilterLabelMap[selectedTimeFilter];

  // Force refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshEntries();
      
      // Check if we should prompt for rating when user views analysis (indicates engagement)
      const entryCount = Object.keys(entries).length;
      if (entryCount >= 3) {
        // Only prompt if user has some data to analyze (shows they're using the app)
        setTimeout(() => {
          checkAndPromptRating();
        }, 2000); // Wait 2 seconds so user can see their analysis first
      }
    }, [refreshEntries, checkAndPromptRating, entries])
  );

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
    
    return { monthName, days };
  };

  // PDF Export functionality
  const exportPDFMedicalReport = async () => {
    try {
      // Get all months covered by the filtered entries
      const entryDates = Object.keys(filteredEntries).map(dateStr => new Date(dateStr));
      const earliestDate = new Date(Math.min(...entryDates.map(d => d.getTime())));
      const latestDate = new Date(Math.max(...entryDates.map(d => d.getTime())));
      
      // Generate monthly data for the filtered period
      const months = [];
      const currentMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
      const endMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      
      while (currentMonth <= endMonth) {
        months.push(generateMonthData(new Date(currentMonth)));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
      
      // Generate last 3 months for calendar view
      const calendarMonths = [];
      const today = new Date();
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        calendarMonths.push(generateMonthData(monthDate));
      }

      const getSymptomSeverityLevel = (date: Date) => {
        const dateStr = formatDate(date);
        const entry = entries[dateStr];
        if (!entry || !entry.symptoms) return 0;
        
        let maxSeverity = 0;
        Object.values(entry.symptoms).forEach((categorySymptoms: any) => {
          Object.values(categorySymptoms).forEach((severity: any) => {
            if (typeof severity === 'number' && severity > maxSeverity) {
              maxSeverity = severity;
            }
          });
        });
        return maxSeverity;
      };

      const getSeverityColor = (severity: number) => {
        switch (severity) {
          case 1: return '#3b82f6'; // Blue - mild
          case 2: return '#f59e0b'; // Orange - moderate
          case 3: return '#ef4444'; // Red - severe
          default: return 'transparent';
        }
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.4; 
              color: #1f2937; 
              font-size: 12px;
              margin: 0;
              padding: 60px 45px 30px 45px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #b5407a; 
              padding-bottom: 15px;
            }
            .title { 
              font-size: 24px; 
              font-weight: 300; 
              color: #b5407a; 
              margin: 0 0 5px 0;
            }
            .subtitle { 
              color: #6b7280; 
              margin: 0;
              font-size: 14px;
            }
            .section { 
              margin-bottom: 20px; 
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: 600; 
              color: #1f2937; 
              margin-bottom: 10px;
              border-left: 4px solid #b5407a;
              padding-left: 10px;
            }
            .profile-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin-bottom: 15px;
            }
            .profile-item { 
              background: #f9fafb; 
              padding: 8px 12px; 
              border-radius: 6px;
            }
            .profile-label { 
              font-weight: 600; 
              color: #374151; 
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .profile-value { 
              color: #1f2937; 
              margin-top: 2px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin: 15px 0;
            }
            .stat-card { 
              background: #f9fafb; 
              padding: 15px; 
              text-align: center; 
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .stat-number { 
              font-size: 20px; 
              font-weight: bold; 
              color: #b5407a; 
              display: block;
            }
            .stat-label { 
              color: #374151; 
              font-size: 11px; 
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .month-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .month-title {
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .symptoms-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            .symptoms-table th,
            .symptoms-table td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
              text-align: left;
            }
            .symptoms-table th {
              background: #f3f4f6;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .severity-1 { color: #3b82f6; font-weight: 600; }
            .severity-2 { color: #f59e0b; font-weight: 600; }
            .severity-3 { color: #ef4444; font-weight: 600; }
            .calendar-section {
              margin-top: 30px;
              page-break-before: always;
              padding-top: 40px;
            }
            .calendar-month {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .calendar-grid {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 1px;
              margin-top: 8px;
            }
            .calendar-header {
              background: #f3f4f6;
              padding: 6px;
              text-align: center;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .calendar-day {
              aspect-ratio: 1;
              border: 2px solid transparent;
              padding: 2px;
              text-align: center;
              font-size: 10px;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 20px;
            }
            .calendar-day.other-month {
              color: #9ca3af;
              background: #f9fafb;
            }
            .legend {
              margin: 15px 0;
              background: #f9fafb;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .legend-title {
              font-weight: 600;
              font-size: 11px;
              color: #374151;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .legend-items {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
            }
            .legend-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 10px;
            }
            .legend-color {
              width: 12px;
              height: 12px;
              border: 2px solid;
              border-radius: 2px;
              background: #fff;
            }
            .no-data { 
              color: #6b7280; 
              font-style: italic; 
              text-align: center; 
              padding: 20px;
              background: #f9fafb;
              border-radius: 6px;
            }
            ul { 
              margin: 8px 0; 
              padding-left: 18px;
            }
            li { 
              margin: 3px 0; 
              font-size: 11px;
            }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">✨ EndoCare Medical Report ✨</div>
            <div class="subtitle">Comprehensive Endometriosis Tracking Analysis</div>
            <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
              Generated on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Personal Medical Information</div>
            <div class="profile-grid">
              <div class="profile-item">
                <div class="profile-label">Patient Name</div>
                <div class="profile-value">${profileData.name || 'Not provided'}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Age</div>
                <div class="profile-value">${profileData.age || 'Not provided'}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Diagnosis Year</div>
                <div class="profile-value">${profileData.diagnosisYear || 'Not provided'}</div>
              </div>
              <div class="profile-item">
                <div class="profile-label">Endometriosis Stage</div>
                <div class="profile-value">${profileData.endoStage || 'Not provided'}</div>
              </div>
            </div>
            
            ${surgeries.length > 0 ? `
              <div style="margin-top: 15px;">
                <div class="profile-label">Previous Surgeries</div>
                <ul>${surgeries.map((surgery: string) => `<li>${surgery}</li>`).join('')}</ul>
              </div>
            ` : ''}

            ${medications.length > 0 ? `
              <div style="margin-top: 15px;">
                <div class="profile-label">Current Medications</div>
                <ul>
                  ${medications.map((med: any) => 
                    `<li><strong>${med.name}</strong> - ${med.dosage}, ${med.frequency}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}

            ${selectedVitamins.length > 0 ? `
              <div style="margin-top: 15px;">
                <div class="profile-label">Supplements & Vitamins</div>
                <ul>${selectedVitamins.map((vitamin: string) => `<li>${vitamin}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">📊 Analysis Summary (${selectedFilterLabel})</div>
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${analytics.totalEntries}</span>
                <div class="stat-label">Total Days Tracked</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${analytics.totalUniqueSymptoms}</span>
                <div class="stat-label">Unique Symptoms</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${analytics.avgSymptomsPerDay.toFixed(1)}</span>
                <div class="stat-label">Avg Daily Symptoms</div>
              </div>
            </div>
          </div>

          ${analytics.topSymptoms.length > 0 ? `
            <div class="section">
              <div class="section-title">📊 Most Common Symptoms</div>
              <table class="symptoms-table">
                <thead>
                  <tr>
                    <th>Symptom</th>
                    <th>Frequency</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.topSymptoms.map(([symptom, frequency]) => `
                    <tr>
                      <td>${symptom}</td>
                      <td>${frequency} days</td>
                      <td>${((frequency / analytics.totalEntries) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${analytics.mostSevereSymptoms.length > 0 ? `
            <div class="section">
              <div class="section-title">🔥 Highest Severity Symptoms</div>
              <table class="symptoms-table">
                <thead>
                  <tr>
                    <th>Symptom</th>
                    <th>Average Severity</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.mostSevereSymptoms.map(([symptom, avgSeverity]) => `
                    <tr>
                      <td>${symptom}</td>
                      <td class="severity-${Math.round(avgSeverity)}">${avgSeverity.toFixed(1)}/3</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          ${analytics.topActivities.length > 0 ? `
            <div class="section">
              <div class="section-title">🔍 Common Triggers & Activities</div>
              <table class="symptoms-table">
                <thead>
                  <tr>
                    <th>Activity/Trigger</th>
                    <th>Frequency</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.topActivities.map(([activity, frequency]) => `
                    <tr>
                      <td>${activity}</td>
                      <td>${frequency} days</td>
                      <td>${((frequency / analytics.totalEntries) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          ${Object.keys(profileData?.customSymptoms || {}).length > 0 ? `
            <div class="section">
              <div class="section-title">✨ Custom Symptoms Tracked</div>
              <div style="margin-bottom: 15px;">
                ${Object.entries(profileData?.customSymptoms || {}).map(([category, symptoms]) => `
                  <div style="margin-bottom: 10px;">
                    <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">${category}</div>
                    <div style="padding-left: 15px;">
                      ${symptoms.map((symptom: string) => `
                        <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">• ${symptom}</div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${(profileData?.customActivities || []).length > 0 ? `
            <div class="section">
              <div class="section-title">🎯 Custom Activities & Triggers</div>
              <div style="margin-bottom: 15px;">
                <ul style="margin: 0; padding-left: 18px;">
                  ${(profileData?.customActivities || []).map((activity: string) => `
                    <li style="margin: 3px 0; font-size: 11px;">${activity}</li>
                  `).join('')}
                </ul>
              </div>
            </div>
          ` : ''}

          <div class="calendar-section">
            <div class="section-title">📅 3-Month Symptom Calendar</div>
            
            <div class="legend">
              <div class="legend-title">Severity Legend</div>
              <div class="legend-items">
                <div class="legend-item">
                  <div class="legend-color" style="border-color: #3b82f6;"></div>
                  <span>Mild (1)</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="border-color: #f59e0b;"></div>
                  <span>Moderate (2)</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="border-color: #ef4444;"></div>
                  <span>Severe (3)</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="border-color: #4ade80;"></div>
                  <span>No Symptoms</span>
                </div>
              </div>
            </div>

            ${calendarMonths.map(({ monthName, days }) => `
              <div class="calendar-month">
                <div class="month-title">${monthName}</div>
                <div class="calendar-grid">
                  <div class="calendar-header">Sun</div>
                  <div class="calendar-header">Mon</div>
                  <div class="calendar-header">Tue</div>
                  <div class="calendar-header">Wed</div>
                  <div class="calendar-header">Thu</div>
                  <div class="calendar-header">Fri</div>
                  <div class="calendar-header">Sat</div>
                  
                  ${days.map(({ date, isCurrentMonth }) => {
                    const dateStr = formatDate(date);
                    const entry = entries[dateStr];
                    const severity = getSymptomSeverityLevel(date);
                    const isNoSymptoms = entry?.noSymptomsRecorded;
                    
                    let borderColor = 'transparent';
                    if (isNoSymptoms) {
                      borderColor = '#4ade80'; // Green for no symptoms
                    } else if (severity > 0) {
                      borderColor = getSeverityColor(severity);
                    }
                    
                    return `
                      <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''}" 
                           style="border-color: ${borderColor};">
                        ${date.getDate()}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; text-align: center;">
            <p>This report was generated by EndoCare - Your personal endometriosis tracker</p>
            <p>For questions about this report, please consult with your healthcare provider</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share EndoCare Medical Report',
        UTI: 'com.adobe.pdf'
      });

    } catch (error) {
      Alert.alert(
        'Export Error', 
        'Unable to generate PDF report. Please ensure you have enough storage space and try again.'
      );
      console.error('PDF export error:', error);
    }
  };

  return (
    <ErrorBoundary
      fallbackTitle="Analysis Error"
      fallbackMessage="Something went wrong loading your symptom analysis. Your data is safe, please restart the app."
      onRetry={() => refreshEntries()}
    >
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
                  Only days with recorded entries are included. Use &ldquo;No Symptoms&rdquo; button on days you feel well to track symptom-free days accurately.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBannerVisible(false)}
                style={styles.bannerCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close banner"
              >
                <Text style={styles.bannerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add consistent spacing when banner is dismissed */}
        {!bannerVisible && <View style={styles.headerSpacing} />}

        {/* Time Filter */}
        <SectionErrorBoundary sectionName="Time Filter">
          <TimeFilterSelector
            selectedTimeFilter={selectedTimeFilter}
            onFilterChange={setSelectedTimeFilter}
          />
        </SectionErrorBoundary>

        {/* Stats Overview */}
        <SectionErrorBoundary sectionName="Statistics">
          <AnalyticsStats
            totalEntries={analytics.totalEntries}
            totalUniqueSymptoms={analytics.totalUniqueSymptoms}
            avgSymptomsPerDay={analytics.avgSymptomsPerDay}
          />
        </SectionErrorBoundary>

        {/* Good vs Bad Days */}
        <SectionErrorBoundary sectionName="Good vs Bad Days">
          <GoodBadDays
            goodDays={analytics.goodDays}
            badDays={analytics.badDays}
            expectedTotalDays={analytics.expectedTotalDays}
          />
        </SectionErrorBoundary>

        {/* Most Common Symptoms */}
        <SectionErrorBoundary sectionName="Symptom Frequency">
          <SymptomFrequency
            topSymptoms={analytics.topSymptoms}
            totalEntries={analytics.totalEntries}
          />
        </SectionErrorBoundary>

        {/* Most Severe Symptoms */}
        <SectionErrorBoundary sectionName="Severity Analysis">
          <SeverityAnalysis
            mostSevereSymptoms={analytics.mostSevereSymptoms}
          />
        </SectionErrorBoundary>

        {/* Common Triggers */}
        <SectionErrorBoundary sectionName="Trigger Analysis">
          <TriggerAnalysis
            topActivities={analytics.topActivities}
          />
        </SectionErrorBoundary>

        {/* Medical Export Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Medical Export</Text>
          <Text style={styles.sectionSubtitle}>Generate a professional PDF report for your healthcare provider</Text>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportPDFMedicalReport}
            accessibilityRole="button"
            accessibilityLabel="Export PDF medical report"
            accessibilityHint="Generate and share a professional PDF report for your healthcare provider"
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
              • Common triggers and activities analysis{'\n'}
              • Custom symptoms and activities you&rsquo;ve added{'\n'}
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
  content: {
    flex: 1,
  },
  bannerContainer: {
    margin: 16,
    marginBottom: 0,
  },
  banner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  bannerCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bannerCloseText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSpacing: {
    height: 16,
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
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  exportButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
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
    color: colors.primary,
    marginBottom: 4,
  },
  exportButtonSubtitle: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.8,
  },
  exportButtonArrow: {
    fontSize: 18,
    color: colors.primary,
    marginLeft: 8,
  },
  exportInfo: {
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 8,
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
    lineHeight: 16,
  },
});