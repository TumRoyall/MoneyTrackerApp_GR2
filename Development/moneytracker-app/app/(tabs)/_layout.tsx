import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: 72,
          paddingBottom: 12,
          paddingTop: 12,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Trang chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Giao dịch */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Giao dịch",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "swap-horizontal" : "swap-horizontal-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Budget */}
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Công cụ */}
      <Tabs.Screen
        name="tools"
        options={{
          title: "Công cụ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Cài đặt */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cài đặt",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
