import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { colors } from '../utils/constants';
import { EndoFact, getRandomEndoFact } from '../utils/endoFacts';

interface EndoFactsBannerProps {
  // No props needed - just displays facts
}

export const EndoFactsBanner: React.FC<EndoFactsBannerProps> = () => {
  const [currentFact, setCurrentFact] = useState<EndoFact>(getRandomEndoFact());
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(true);

  // Load a new random fact on component mount and fade in
  useEffect(() => {
    setCurrentFact(getRandomEndoFact());
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []); // Only run on mount


  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const getCategoryColor = (category: EndoFact['category']) => {
    switch (category) {
      case 'awareness': return '#6366f1'; // Indigo
      case 'symptoms': return '#ef4444'; // Red
      case 'treatment': return '#10b981'; // Green
      case 'statistics': return '#f59e0b'; // Orange
      case 'lifestyle': return '#8b5cf6'; // Purple
      default: return colors.primary;
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View
        style={[
          styles.banner,
          { borderLeftColor: getCategoryColor(currentFact.category) }
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.icon}>{currentFact.icon}</Text>
              <Text style={styles.title}>Endo Fact</Text>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(currentFact.category) }
              ]}>
                <Text style={styles.categoryText}>
                  {currentFact.category.charAt(0).toUpperCase() + currentFact.category.slice(1)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss fact banner"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.factText}>{currentFact.text}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  banner: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginRight: 8,
  },
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: colors.gray500,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  factText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray700,
  },
});