import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

const LUCIDE_TO_EMOJI: Record<string, string> = {
  HelpCircle: '❓',
  UtensilsCrossed: '🍔',
  Cup: '🥤',
  Coffee: '☕',
  Pizza: '🍕',
  Cake: '🍰',
  IceCream: '🍦',
  Apple: '🍎',
  Salad: '🥗',
  ShoppingBag: '🛍️',
  Shirt: '👕',
  Footprints: '👟',
  Watch: '⌚',
  Gem: '💎',
  ShoppingCart: '🛒',
  Store: '🏪',
  Plane: '✈️',
  Hotel: '🏨',
  Tent: '⛺',
  MapPin: '📍',
  Bus: '🚌',
  Umbrella: '⛱️',
  Pill: '💊',
  Stethoscope: '🩺',
  Syringe: '💉',
  Heart: '❤️',
  Eye: '👁️',
  Tooth: '🦷',
  Shield: '🛡️',
  Gamepad2: '🎮',
  Film: '🎬',
  Music: '🎵',
  Mic: '🎤',
  Tv: '📺',
  Clapperboard: '🎬',
  PawPrint: '🐾',
  Dog: '🐶',
  Cat: '🐱',
  Fish: '🐟',
  Bird: '🐦',
  Milk: '🥛',
  Drumstick: '🍗',
  Wheat: '🌾',
  Droplets: '💧',
  Smartphone: '📱',
  Laptop: '💻',
  Tablet: '📱',
  Headphones: '🎧',
  Speaker: '🔊',
  Camera: '📷',
  Sparkles: '✨',
  Lipstick: '💄',
  Palette: '🎨',
  Crown: '👑',
  Scissors: '✂️',
  Flower: '🌸',
  Dumbbell: '🏋️',
  Soccer: '⚽',
  Basketball: '🏀',
  Swimming: '🏊',
  Bike: '🚲',
  GraduationCap: '🎓',
  Book: '📚',
  Award: '🏆',
  Pencil: '✏️',
  Brain: '🧠',
  Car: '🚗',
  Taxi: '🚕',
  Train: '🚆',
  Fuel: '⛽',
  Wrench: '🔧',
  Home: '🏠',
  Key: '🔑',
  Zap: '⚡',
  Flame: '🔥',
  Wifi: '📶',
  Sofa: '🛋️',
  CreditCard: '💳',
  Banknote: '💵',
  PiggyBank: '🐖',
  Landmark: '🏦',
  Coins: '🪙',
  Briefcase: '💼',
  Wallet: '👛',
  TrendingUp: '📈',
  LineChart: '📉',
  Building: '🏢',
  Trophy: '🏆',
  Gift: '🎁',
  Star: '⭐',
  Truck: '🚚'
};

interface CategoryIconProps {
  icon?: string | null;
  color?: string;
  size?: number;
  backgroundStyle?: object;
}

/**
 * Renders a category icon. 
 * First tries to map known Lucide names to an Emoji, 
 * if not found and icon is an emoji, renders the emoji directly.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color = '#29bcc8',
  size = 22,
  backgroundStyle,
}) => {
  const iconStr = icon || 'HelpCircle';
  const mappedEmoji = LUCIDE_TO_EMOJI[iconStr] || (iconStr.length <= 4 ? iconStr : null);

  return (
    <View style={[styles.container, backgroundStyle]}>
      {mappedEmoji ? (
        <Text style={{ fontSize: size }}>{mappedEmoji}</Text>
      ) : (
        // Fallback for icons we couldn't map, just render Lucide HelpCircle
        <LucideIcons.HelpCircle size={size} color={color} />
      )}
    </View>
  );
};

/**
 * Legacy: Get a Lucide icon component by name 
 * (Kept just in case other components import it directly)
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
