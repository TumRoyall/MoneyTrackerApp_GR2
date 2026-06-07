import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatVndAmount } from '@/shared/utils/money';

export interface PercentAdjusterProps {
  percent: number;
  amount: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

const STEP = 5;
const MIN = 0;
const MAX = 100;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const sanitizePercentInput = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  return clamp(parseInt(cleaned, 10), MIN, MAX);
};

export function PercentAdjuster({ percent, amount, onChange, disabled = false }: PercentAdjusterProps) {
  const handleMinus = () => {
    if (disabled) return;
    onChange(clamp(percent - STEP, MIN, MAX));
  };

  const handlePlus = () => {
    if (disabled) return;
    onChange(clamp(percent + STEP, MIN, MAX));
  };

  const handleChangeText = (raw: string) => {
    if (disabled) return;
    onChange(sanitizePercentInput(raw));
  };

  return (
    <View style={styles.row} testID="percent-adjuster">
      <View style={styles.adjustGroup}>
        <Pressable
          testID="minus-button"
          onPress={handleMinus}
          disabled={disabled}
          style={[styles.button, disabled ? styles.buttonDisabled : null]}
          accessibilityLabel="Giảm 5%"
        >
          <Ionicons name="remove" size={18} color={disabled ? '#aab2b8' : '#1f1f1f'} />
        </Pressable>

        <TextInput
          testID="percent-input"
          value={String(percent)}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          editable={!disabled}
          style={[styles.input, disabled ? styles.inputDisabled : null]}
          maxLength={3}
          accessibilityLabel="Phần trăm ngân sách"
        />

        <Text style={styles.percentSuffix}>%</Text>

        <Pressable
          testID="plus-button"
          onPress={handlePlus}
          disabled={disabled}
          style={[styles.button, disabled ? styles.buttonDisabled : null]}
          accessibilityLabel="Tăng 5%"
        >
          <Ionicons name="add" size={18} color={disabled ? '#aab2b8' : '#1f1f1f'} />
        </Pressable>
      </View>

      <Text testID="amount-display" style={styles.amount}>
        = {formatVndAmount(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
  },
  adjustGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f5f7f9',
  },
  input: {
    minWidth: 80,
    width: 80,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f1f1f',
  },
  inputDisabled: {
    backgroundColor: '#f5f7f9',
    color: '#aab2b8',
  },
  percentSuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5d6972',
  },
  amount: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#3a464e',
  },
});
