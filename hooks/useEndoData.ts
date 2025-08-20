import { useCallback, useEffect, useState } from 'react';
import { Diagnosis, Medication, SymptomEntry } from '../types';
import { formatDate, loadData, saveData } from '../utils/storage';

interface ProfileData {
  name: string;
  age: string;
  diagnosisYear: string;
  endoStage: string;
  surgeries: string[];
  selectedVitamins: string[];
}

export const useEndoData = () => {
  const [entries, setEntries] = useState<{ [key: string]: SymptomEntry }>({});
  const [medications, setMedications] = useState<Medication[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    age: '',
    diagnosisYear: '',
    endoStage: '',
    surgeries: [],
    selectedVitamins: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on app start
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const savedEntries = await loadData('endoCareEntries');
        const savedMedications = await loadData('endoCareMedications');
        const savedDiagnoses = await loadData('endoCareDiagnoses');
        const savedProfileData = await loadData('endoCareProfile');

        if (savedEntries) {
          console.log('Loaded entries from storage:', Object.keys(savedEntries));
          setEntries({ ...savedEntries });
        }
        if (savedMedications) setMedications(savedMedications);
        if (savedDiagnoses) setDiagnoses(savedDiagnoses);
        if (savedProfileData) {
          console.log('Loaded profile data:', savedProfileData);
          setProfileData({ ...savedProfileData });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAllData();
  }, []);

  // Save entries when they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      console.log('Saving entries to storage:', Object.keys(entries));
      saveData('endoCareEntries', entries);
    }
  }, [entries, isLoaded]);

  // Save medications when they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveData('endoCareMedications', medications);
    }
  }, [medications, isLoaded]);

  // Save diagnoses when they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveData('endoCareDiagnoses', diagnoses);
    }
  }, [diagnoses, isLoaded]);

  // Save profile data when it changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      console.log('Saving profile data to storage:', profileData);
      saveData('endoCareProfile', profileData);
    }
  }, [profileData, isLoaded]);

  const getCurrentEntry = useCallback((selectedDate: Date): SymptomEntry => {
    const dateStr = formatDate(selectedDate);
    return entries[dateStr] || {
      date: dateStr,
      symptoms: {},
      activities: [],
      notes: '',
      customActivities: ''
    };
  }, [entries]);

  const updateEntry = useCallback((selectedDate: Date, updates: Partial<SymptomEntry>) => {
    const dateStr = formatDate(selectedDate);
    
    console.log('updateEntry called:', {
      selectedDate: selectedDate.toString(),
      dateStr,
      updates
    });
    
    setEntries(prev => {
      console.log('Previous entries keys:', Object.keys(prev));
      
      const currentEntry = prev[dateStr] || {
        date: dateStr,
        symptoms: {},
        activities: [],
        notes: '',
        customActivities: ''
      };
      
      const updatedEntry = {
        ...currentEntry,
        ...updates,
        date: dateStr
      };
      
      const newEntries = {
        ...prev,
        [dateStr]: updatedEntry
      };
      
      console.log('New entries keys after update:', Object.keys(newEntries));
      console.log('Updated entry for', dateStr, ':', updatedEntry);
      
      return newEntries;
    });
  }, []);

  const updateProfileData = useCallback((updates: Partial<ProfileData>) => {
    console.log('updateProfileData called:', updates);
    setProfileData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const getCategorySymptomCount = useCallback((selectedDate: Date, categoryKey: string): number => {
    const currentEntry = getCurrentEntry(selectedDate);
    const categorySymptoms = currentEntry.symptoms[categoryKey];
    if (!categorySymptoms) return 0;
    return Object.keys(categorySymptoms).length;
  }, [getCurrentEntry]);

  const getSymptomSeverityForDate = useCallback((date: Date): number => {
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
  }, [entries]);

  const getAnalysisData = useCallback(() => {
    const symptomFrequency: { [symptom: string]: number } = {};
    let totalEntries = 0;

    Object.values(entries).forEach(entry => {
      if (entry.symptoms && Object.keys(entry.symptoms).length > 0) {
        totalEntries++;
        Object.values(entry.symptoms).forEach((categorySymptoms: any) => {
          Object.keys(categorySymptoms).forEach(symptom => {
            symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
          });
        });
      }
    });

    return { symptomFrequency, totalEntries };
  }, [entries]);

  const refreshEntries = useCallback(async () => {
    try {
      const savedEntries = await loadData('endoCareEntries');
      if (savedEntries) {
        console.log('Force refreshed entries from storage:', Object.keys(savedEntries));
        setEntries({ ...savedEntries });
      }
    } catch (error) {
      console.error('Error force refreshing entries:', error);
    }
  }, []);

  const debugEntry = useCallback((date: Date) => {
    const dateStr = formatDate(date);
    const entry = entries[dateStr];
    console.log(`Debug entry for ${dateStr}:`, entry);
    console.log('All entries:', Object.keys(entries));
    return entry;
  }, [entries]);

  return {
    entries,
    medications,
    diagnoses,
    profileData,
    setMedications,
    setDiagnoses,
    updateProfileData,
    getCurrentEntry,
    updateEntry,
    getCategorySymptomCount,
    getSymptomSeverityForDate,
    getAnalysisData,
    refreshEntries,
    debugEntry,
    isLoaded
  };
};