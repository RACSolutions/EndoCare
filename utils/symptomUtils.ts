import { SymptomCategory } from '../types';
import { symptomCategories } from './constants';

export const getCombinedSymptomCategories = (customSymptoms: { [category: string]: string[] } = {}): { [key: string]: SymptomCategory } => {
  const combined = { ...symptomCategories };
  
  // Add custom symptoms to existing categories
  Object.keys(customSymptoms).forEach(categoryKey => {
    if (combined[categoryKey] && customSymptoms[categoryKey]) {
      combined[categoryKey] = {
        ...combined[categoryKey],
        symptoms: [...combined[categoryKey].symptoms, ...customSymptoms[categoryKey]]
      };
    }
  });
  
  return combined;
};

export const getSymptomsByCategory = (category: string, customSymptoms: { [category: string]: string[] } = {}): string[] => {
  const defaultSymptoms = symptomCategories[category]?.symptoms || [];
  const additionalSymptoms = customSymptoms[category] || [];
  return [...defaultSymptoms, ...additionalSymptoms];
};

export const isCustomSymptom = (category: string, symptom: string, customSymptoms: { [category: string]: string[] } = {}): boolean => {
  const customSymptomsInCategory = customSymptoms[category] || [];
  return customSymptomsInCategory.includes(symptom);
};