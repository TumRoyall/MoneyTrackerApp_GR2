import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ReportStatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export const ReportStatCard = memo(({ label, value, hint }: ReportStatCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: '#6a7279',
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  hint: {
    fontSize: 12,
    color: '#92a1a8',
  },
});
