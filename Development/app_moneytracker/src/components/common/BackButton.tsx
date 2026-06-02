import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  to?: string; // Optional route, defaults to back()
}

export const BackButton = ({ to }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => (to ? router.replace(to as any) : router.back())}
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});