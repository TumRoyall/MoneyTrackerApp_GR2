import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

interface CategoryIconProps {
  icon?: string | null;
  color?: string;
  size?: number;
  backgroundStyle?: object;
}

/**
 * Renders a category icon using LucideIcons.
 * Falls back to HelpCircle if icon name is not found.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color = '#29bcc8',
  size = 22,
  backgroundStyle,
}) => {
  // Convert PascalCase to camelCase for LucideIcons
  // e.g., "ShoppingBag" -> "ShoppingBag" (Lucide uses PascalCase)
  const iconName = (icon && (LucideIcons as any)[icon])
    ? icon
    : 'HelpCircle';

  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;

  return (
    <View style={[styles.container, backgroundStyle]}>
      <IconComponent name={iconName} size={size} color={color} />
    </View>
  );
};

/**
 * Get a Lucide icon component by name
 */
export const getLucideIcon = (iconName?: string | null): React.FC<{ name?: string; size?: number; color?: string }> => {
  if (iconName && (LucideIcons as any)[iconName]) {
    return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  }
  return LucideIcons.HelpCircle;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
