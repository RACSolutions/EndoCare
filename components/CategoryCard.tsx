import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../utils/constants';

interface CategoryCardProps {
  categoryKey: string;
  icon: string;
  name: string;
  isActive: boolean;
  count?: number;
  onPress: () => void;
  onClear?: () => void;
}

export const CategoryCard = React.memo<CategoryCardProps>(({
  categoryKey,
  icon,
  name,
  isActive,
  count,
  onPress,
  onClear,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.categoryCard,
        isActive && styles.categoryCardActive
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name} category${isActive ? ', active' : ''}`}
      accessibilityHint={`Tap to ${isActive ? 'edit' : 'add'} ${name.toLowerCase()} symptoms`}
    >
      {isActive && count !== undefined && count > 0 && (
        <>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
          {onClear && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={[
        styles.categoryName,
        isActive && styles.categoryNameActive
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
});

CategoryCard.displayName = 'CategoryCard';

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    position: 'relative',
  },
  categoryCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.red100,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    color: colors.red800,
    fontSize: 12,
    fontWeight: 'bold',
  },
});