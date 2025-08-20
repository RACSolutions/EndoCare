export interface SymptomEntry {
    date: string;
    symptoms: {
      [category: string]: {
        [symptom: string]: number; // severity 1-3
      };
    };
    activities: string[];
    notes: string;
    customActivities: string;
  }
  
  export interface Medication {
    name: string;
    dosage: string;
    frequency: string;
  }
  
  export interface Diagnosis {
    condition: string;
    date: string;
  }
  
  export interface SymptomCategory {
    name: string;
    icon: string;
    symptoms: string[];
  }
  
  export interface ActivityCategory {
    name: string;
    icon: string;
  }