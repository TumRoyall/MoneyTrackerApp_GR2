import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { ArchiveCard } from '@/modules/garden/components/ArchiveCard';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { useGardenQueries } from '@/modules/garden/state';

const PAGE_SIZE = 6;

export const GardenArchiveScreen = () => {
  const router = useRouter();
  const { historyQuery, currentQuery } = useGardenQueries();
  const history = historyQuery.data ?? [];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleItems = useMemo(() => history.slice(0, visibleCount), [history, visibleCount]);

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A2E35" />
        </Pressable>
        <Text style={styles.title}>Vườn của tôi</Text>
        <Text style={styles.subtitle}>Mỗi tháng là một khuôn mặt hoa khác nhau.</Text>
      </View>
      <FlatList
        data={visibleItems}
        numColumns={2}
        keyExtractor={(item) => `${item.year}-${item.month}`}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setVisibleCount((prev) => Math.min(history.length, prev + PAGE_SIZE))}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => <ArchiveCard item={item} />}
        ListEmptyComponent={
          <GlassCard opacity={0.6}>
            <Text style={styles.emptyTitle}>Chưa có hoa được lưu</Text>
            <Text style={styles.emptyText}>Hãy chăm sóc đều đặn để khu vườn thêm rực rỡ.</Text>
          </GlassCard>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F0E8' },
  header: { padding: 20, gap: 4 },
  backButton: {
    alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2A2E35' },
  subtitle: { fontSize: 13, color: '#5A6068' },
  list: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  column: { gap: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#2A2E35' },
  emptyText: { fontSize: 13, color: '#5A6068', marginTop: 4 },
});
