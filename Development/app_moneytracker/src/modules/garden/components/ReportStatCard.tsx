import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

type ReportStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accentColor?: string;
};

export const ReportStatCard = memo(({ label, value, hint, accentColor }: ReportStatCardProps) => {
  return (
    <GlassCard style={styles.card} opacity={0.6} accentColor={accentColor}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accentColor ? { color: accentColor } : undefined]}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#6A7279',
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E35',
  },
  hint: {
    fontSize: 12,
    color: '#92A1A8',
    lineHeight: 16,
  },
});
