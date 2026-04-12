import { View, Text } from 'react-native';

export default function WalletsScreen() {
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Wallets</Text>
      <Text>Module wallet sẽ gọi repository thay vì gọi API trực tiếp trong UI.</Text>
    </View>
  );
}
