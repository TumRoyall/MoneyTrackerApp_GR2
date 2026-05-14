import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { GardenMonthlyReport } from '@/modules/garden/models/garden.types';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

const stageLabel: Record<GardenMonthlyReport['replay'][number]['stage'], string> = {
  Seed: '🌱 Hạt',
  Sprout: '🌿 Mầm',
  YoungPlant: '🪴 Cây non',
  GrowingPlant: '🌳 Cây lớn',
  Budding: '🌸 Nụ',
  Blooming: '🌺 Nở hoa',
};

const stageColor: Record<GardenMonthlyReport['replay'][number]['stage'], string> = {
  Seed: '#B8A080',
  Sprout: '#8BC490',
  YoungPlant: '#6AAE70',
  GrowingPlant: '#5AA384',
  Budding: '#F0A0B8',
  Blooming: '#F7A5C4',
};

export const GrowthTimeline = memo(({ replay }: { replay: GardenMonthlyReport['replay'] }) => {
  return (
    <GlassCard opacity={0.55}>
      <View style={styles.container}>
        {replay.map((item, index) => {
          const color = stageColor[item.stage];
          const isLast = index === replay.length - 1;

          return (
            <View key={`${item.stage}-${index}`} style={styles.row}>
              <View style={styles.dotColumn}>
                <View style={styles.dotWrap}>
                  <Svg width={16} height={16} viewBox="0 0 16 16">
                    <Circle cx="8" cy="8" r="7" fill={`${color}30`} />
                    <Circle cx="8" cy="8" r="4.5" fill={color} />
                    <Circle cx="7" cy="7" r="1.5" fill="#FFFFFF" opacity={0.4} />
                  </Svg>
                </View>
                {!isLast && (
                  <View style={styles.lineWrap}>
                    <Svg width={2} height={24}>
                      <Line
                        x1="1" y1="0" x2="1" y2="24"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.3}
                        strokeDasharray="3,3"
                      />
                    </Svg>
                  </View>
                )}
              </View>
              <View style={styles.textColumn}>
                <Text style={[styles.stage, { color }]}>{stageLabel[item.stage]}</Text>
                <Text style={styles.day}>Ngày {item.day}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dotColumn: {
    alignItems: 'center',
    width: 16,
  },
  dotWrap: {
    width: 16,
    height: 16,
  },
  lineWrap: {
    height: 24,
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    paddingBottom: 16,
  },
  stage: {
    fontSize: 14,
    fontWeight: '700',
  },
  day: {
    fontSize: 12,
    color: '#6A7279',
    marginTop: 2,
  },
});
