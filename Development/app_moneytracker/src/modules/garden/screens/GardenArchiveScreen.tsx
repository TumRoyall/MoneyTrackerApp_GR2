import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { ArchiveCard } from '@/modules/garden/components/ArchiveCard';
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
      <GardenBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có hoa được lưu</Text>
            <Text style={styles.emptyText}>
              Hãy chăm sóc đều đặn để khu vườn của bạn thêm rực rỡ.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f5f2',
  },
  header: {
    padding: 20,
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 13,
    color: '#6a7279',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  column: {
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyText: {
    fontSize: 13,
    color: '#6a7279',
  },
});
