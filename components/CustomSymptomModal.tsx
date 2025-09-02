import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../utils/constants';

interface CustomSymptomModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSymptom: (category: string, symptom: string) => void;
  categories: { [key: string]: { name: string; icon: string } };
}

export const CustomSymptomModal: React.FC<CustomSymptomModalProps> = ({
  visible,
  onClose,
  onAddSymptom,
  categories
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [symptomName, setSymptomName] = useState('');

  const handleSubmit = () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category for your custom symptom.');
      return;
    }
    
    if (!symptomName.trim()) {
      Alert.alert('Enter Symptom', 'Please enter a name for your custom symptom.');
      return;
    }

    const trimmedSymptom = symptomName.trim();
    
    // Check if symptom name is reasonable
    if (trimmedSymptom.length > 50) {
      Alert.alert('Name Too Long', 'Symptom name should be 50 characters or less.');
      return;
    }

    onAddSymptom(selectedCategory, trimmedSymptom);
    
    // Reset form
    setSelectedCategory('');
    setSymptomName('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedCategory('');
    setSymptomName('');
    onClose();
  };

  const canSubmit = selectedCategory && symptomName.trim();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Custom Symptom</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(categories).map(([key, category]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    selectedCategory === key && styles.categoryButtonSelected
                  ]}
                  onPress={() => setSelectedCategory(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${category.name} category`}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === key && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Symptom Name</Text>
            <TextInput
              style={styles.textInput}
              value={symptomName}
              onChangeText={setSymptomName}
              placeholder="Enter symptom name (e.g., Sharp pain, Tingling)"
              placeholderTextColor={colors.gray400}
              maxLength={50}
              autoCapitalize="words"
              accessibilityLabel="Symptom name input"
            />
            <Text style={styles.characterCount}>
              {symptomName.length}/50 characters
            </Text>

            {selectedCategory && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Preview:</Text>
                <View style={styles.previewSymptom}>
                  <Text style={styles.previewIcon}>
                    {categories[selectedCategory]?.icon}
                  </Text>
                  <Text style={styles.previewText}>
                    {symptomName.trim() || 'Your symptom name'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              onPress={handleCancel} 
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled
              ]}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Add custom symptom"
            >
              <Text style={[
                styles.submitButtonText,
                !canSubmit && styles.submitButtonTextDisabled
              ]}>
                Add Symptom
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray800,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryButton: {
    flexBasis: '48%',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.gray800,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'right',
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  previewSymptom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
  },
  previewIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  previewText: {
    fontSize: 16,
    color: colors.gray800,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.gray600,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: colors.gray500,
  },
});