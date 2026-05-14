import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { seedCatalog } from '@/modules/garden/assets/seedCatalog';
import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { SeedCarousel } from '@/modules/garden/components/SeedCarousel';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { useGardenQueries } from '@/modules/garden/state';

export const FlowerSelectionScreen = () => {
  const router = useRouter();
  const { currentQuery, selectSeedMutation } = useGardenQueries();
  const currentSeedId = currentQuery.data?.seed?.seedId ?? seedCatalog[0].seedId;
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(currentSeedId);

  const selectedSeed = useMemo(
    () => seedCatalog.find((s) => s.seedId === selectedSeedId) ?? seedCatalog[0],
    [selectedSeedId],
  );

  const handleSelect = async () => {
    if (!selectedSeedId) return;
    await selectSeedMutation.mutateAsync({ seedId: selectedSeedId });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A2E35" />
        </Pressable>
        <Text style={styles.title}>Chọn hạt hoa tháng này</Text>
        <Text style={styles.subtitle}>
          Hãy chọn một hạt giống khiến bạn thấy được động viên nhất.
        </Text>
        <SeedCarousel
          seeds={seedCatalog}
          selectedId={selectedSeedId}
          onSelect={(seedId) => setSelectedSeedId(seedId)}
        />
        <GlassCard opacity={0.6}>
          <Text style={styles.detailTitle}>{selectedSeed.name}</Text>
          <Text style={styles.detailDesc}>{selectedSeed.description}</Text>
          <Text style={styles.detailHint}>
            Khi bạn giữ thói quen tiết kiệm, hoa sẽ nở rạng rỡ hơn.
          </Text>
        </GlassCard>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/garden/archive')}>
            <Text style={styles.secondaryText}>Xem vườn của tôi</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleSelect}>
            <Text style={styles.primaryText}>🌱 Chọn hạt này</Text>
          </Pressable>
        </View>
        <View style={styles.selectorRow}>
          {seedCatalog.map((seed) => (
            <Pressable
              key={seed.seedId}
              style={[styles.dot, seed.seedId === selectedSeedId && styles.dotActive]}
              onPress={() => setSelectedSeedId(seed.seedId)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F0E8' },
  content: { paddingTop: 18, paddingBottom: 36, gap: 18 },
  backButton: {
    alignSelf: 'flex-start', marginLeft: 16, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2A2E35', paddingHorizontal: 16 },
  subtitle: { fontSize: 14, color: '#5A6068', paddingHorizontal: 16 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#2A2E35' },
  detailDesc: { fontSize: 13, color: '#5A6068', marginTop: 4, lineHeight: 19 },
  detailHint: { fontSize: 12, color: '#8A939B', marginTop: 4 },
  actions: { paddingHorizontal: 16, gap: 12 },
  primaryButton: {
    backgroundColor: 'rgba(90,188,180,0.85)', paddingVertical: 15, borderRadius: 20,
    alignItems: 'center', shadowColor: '#5ABCB4', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.65)', paddingVertical: 15, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  secondaryText: { fontSize: 15, fontWeight: '700', color: '#2A2E35' },
  selectorRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(200,210,220,0.5)' },
  dotActive: { backgroundColor: '#5ABCB4', width: 20 },
});
