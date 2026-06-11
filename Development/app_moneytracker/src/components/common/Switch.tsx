import { Switch as RNSwitch } from 'react-native';
import { colors } from './theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Switch = ({ value, onValueChange, disabled }: SwitchProps) => (
  <RNSwitch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#d4dde3', true: colors.accent }}
    thumbColor={value ? '#ffffff' : '#f1f5f8'}
  />
);