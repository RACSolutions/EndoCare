import { ActivityCategory, SymptomCategory } from '../types';

export const colors = {
  primary: '#b5407a',
  primaryLight: '#f0e6ed',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  red100: '#fee2e2',
  red800: '#991b1b',
};

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const symptomCategories: { [key: string]: SymptomCategory } = {
  pain: {
    name: 'Pain',
    icon: '🔥',
    symptoms: [
      'Pelvic pain',
      'Back pain',
      'Leg pain',
      'Headache',
      'Muscle aches',
      'Joint pain',
      'Abdominal pain',
      'Chest pain',
      'Painful intercourse',
      'Ovulation pain',
      'Tailbone pain',
      'Shoulder pain'
    ]
  },
  menstrual: {
    name: 'Menstrual',
    icon: '🩸',
    symptoms: [
      'Heavy bleeding',
      'Light bleeding',
      'Spotting',
      'Clots',
      'Irregular cycle',
      'Missed period',
      'Cramps',
      'PMS symptoms'
    ]
  },
  digestive: {
    name: 'Digestive',
    icon: '🤢',
    symptoms: [
      'Nausea',
      'Vomiting',
      'Bloating',
      'Constipation',
      'Diarrhea',
      'Gas',
      'Food sensitivity',
      'Loss of appetite',
      'Stomach pain',
      'Acid reflux'
    ]
  },
  emotional: {
    name: 'Emotional',
    icon: '😔',
    symptoms: [
      'Anxiety',
      'Depression',
      'Mood swings',
      'Irritability',
      'Brain fog',
      'Stress',
      'Vivid dreams',
      'Difficulty concentrating',
      'Memory issues',
      'Emotional numbness'
    ]
  },
  physical: {
    name: 'Physical',
    icon: '💪',
    symptoms: [
      'Weakness',
      'Dizziness',
      'Hot flashes',
      'Cold chills',
      'Night sweats',
      'Muscle tension',
      'Restlessness',
      'Tender breasts',
      'Frequent urination',
      'Painful urination',
      'Hair changes',
      'Skin changes'
    ]
  },
  sleepEnergy: {
    name: 'Sleep & Energy',
    icon: '😴',
    symptoms: [
      'Fatigue',
      'Exhaustion',
      'Sleep disturbances',
      'Insomnia',
      'Excessive sleepiness',
      'Energy crashes',
      'Restless sleep',
      'Difficulty falling asleep',
      'Waking up tired',
      'Needing frequent naps'
    ]
  }
};

export const activityCategories: { [key: string]: ActivityCategory } = {
  work: {
    name: 'Work',
    icon: '💼'
  },
  exercise: {
    name: 'Exercise',
    icon: '🏃'
  },
  travel: {
    name: 'Travel',
    icon: '✈️'
  },
  stress: {
    name: 'Stress',
    icon: '😰'
  },
  weather: {
    name: 'Weather change',
    icon: '🌦️'
  },
  social: {
    name: 'Social events',
    icon: '👥'
  },
  medication: {
    name: 'Medication',
    icon: '💊'
  },
  sleep: {
    name: 'Poor sleep',
    icon: '😴'
  }
};