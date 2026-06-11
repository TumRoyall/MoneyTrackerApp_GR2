import { StyleSheet, Text, View } from 'react-native';

interface AuthMessageProps {
  message: string;
  variant?: 'info' | 'success' | 'error';
}

export const AuthMessage = ({ message, variant = 'info' }: AuthMessageProps) => {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 12,
    borderRadius: 10,
  },
  info: {
    backgroundColor: '#eef2ff',
  },
  success: {
    backgroundColor: '#e8f7ee',
  },
  error: {
    backgroundColor: '#fde8e8',
  },
  text: {
    color: '#111',
    fontSize: 14,
  },
});
