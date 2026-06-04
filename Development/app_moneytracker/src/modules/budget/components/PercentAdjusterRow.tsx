import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PercentAdjuster } from './PercentAdjuster';

export interface PercentAdjusterRowProps {
  categoryIcon?: string;
  categoryName: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
  disabled?: boolean;
  onChange: (next: number) => void;
}

export function PercentAdjusterRow({
  categoryIcon,
  categoryName,
  percent,
  amount,
  aiReasoning,
  disabled = false,
  onChange,
}: PercentAdjusterRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.nameGroup}>
          {categoryIcon ? (
            <MaterialCommunityIcons
              name={categoryIcon as any}
              size={20}
              color="#179ea9"
            />
          ) : null}
          <Text style={styles.name}>{categoryName}</Text>
          {disabled ? <Text style={styles.autoBadge}>🔒 auto</Text> : null}
        </View>
      </View>

      <PercentAdjuster
        percent={percent}
        amount={amount}
        onChange={onChange}
        disabled={disabled}
      />

      {aiReasoning ? (
        <Text style={styles.reasoning} numberOfLines={2}>
          💡 {aiReasoning}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6ecef',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  autoBadge: {
    fontSize: 11,
    color: '#7b868d',
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 12,
    color: '#5d6972',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
