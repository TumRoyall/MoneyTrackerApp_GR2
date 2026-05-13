import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { seedCatalog } from '@/modules/garden/assets/seedCatalog';
import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { SeedCarousel } from '@/modules/garden/components/SeedCarousel';
import { useGardenQueries } from '@/modules/garden/state';

export const FlowerSelectionScreen = () => {
  const router = useRouter();
  const { currentQuery, selectSeedMutation } = useGardenQueries();

  const currentSeedId = currentQuery.data?.seed?.seedId ?? seedCatalog[0].seedId;
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(currentSeedId);

  const selectedSeed = useMemo(
    () => seedCatalog.find((seed) => seed.seedId === selectedSeedId) ?? seedCatalog[0],
    [selectedSeedId],
  );

  const handleSelect = async () => {
    if (!selectedSeedId) return;
    await selectSeedMutation.mutateAsync({ seedId: selectedSeedId });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <GardenBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>

        <Text style={styles.title}>Chọn hạt hoa tháng này</Text>
        <Text style={styles.subtitle}>
          Hãy chọn một hạt giống khiến bạn thấy được động viên nhất trong tháng này.
        </Text>

        <SeedCarousel
          seeds={seedCatalog}
          selectedId={selectedSeedId}
          onSelect={(seedId) => setSelectedSeedId(seedId)}
        />

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedSeed.name}</Text>
          <Text style={styles.detailDescription}>{selectedSeed.description}</Text>
          <Text style={styles.detailHint}>
            Khi bạn giữ thói quen tiết kiệm, hoa sẽ nở rạng rỡ hơn.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/garden/archive')}>
            <Text style={styles.secondaryButtonText}>Xem vườn của tôi</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleSelect}>
            <Text style={styles.primaryButtonText}>Chọn hạt này</Text>
          </Pressable>
        </View>

        <View style={styles.selectorRow}>
          {seedCatalog.map((seed) => (
            <Pressable
              key={seed.seedId}
              style={[
                styles.selectorDot,
                seed.seedId === selectedSeedId && styles.selectorDotActive,
              ]}
              onPress={() => setSelectedSeedId(seed.seedId)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f3ee',
  },
  content: {
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f1f1f',
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7279',
    paddingHorizontal: 16,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  detailDescription: {
    fontSize: 13,
    color: '#6a7279',
  },
  detailHint: {
    fontSize: 12,
    color: '#8a939b',
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#58c9d2',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  selectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d7dee5',
  },
  selectorDotActive: {
    backgroundColor: '#58c9d2',
  },
});
