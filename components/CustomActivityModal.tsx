import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../utils/constants';

interface CustomActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onAddActivity: (activity: string) => void;
}

export const CustomActivityModal: React.FC<CustomActivityModalProps> = ({
  visible,
  onClose,
  onAddActivity
}) => {
  const [activityName, setActivityName] = useState('');

  const handleSubmit = () => {
    if (!activityName.trim()) {
      Alert.alert('Enter Activity', 'Please enter a name for your custom activity or trigger.');
      return;
    }

    const trimmedActivity = activityName.trim();
    
    // Check if activity name is reasonable
    if (trimmedActivity.length > 30) {
      Alert.alert('Name Too Long', 'Activity name should be 30 characters or less.');
      return;
    }

    onAddActivity(trimmedActivity);
    
    // Reset form
    setActivityName('');
    onClose();
  };

  const handleCancel = () => {
    setActivityName('');
    onClose();
  };

  const canSubmit = activityName.trim();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Custom Activity/Trigger</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Add a custom activity or trigger to track how it affects your symptoms.
            </Text>
            
            <Text style={styles.examples}>
              Examples: &ldquo;Yoga class&rdquo;, &ldquo;Long car ride&rdquo;, &ldquo;Stressful meeting&rdquo;, &ldquo;Cold weather&rdquo;
            </Text>

            <Text style={styles.inputLabel}>Activity/Trigger Name</Text>
            <TextInput
              style={styles.textInput}
              value={activityName}
              onChangeText={setActivityName}
              placeholder="Enter activity or trigger name"
              placeholderTextColor={colors.gray400}
              maxLength={30}
              autoCapitalize="words"
              accessibilityLabel="Activity name input"
            />
            <Text style={styles.characterCount}>
              {activityName.length}/30 characters
            </Text>

            {activityName.trim() && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Preview:</Text>
                <View style={styles.previewActivity}>
                  <Text style={styles.previewIcon}>🔍</Text>
                  <Text style={styles.previewText}>
                    {activityName.trim()}
                  </Text>
                </View>
              </View>
            )}
          </View>

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
              accessibilityLabel="Add custom activity"
            >
              <Text style={[
                styles.submitButtonText,
                !canSubmit && styles.submitButtonTextDisabled
              ]}>
                Add Activity
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
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  examples: {
    fontSize: 12,
    color: colors.gray500,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
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
  previewActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
  },
  previewIcon: {
    fontSize: 16,
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