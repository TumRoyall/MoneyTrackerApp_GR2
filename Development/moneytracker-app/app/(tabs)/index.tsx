import { colors } from "@/constants/colors";
import { ScrollView, StyleSheet, View } from "react-native";

import { AccountSection } from "@/components/home/AccountSection";
import { FloatingAddButton } from "@/components/home/FloatingAddButton";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NetSummary } from "@/components/home/NetSummary";
import { TopSpendingCategories } from "@/components/home/TopSpendingCategories";

export default function Home() {
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <HomeHeader />

        {/* Quick Stats Section */}
        <View style={styles.section}>
          <NetSummary />
        </View>

        {/* Accounts Section - Compact */}
        <View style={styles.section}>
          <AccountSection />
        </View>

        {/* Top Spending Categories */}
        <View style={styles.section}>
          <TopSpendingCategories />
        </View>
      </ScrollView>

      <FloatingAddButton />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 12,
  },
});
