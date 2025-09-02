import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNIap, { Product, PurchaseResult } from 'react-native-iap';
import { useEndoData } from '../../hooks/useEndoData';
import { useAppRating } from '../../hooks/useAppRating';
import { colors } from '../../utils/constants';

const commonVitamins = [
  'Alpha Lipoic Acid', 'Ashwagandha', 'B-Complex', 'Biotin', 'Calcium', 
  'CoQ10 (Coenzyme Q10)', 'Curcumin/Turmeric', 'Evening Primrose Oil', 
  'Folic Acid', 'Ginger', 'Glutamine', 'Iron', 'Magnesium', 'Melatonin',
  'Milk Thistle', 'N-Acetylcysteine (NAC)', 'Omega-3 Fish Oil', 'Probiotics', 
  'Quercetin', 'Resveratrol', 'Selenium', 'Spirulina', 'Vitamin B12', 
  'Vitamin C', 'Vitamin D', 'Vitamin E', 'Zinc'
].sort();

interface FormModalProps {
  visible: boolean;
  title: string;
  fields: Array<{
    label: string;
    placeholder: string;
    key: string;
    required?: boolean;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
  }>;
  onSubmit: (values: { [key: string]: string }) => void;
  onCancel: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ visible, title, fields, onSubmit, onCancel }) => {
  const [values, setValues] = useState<{ [key: string]: string }>({});

  // Initialize values when modal opens
  useEffect(() => {
    if (visible) {
      const initialValues: { [key: string]: string } = {};
      fields.forEach(field => {
        initialValues[field.key] = '';
      });
      setValues(initialValues);
    }
  }, [visible, fields]);

  const updateValue = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Check required fields
    const requiredFields = fields.filter(field => field.required);
    const missingRequired = requiredFields.some(field => !values[field.key]?.trim());
    
    if (missingRequired) {
      // You could show an alert here, but for now just return
      return;
    }
    
    onSubmit(values);
    setValues({});
  };

  const handleCancel = () => {
    setValues({});
    onCancel();
  };

  const canSubmit = fields
    .filter(field => field.required)
    .every(field => values[field.key]?.trim());

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.formModalContainer}>
          <Text style={styles.formModalTitle}>{title}</Text>
          
          <ScrollView style={styles.formModalContent} showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field.key} style={styles.formModalField}>
                <Text style={styles.formModalLabel}>
                  {field.label}
                  {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
                </Text>
                <TextInput
                  style={[
                    styles.formModalTextInput,
                    field.multiline && styles.formModalTextInputMultiline
                  ]}
                  value={values[field.key] || ''}
                  onChangeText={(text) => updateValue(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.gray400}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                  keyboardType={field.keyboardType || 'default'}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.formModalButtons}>
            <TouchableOpacity onPress={handleCancel} style={styles.formModalCancelButton}>
              <Text style={styles.formModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[
                styles.formModalSubmitButton,
                !canSubmit && styles.formModalSubmitButtonDisabled
              ]}
              disabled={!canSubmit}
            >
              <Text style={[
                styles.formModalSubmitText,
                !canSubmit && styles.formModalSubmitTextDisabled
              ]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const { medications, diagnoses, profileData, setMedications, setDiagnoses, updateProfileData, isLoaded } = useEndoData();
  const { manuallyPromptRating } = useAppRating();
  
  // Local state that syncs with profileData
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [endoStage, setEndoStage] = useState('');
  const [surgeries, setSurgeries] = useState<string[]>([]);
  const [selectedVitamins, setSelectedVitamins] = useState<string[]>([]);
  
  // Modal states
  const [vitaminModalVisible, setVitaminModalVisible] = useState(false);
  const [tempSelectedVitamins, setTempSelectedVitamins] = useState<string[]>([]);
  const [customVitamin, setCustomVitamin] = useState('');
  
  // Form modal states
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formModalConfig, setFormModalConfig] = useState({
    title: '',
    fields: [],
    onSubmit: (values: { [key: string]: string }) => {},
  });

  // Flag to prevent auto-save during initial sync
  const isInitialSync = useRef(true);

  // Tip jar state
  const [tipProducts, setTipProducts] = useState<Product[]>([]);
  const [isProcessingTip, setIsProcessingTip] = useState<string | null>(null);

  // Sync local state with profileData when it loads - ONLY ONCE
  useEffect(() => {
    if (profileData && isLoaded) {
      console.log('Syncing profile data:', profileData);
      isInitialSync.current = true; // Set flag before updating state
      
      setName(profileData.name || '');
      setAge(profileData.age || '');
      setDiagnosisYear(profileData.diagnosisYear || '');
      setEndoStage(profileData.endoStage || '');
      setSurgeries(profileData.surgeries || []);
      setSelectedVitamins(profileData.selectedVitamins || []);
      
      // Reset flag after a short delay to allow all state updates to complete
      setTimeout(() => {
        isInitialSync.current = false;
      }, 100);
    }
  }, [profileData, isLoaded]); // Only depend on profileData and isLoaded

  // Save changes to profile data - but NOT during initial sync
  const saveProfileChanges = () => {
    if (isInitialSync.current) {
      console.log('Skipping save during initial sync');
      return;
    }
    
    const updatedProfile = {
      name,
      age,
      diagnosisYear,
      endoStage,
      surgeries,
      selectedVitamins
    };
    console.log('Saving profile changes:', updatedProfile);
    updateProfileData(updatedProfile);
  };

  // Auto-save when any field changes - but only after initial sync
  useEffect(() => {
    if (!isInitialSync.current && isLoaded) {
      saveProfileChanges();
    }
  }, [name, age, diagnosisYear, endoStage, surgeries, selectedVitamins, isLoaded]);

  const addMedication = () => {
    setFormModalConfig({
      title: 'Add Prescription Medication',
      fields: [
        { label: 'Medication Name', placeholder: 'Enter medication name...', key: 'name', required: true },
        { label: 'Dosage', placeholder: 'e.g., 10mg, 2 tablets...', key: 'dosage', required: true },
        { label: 'Frequency', placeholder: 'e.g., twice daily, as needed...', key: 'frequency', required: true },
      ],
      onSubmit: (values) => {
        setMedications([...medications, { 
          name: values.name, 
          dosage: values.dosage, 
          frequency: values.frequency 
        }]);
        setFormModalVisible(false);
      },
    });
    setFormModalVisible(true);
  };

  const addDiagnosis = () => {
    setFormModalConfig({
      title: 'Add Other Health Condition',
      fields: [
        { label: 'Condition/Diagnosis', placeholder: 'Enter condition name...', key: 'condition', required: true },
        { label: 'Date Diagnosed', placeholder: 'e.g., 2020, January 2020 (optional)', key: 'date', required: false },
      ],
      onSubmit: (values) => {
        setDiagnoses([...diagnoses, { 
          condition: values.condition, 
          date: values.date || 'Unknown' 
        }]);
        setFormModalVisible(false);
      },
    });
    setFormModalVisible(true);
  };

  const addSurgery = () => {
    setFormModalConfig({
      title: 'Add Surgery/Procedure',
      fields: [
        { 
          label: 'Surgery/Procedure Details', 
          placeholder: 'e.g., Laparoscopy - March 2023', 
          key: 'surgery', 
          required: true, 
          multiline: true 
        },
      ],
      onSubmit: (values) => {
        setSurgeries([...surgeries, values.surgery]);
        setFormModalVisible(false);
      },
    });
    setFormModalVisible(true);
  };

  const openVitaminModal = () => {
    setTempSelectedVitamins([...selectedVitamins]);
    setVitaminModalVisible(true);
  };

  const closeVitaminModal = () => {
    setVitaminModalVisible(false);
    setTempSelectedVitamins([]);
    setCustomVitamin('');
  };

  const applyVitaminSelection = () => {
    let finalSelection = [...tempSelectedVitamins];
    
    // Add custom vitamin if specified
    if (customVitamin.trim()) {
      const customVitaminName = customVitamin.trim();
      if (!finalSelection.includes(customVitaminName)) {
        finalSelection.push(customVitaminName);
      }
    }
    
    setSelectedVitamins(finalSelection);
    setVitaminModalVisible(false);
    setTempSelectedVitamins([]);
    setCustomVitamin('');
  };

  const toggleVitaminInModal = (vitamin: string) => {
    setTempSelectedVitamins(prev => 
      prev.includes(vitamin) 
        ? prev.filter(v => v !== vitamin)
        : [...prev, vitamin]
    );
  };

  const removeVitamin = (vitaminToRemove: string) => {
    setSelectedVitamins(prev => prev.filter(v => v !== vitaminToRemove));
  };

  const removeSurgery = (index: number) => {
    setSurgeries(surgeries.filter((_, i) => i !== index));
  };

  const handleBugReport = () => {
    const subject = encodeURIComponent('EndoCare Bug Report');
    const body = encodeURIComponent(
      'Please describe the bug you encountered:\n\n' +
      'Steps to reproduce:\n1. \n2. \n3. \n\n' +
      'Expected behavior:\n\n' +
      'Actual behavior:\n\n' +
      'Device info:\n' +
      `- Platform: ${Platform.OS}\n` +
      `- App Version: 1.0\n\n` +
      'Additional details:'
    );
    const emailUrl = `mailto:rachael.alexander91@outlook.com?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            'Please send your bug report to rachael.alexander91@outlook.com',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Not Available', 
          'Please send your bug report to rachael.alexander91@outlook.com',
          [{ text: 'OK' }]
        );
      });
  };

  const handleFeatureRequest = () => {
    const subject = encodeURIComponent('EndoCare Feature Request');
    const body = encodeURIComponent(
      'Feature/Improvement Request:\n\n' +
      'Description:\n\n' +
      'Why would this be helpful?\n\n' +
      'How would you like it to work?\n\n' +
      'Additional details:'
    );
    const emailUrl = `mailto:rachael.alexander91@outlook.com?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            'Please send your feature request to rachael.alexander91@outlook.com',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Not Available',
          'Please send your feature request to rachael.alexander91@outlook.com', 
          [{ text: 'OK' }]
        );
      });
  };

  const handleGeneralFeedback = () => {
    const subject = encodeURIComponent('EndoCare General Feedback');
    const body = encodeURIComponent(
      'Your feedback about EndoCare:\n\n' +
      'What do you like most?\n\n' +
      'What could be improved?\n\n' +
      'Overall experience:\n\n' +
      'Additional comments:'
    );
    const emailUrl = `mailto:rachael.alexander91@outlook.com?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            'Please send your feedback to rachael.alexander91@outlook.com',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Not Available',
          'Please send your feedback to rachael.alexander91@outlook.com',
          [{ text: 'OK' }]
        );
      });
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('EndoCare Support Request');
    const body = encodeURIComponent(
      'Support Request:\n\n' +
      'How can we help you?\n\n' +
      'Details:\n\n' +
      'Urgency: Normal / High\n\n' +
      'Additional information:'
    );
    const emailUrl = `mailto:rachael.alexander91@outlook.com?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            'Please contact support at rachael.alexander91@outlook.com',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Not Available',
          'Please contact support at rachael.alexander91@outlook.com',
          [{ text: 'OK' }]
        );
      });
  };

  const handleRateApp = async () => {
    try {
      await manuallyPromptRating();
    } catch (error) {
      Alert.alert(
        'Unable to Rate',
        'We couldn\'t open the rating dialog. You can manually rate EndoCare in the App Store.',
        [{ text: 'OK' }]
      );
    }
  };

  // Tip jar functionality
  useEffect(() => {
    initializeInAppPurchases();
    return () => {
      try {
        if (RNIap.endConnection) {
          RNIap.endConnection();
        }
      } catch (error) {
        console.log('Error ending IAP connection:', error);
      }
    };
  }, []);

  const initializeInAppPurchases = async () => {
    try {
      // Check if running in Expo Go (in-app purchases not supported)
      if (__DEV__ && !RNIap.initConnection) {
        console.log('In-app purchases not available in development/Expo Go');
        return;
      }
      
      const connection = await RNIap.initConnection();
      console.log('IAP connection result:', connection);
      
      // Define your tip product IDs (these need to be configured in App Store Connect)
      const tipProductIds = [
        'tip_199', // $1.99
        'tip_499', // $4.99
        'tip_999', // $9.99
        'tip_1499' // $14.99
      ];
      
      const products = await RNIap.getProducts({ skus: tipProductIds });
      console.log('Retrieved products:', products);
      setTipProducts(products);
    } catch (error) {
      console.log('In-app purchases not available in this environment:', error);
      // Don't throw error - this is expected in Expo Go
    }
  };

  const handleTip = async (productId: string, amount: string) => {
    try {
      setIsProcessingTip(productId);
      
      // Check if in-app purchases are available
      if (__DEV__ && !RNIap.requestPurchase) {
        Alert.alert(
          'Development Mode',
          'In-app purchases are not available in Expo Go. This feature will work in a production build.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const purchase = await RNIap.requestPurchase({ sku: productId });
      
      if (purchase) {
        // Acknowledge the purchase
        await RNIap.finishTransaction({ purchase, isConsumable: true });
        
        Alert.alert(
          '✨ Thank You! ✨',
          `Your ${amount} tip means the world to me! Thank you for supporting EndoCare and helping me continue to improve this app for the endometriosis community. 💜`,
          [{ text: 'You\'re Welcome! 😊' }]
        );
      }
    } catch (error: any) {
      if (error.code === 'E_USER_CANCELLED') {
        // User cancelled, don't show error
        return;
      }
      
      // In development, show a more helpful message
      if (__DEV__) {
        Alert.alert(
          'Development Mode',
          'In-app purchases require a production build. This feature will work when deployed to the App Store.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Tip Failed',
          'There was an issue processing your tip. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      console.log('Tip purchase not available in this environment:', error);
    } finally {
      setIsProcessingTip(null);
    }
  };

  const getTipAmountFromProductId = (productId: string): string => {
    switch (productId) {
      case 'tip_199': return '$1.99';
      case 'tip_499': return '$4.99';
      case 'tip_999': return '$9.99';
      case 'tip_1499': return '$14.99';
      default: return '';
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
        {/* About You */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 About You</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Endometriosis Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🩺 Endometriosis Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Year Diagnosed</Text>
            <TextInput
              style={styles.textInput}
              value={diagnosisYear}
              onChangeText={setDiagnosisYear}
              placeholder="e.g., 2020"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Endometriosis Stage (if known)</Text>
            <TextInput
              style={styles.textInput}
              value={endoStage}
              onChangeText={setEndoStage}
              placeholder="e.g., Stage I, II, III, or IV"
              placeholderTextColor={colors.gray400}
            />
          </View>
          
          {/* Surgeries */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Surgeries/Procedures</Text>
            {surgeries.map((surgery, index) => (
              <View key={index} style={styles.medicationItem}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{surgery}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeSurgery(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addSurgery} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Surgery/Procedure</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prescription Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Prescription Medications</Text>
          {medications.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationDetails}>{med.dosage} - {med.frequency}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMedications(medications.filter((_, i) => i !== index))}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addMedication} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Prescription Medication</Text>
          </TouchableOpacity>
        </View>

        {/* Current Vitamins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Current Vitamins & Supplements</Text>
          {selectedVitamins.map((vitamin, index) => (
            <View key={index} style={styles.medicationItem}>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{vitamin}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeVitamin(vitamin)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={openVitaminModal} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Vitamins & Supplements</Text>
          </TouchableOpacity>
        </View>

        {/* Other Diagnoses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Other Health Conditions</Text>
          {diagnoses.map((diagnosis, index) => (
            <View key={index} style={styles.medicationItem}>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{diagnosis.condition}</Text>
                <Text style={styles.medicationDetails}>Diagnosed: {diagnosis.date}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDiagnoses(diagnoses.filter((_, i) => i !== index))}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addDiagnosis} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Other Condition</Text>
          </TouchableOpacity>
        </View>

        {/* Tip Jar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>☕ Support EndoCare</Text>
          <Text style={styles.supportDescription}>
            EndoCare is completely free with no ads. If you find it helpful, consider leaving a tip to support continued development and new features! 💜
          </Text>
          
          <View style={styles.tipContainer}>
            <TouchableOpacity 
              onPress={() => handleTip('tip_199', '$1.99')}
              style={[styles.tipButton, isProcessingTip === 'tip_199' && styles.tipButtonDisabled]}
              disabled={isProcessingTip === 'tip_199'}
              accessibilityRole="button"
              accessibilityLabel="Tip $1.99"
              accessibilityHint="Leave a small tip to support the app"
            >
              <Text style={styles.tipAmount}>$1.99</Text>
              <Text style={styles.tipLabel}>Tip 💜</Text>
              {isProcessingTip === 'tip_199' && <Text style={styles.processingText}>Processing...</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleTip('tip_499', '$4.99')}
              style={[styles.tipButton, isProcessingTip === 'tip_499' && styles.tipButtonDisabled]}
              disabled={isProcessingTip === 'tip_499'}
              accessibilityRole="button"
              accessibilityLabel="Tip $4.99"
              accessibilityHint="Buy me a coffee to support the app"
            >
              <Text style={styles.tipAmount}>$4.99</Text>
              <Text style={styles.tipLabel}>Coffee ☕</Text>
              {isProcessingTip === 'tip_499' && <Text style={styles.processingText}>Processing...</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleTip('tip_999', '$9.99')}
              style={[styles.tipButton, isProcessingTip === 'tip_999' && styles.tipButtonDisabled]}
              disabled={isProcessingTip === 'tip_999'}
              accessibilityRole="button"
              accessibilityLabel="Tip $9.99"
              accessibilityHint="Buy me lunch to support the app"
            >
              <Text style={styles.tipAmount}>$9.99</Text>
              <Text style={styles.tipLabel}>Lunch 🥗</Text>
              {isProcessingTip === 'tip_999' && <Text style={styles.processingText}>Processing...</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleTip('tip_1499', '$14.99')}
              style={[styles.tipButton, styles.tipButtonPremium, isProcessingTip === 'tip_1499' && styles.tipButtonDisabled]}
              disabled={isProcessingTip === 'tip_1499'}
              accessibilityRole="button"
              accessibilityLabel="Tip $14.99"
              accessibilityHint="Buy me dinner to support the app"
            >
              <Text style={[styles.tipAmount, styles.tipAmountPremium]}>$14.99</Text>
              <Text style={[styles.tipLabel, styles.tipLabelPremium]}>Dinner 🍽️</Text>
              {isProcessingTip === 'tip_1499' && <Text style={styles.processingTextPremium}>Processing...</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.tipDisclaimer}>
            Tips are processed securely through the App Store. Thank you for your support! 🙏
          </Text>
        </View>

        {/* Support & Feedback Section */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>🛠️ Support & Feedback</Text>
          <Text style={styles.supportDescription}>
            Help us improve EndoCare by reporting bugs, requesting features, or sharing feedback.
          </Text>
          
          <TouchableOpacity 
            onPress={handleBugReport}
            style={styles.supportButton}
            accessibilityRole="button"
            accessibilityLabel="Report a bug"
            accessibilityHint="Opens bug report form to help improve the app"
          >
            <Text style={styles.supportButtonIcon}>🐛</Text>
            <View style={styles.supportButtonContent}>
              <Text style={styles.supportButtonTitle}>Report a Bug</Text>
              <Text style={styles.supportButtonSubtitle}>
                Found something that doesn&apos;t work? Let us know!
              </Text>
            </View>
            <Text style={styles.supportButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleFeatureRequest}
            style={styles.supportButton}
            accessibilityRole="button"
            accessibilityLabel="Request a feature"
            accessibilityHint="Suggest new features or improvements"
          >
            <Text style={styles.supportButtonIcon}>💡</Text>
            <View style={styles.supportButtonContent}>
              <Text style={styles.supportButtonTitle}>Request a Feature</Text>
              <Text style={styles.supportButtonSubtitle}>
                Have an idea to make EndoCare better?
              </Text>
            </View>
            <Text style={styles.supportButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleGeneralFeedback}
            style={styles.supportButton}
            accessibilityRole="button"
            accessibilityLabel="Send general feedback"
            accessibilityHint="Share your thoughts about the app"
          >
            <Text style={styles.supportButtonIcon}>💬</Text>
            <View style={styles.supportButtonContent}>
              <Text style={styles.supportButtonTitle}>General Feedback</Text>
              <Text style={styles.supportButtonSubtitle}>
                Share your thoughts and suggestions
              </Text>
            </View>
            <Text style={styles.supportButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleContactSupport}
            style={styles.supportButton}
            accessibilityRole="button"
            accessibilityLabel="Contact support"
            accessibilityHint="Get direct help from the support team"
          >
            <Text style={styles.supportButtonIcon}>📧</Text>
            <View style={styles.supportButtonContent}>
              <Text style={styles.supportButtonTitle}>Contact Support</Text>
              <Text style={styles.supportButtonSubtitle}>
                Need help? Get direct assistance
              </Text>
            </View>
            <Text style={styles.supportButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleRateApp}
            style={[styles.supportButton, { backgroundColor: colors.primaryLight }]}
            accessibilityRole="button"
            accessibilityLabel="Rate the app"
            accessibilityHint="Rate EndoCare in the App Store"
          >
            <Text style={styles.supportButtonIcon}>⭐</Text>
            <View style={styles.supportButtonContent}>
              <Text style={[styles.supportButtonTitle, { color: colors.primary }]}>Rate EndoCare</Text>
              <Text style={[styles.supportButtonSubtitle, { color: colors.primary }]}>
                Love the app? Leave us a review!
              </Text>
            </View>
            <Text style={[styles.supportButtonArrow, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Form Modal */}
      <FormModal
        visible={formModalVisible}
        title={formModalConfig.title}
        fields={formModalConfig.fields}
        onSubmit={formModalConfig.onSubmit}
        onCancel={() => setFormModalVisible(false)}
      />

      {/* Vitamin Selection Modal */}
      <Modal
        visible={vitaminModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeVitaminModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeVitaminModal} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Vitamins & Supplements</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalInstructions}>
              Tap to select the vitamins and supplements you&rsquo;re currently taking:
            </Text>
            <View style={styles.modalVitaminList}>
              {commonVitamins.map((vitamin) => (
                <TouchableOpacity
                  key={vitamin}
                  style={[
                    styles.modalVitaminItem,
                    tempSelectedVitamins.includes(vitamin) && styles.modalVitaminItemSelected
                  ]}
                  onPress={() => toggleVitaminInModal(vitamin)}
                >
                  <Text style={[
                    styles.modalVitaminText,
                    tempSelectedVitamins.includes(vitamin) && styles.modalVitaminTextSelected
                  ]}>
                    {vitamin}
                  </Text>
                  {tempSelectedVitamins.includes(vitamin) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Other Option */}
              <View style={styles.otherVitaminSection}>
                <Text style={styles.otherVitaminTitle}>Other vitamin/supplement:</Text>
                <TextInput
                  style={styles.customVitaminInput}
                  value={customVitamin}
                  onChangeText={setCustomVitamin}
                  placeholder="Enter vitamin or supplement name..."
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={applyVitaminSelection} style={styles.modalDoneButton}>
              <Text style={styles.modalDoneText}>
                Done ({tempSelectedVitamins.length + (customVitamin.trim() ? 1 : 0)} selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  subSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.gray800,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
  },
  medicationDetails: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.red100,
    borderRadius: 6,
  },
  removeButtonText: {
    color: colors.red800,
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Form Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 0,
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    padding: 20,
    paddingBottom: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  formModalContent: {
    maxHeight: 400,
    padding: 20,
  },
  formModalField: {
    marginBottom: 20,
  },
  formModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: colors.red800,
  },
  formModalTextInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.gray800,
    minHeight: 44,
  },
  formModalTextInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  formModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  formModalCancelText: {
    color: colors.gray600,
    fontSize: 16,
    fontWeight: '500',
  },
  formModalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  formModalSubmitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  formModalSubmitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  formModalSubmitTextDisabled: {
    color: colors.gray500,
  },
  // Vitamin Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    color: colors.primary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    textAlign: 'center',
  },
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInstructions: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalVitaminList: {
    gap: 8,
  },
  modalVitaminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalVitaminItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  modalVitaminText: {
    fontSize: 16,
    color: colors.gray700,
  },
  modalVitaminTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  otherVitaminSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  otherVitaminTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  customVitaminInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.gray800,
  },
  supportDescription: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  supportButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  supportButtonContent: {
    flex: 1,
  },
  supportButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 4,
  },
  supportButtonSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 18,
  },
  supportButtonArrow: {
    fontSize: 18,
    color: colors.gray400,
    fontWeight: '500',
  },
  // Tip jar styles
  tipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  tipButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipButtonPremium: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tipButtonDisabled: {
    opacity: 0.6,
  },
  tipAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  tipAmountPremium: {
    color: colors.primary,
  },
  tipLabel: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500',
  },
  tipLabelPremium: {
    color: colors.primary,
  },
  processingText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
    fontStyle: 'italic',
  },
  processingTextPremium: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipDisclaimer: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});