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
  customSymptoms: { [category: string]: string[] };
  customActivities: string[];
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
    selectedVitamins: [],
    customSymptoms: {},
    customActivities: []
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
          setProfileData({ 
            ...savedProfileData,
            customSymptoms: savedProfileData.customSymptoms || {},
            customActivities: savedProfileData.customActivities || []
          });
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
    
    setEntries(prev => {
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
      
      return newEntries;
    });
  }, []);

  const updateProfileData = useCallback((updates: Partial<ProfileData>) => {
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
    try {
      Object.values(entry.symptoms).forEach((categorySymptoms) => {
        // Validate that categorySymptoms is an object
        if (!categorySymptoms || typeof categorySymptoms !== 'object') {
          return;
        }
        
        Object.values(categorySymptoms).forEach((severity) => {
          // Validate that severity is a number
          if (typeof severity === 'number' && !isNaN(severity) && severity > maxSeverity) {
            maxSeverity = severity;
          }
        });
      });
    } catch (error) {
      console.error('Error processing symptom severity:', error);
    }
    return maxSeverity;
  }, [entries]);

  const getAnalysisData = useCallback(() => {
    const symptomFrequency: { [symptom: string]: number } = {};
    let totalEntries = 0;

    try {
      Object.values(entries).forEach(entry => {
        if (entry && entry.symptoms && typeof entry.symptoms === 'object' && Object.keys(entry.symptoms).length > 0) {
          totalEntries++;
          Object.values(entry.symptoms).forEach((categorySymptoms) => {
            // Validate that categorySymptoms is an object
            if (!categorySymptoms || typeof categorySymptoms !== 'object') {
              return;
            }
            
            Object.keys(categorySymptoms).forEach(symptom => {
              if (typeof symptom === 'string') {
                symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
              }
            });
          });
        }
      });
    } catch (error) {
      console.error('Error processing analysis data:', error);
    }

    return { symptomFrequency, totalEntries };
  }, [entries]);

  const refreshEntries = useCallback(async () => {
    try {
      const savedEntries = await loadData('endoCareEntries');
      if (savedEntries) {
        setEntries({ ...savedEntries });
      }
    } catch (error) {
      console.error('Error force refreshing entries:', error);
    }
  }, []);

  const debugEntry = useCallback((date: Date) => {
    const dateStr = formatDate(date);
    const entry = entries[dateStr];
    return entry;
  }, [entries]);

  const addCustomSymptom = useCallback((category: string, symptom: string) => {
    setProfileData(prev => {
      const newCustomSymptoms = { ...prev.customSymptoms };
      if (!newCustomSymptoms[category]) {
        newCustomSymptoms[category] = [];
      }
      if (!newCustomSymptoms[category].includes(symptom)) {
        newCustomSymptoms[category].push(symptom);
      }
      return {
        ...prev,
        customSymptoms: newCustomSymptoms
      };
    });
  }, []);

  const removeCustomSymptom = useCallback((category: string, symptom: string) => {
    setProfileData(prev => {
      const newCustomSymptoms = { ...prev.customSymptoms };
      if (newCustomSymptoms[category]) {
        newCustomSymptoms[category] = newCustomSymptoms[category].filter(s => s !== symptom);
        if (newCustomSymptoms[category].length === 0) {
          delete newCustomSymptoms[category];
        }
      }
      return {
        ...prev,
        customSymptoms: newCustomSymptoms
      };
    });
  }, []);

  const addCustomActivity = useCallback((activity: string) => {
    setProfileData(prev => {
      if (!prev.customActivities.includes(activity)) {
        return {
          ...prev,
          customActivities: [...prev.customActivities, activity]
        };
      }
      return prev;
    });
  }, []);

  const removeCustomActivity = useCallback((activity: string) => {
    setProfileData(prev => ({
      ...prev,
      customActivities: prev.customActivities.filter(a => a !== activity)
    }));
  }, []);

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
    addCustomSymptom,
    removeCustomSymptom,
    addCustomActivity,
    removeCustomActivity,
    isLoaded
  };
};