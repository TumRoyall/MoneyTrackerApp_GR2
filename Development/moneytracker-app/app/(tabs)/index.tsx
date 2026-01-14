import { colors } from "@/constants/colors";
import { ScrollView, StyleSheet } from "react-native";

import { AccountSection } from "@/components/home/AccountSection";
import { FloatingAddButton } from "@/components/home/FloatingAddButton";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NetSummary } from "@/components/home/NetSummary";
import { TimeFilter } from "@/components/home/TimeFilter";

export default function Home() {
  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <HomeHeader />

        <AccountSection />

        <NetSummary />

        <TimeFilter />

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
    padding: 16,
    paddingBottom: 120,
  },
});
