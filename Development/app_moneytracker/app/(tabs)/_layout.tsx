import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Coins } from 'lucide-react-native';
import { Platform } from 'react-native';

// Kiểm tra nếu có thanh navigation ở dưới (Android có thanh 3 nút)
// Thêm padding để tránh trùng với thanh hệ thống
const BOTTOM_SAFE_AREA = Platform.OS === 'android' ? 24 : 0;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#58c9d2',
        tabBarInactiveTintColor: '#7a7a7a',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 72 + BOTTOM_SAFE_AREA,
          paddingTop: 6,
          paddingBottom: BOTTOM_SAFE_AREA,
        },
      }}
    >
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Công cụ tiền tệ',
          tabBarIcon: ({ color, size }) => (
            <Coins size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
