/**
 * FlowerRendererV2 — Premium flower visualization with layered petals,
 * organic shapes, shading, quality-based visual tiers, and gentle animation.
 */

import { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { qualityTokensV2 } from '@/modules/garden/assets/flowerTokens';
import { useFloatingAnimation } from '@/modules/garden/components/hooks/useFloatingAnimation';
import { STAGE_CONFIGS, petalPath, leafPath, stemPath } from '@/modules/garden/engine/flowerPaths';
import type { GardenFlowerState } from '@/modules/garden/models/garden.types';

type FlowerRendererV2Props = {
  flower: GardenFlowerState;
  size?: number;
  /** Whether to show ambient glow behind the flower */
  showAmbientGlow?: boolean;
};

const VB = 260; // viewBox size
const CX = VB / 2; // center X
const POT_Y = 190; // pot top Y
const FLOWER_CENTER_Y = 95; // bloom center Y

export const FlowerRendererV2 = memo(({ flower, size = 280, showAmbientGlow = true }: FlowerRendererV2Props) => {
  const palette = qualityTokensV2[flower.quality];
  const stageConfig = STAGE_CONFIGS[flower.stage];
  const { translateY } = useFloatingAnimation(4, 5500);

  // Memoize petal geometry
  const petals = useMemo(() => {
    if (stageConfig.petalCount === 0) return [];

    const result: Array<{ path: string; layer: number; index: number }> = [];
    const layers = stageConfig.petalLayers;

    for (let layer = 0; layer < layers; layer++) {
      const count = layer === 0 ? stageConfig.petalCount : Math.max(4, stageConfig.petalCount - 2);
      const sizeMultiplier = layer === 0 ? 1 : 0.7;
      const offsetAngle = layer === 0 ? 0 : 360 / count / 2;

      for (let i = 0; i < count; i++) {
        const angle = (360 / count) * i + offsetAngle;
        const rx = stageConfig.petalSize.rx * sizeMultiplier;
        const ry = stageConfig.petalSize.ry * sizeMultiplier;
        result.push({
          path: petalPath(CX, FLOWER_CENTER_Y, rx, ry, angle),
          layer,
          index: i,
        });
      }
    }
    return result;
  }, [stageConfig]);

  // Memoize leaf geometry
  const leaves = useMemo(() => {
    if (stageConfig.leafCount === 0) return [];

    const stemBaseY = POT_Y - 10;
    const stemTopY = stemBaseY - stageConfig.stemHeight;
    const result: Array<{ path: string; veinPath: string; side: 'left' | 'right' }> = [];

    for (let i = 0; i < stageConfig.leafCount; i++) {
      const t = 0.3 + (i / stageConfig.leafCount) * 0.5;
      const y = stemBaseY - stageConfig.stemHeight * t;
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
      const angle = side === 'left' ? -35 - i * 5 : 35 + i * 5;
      const curve = side === 'left' ? -3 : 3;

      result.push({
        path: leafPath(CX, y, stageConfig.leafSize.length, stageConfig.leafSize.width, angle, curve),
        veinPath: `M ${CX} ${y} L ${CX + Math.cos((angle * Math.PI) / 180) * stageConfig.leafSize.length * 0.75} ${y + Math.sin((angle * Math.PI) / 180) * stageConfig.leafSize.length * 0.75}`,
        side,
      });
    }
    return result;
  }, [stageConfig]);

  // Stem path
  const stemD = useMemo(() => {
    if (stageConfig.stemHeight === 0) return '';
    const baseY = POT_Y - 10;
    const topY = baseY - stageConfig.stemHeight;
    return stemPath(CX, baseY, topY, 2);
  }, [stageConfig]);

  // Dewdrop positions
  const dewdrops = useMemo(() => {
    if (!stageConfig.showDewdrops) return [];
    return [
      { cx: CX - 14, cy: FLOWER_CENTER_Y + 12, r: 2.5 },
      { cx: CX + 18, cy: FLOWER_CENTER_Y + 8, r: 2 },
      { cx: CX - 8, cy: FLOWER_CENTER_Y - 18, r: 1.8 },
    ];
  }, [stageConfig.showDewdrops]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Defs>
            {/* Petal gradient */}
            <LinearGradient id="petalGrad" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={palette.petalHighlight} stopOpacity="0.95" />
              <Stop offset="0.5" stopColor={palette.petal} stopOpacity="1" />
              <Stop offset="1" stopColor={palette.petalShadow} stopOpacity="0.9" />
            </LinearGradient>

            {/* Inner petal gradient (lighter) */}
            <LinearGradient id="petalInnerGrad" x1="0" y1="0" x2="0.2" y2="1">
              <Stop offset="0" stopColor={palette.petalHighlight} stopOpacity="1" />
              <Stop offset="0.6" stopColor={palette.petal} stopOpacity="0.85" />
              <Stop offset="1" stopColor={palette.petal} stopOpacity="0.7" />
            </LinearGradient>

            {/* Center radial gradient */}
            <RadialGradient id="centerGrad" cx="0.45" cy="0.4" rx="0.55" ry="0.55">
              <Stop offset="0" stopColor={palette.center} stopOpacity="1" />
              <Stop offset="0.6" stopColor={palette.stamen} stopOpacity="0.8" />
              <Stop offset="1" stopColor={palette.stamen} stopOpacity="0.6" />
            </RadialGradient>

            {/* Leaf gradient */}
            <LinearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.leafHighlight} stopOpacity="0.9" />
              <Stop offset="1" stopColor={palette.leaf} stopOpacity="1" />
            </LinearGradient>

            {/* Pot gradient */}
            <LinearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.potRim} stopOpacity="1" />
              <Stop offset="0.3" stopColor={palette.potBody} stopOpacity="1" />
              <Stop offset="1" stopColor={palette.potShadow} stopOpacity="1" />
            </LinearGradient>

            {/* Soil gradient */}
            <LinearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.soilLight} stopOpacity="1" />
              <Stop offset="1" stopColor={palette.soilDark} stopOpacity="1" />
            </LinearGradient>

            {/* Ambient glow */}
            {showAmbientGlow && stageConfig.showGlow && (
              <RadialGradient id="ambientGlow" cx="0.5" cy="0.4" rx="0.5" ry="0.5">
                <Stop offset="0" stopColor={palette.glow} stopOpacity="0.6" />
                <Stop offset="0.5" stopColor={palette.glow} stopOpacity="0.2" />
                <Stop offset="1" stopColor={palette.glow} stopOpacity="0" />
              </RadialGradient>
            )}

            {/* Dewdrop gradient */}
            <RadialGradient id="dewdropGrad" cx="0.3" cy="0.3" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={palette.dewdrop} stopOpacity="0.6" />
              <Stop offset="1" stopColor={palette.dewdrop} stopOpacity="0.2" />
            </RadialGradient>
          </Defs>

          <G transform={`scale(${stageConfig.scale}) translate(${(1 - stageConfig.scale) * CX / stageConfig.scale} ${(1 - stageConfig.scale) * 20 / stageConfig.scale})`}>
            {/* === AMBIENT GLOW === */}
            {showAmbientGlow && stageConfig.showGlow && (
              <Circle
                cx={CX}
                cy={FLOWER_CENTER_Y}
                r={60}
                fill="url(#ambientGlow)"
                opacity={palette.vibrancy * 0.6}
              />
            )}

            {/* === POT === */}
            {/* Pot rim */}
            <Ellipse cx={CX} cy={POT_Y - 5} rx={48} ry={10} fill={palette.potRim} />
            {/* Pot body */}
            <Path
              d={`M ${CX - 44} ${POT_Y} Q ${CX - 38} ${POT_Y + 48} ${CX} ${POT_Y + 50} Q ${CX + 38} ${POT_Y + 48} ${CX + 44} ${POT_Y}`}
              fill="url(#potGrad)"
            />
            {/* Pot rim highlight */}
            <Ellipse cx={CX} cy={POT_Y - 5} rx={42} ry={7} fill={palette.potRim} opacity={0.5} />
            {/* Soil */}
            <Ellipse cx={CX} cy={POT_Y} rx={38} ry={7} fill="url(#soilGrad)" />

            {/* === SEED (stage: Seed) === */}
            {flower.stage === 'Seed' && (
              <G>
                <Ellipse cx={CX} cy={POT_Y - 4} rx={8} ry={6} fill={palette.soilDark} />
                <Ellipse cx={CX} cy={POT_Y - 5} rx={5} ry={3.5} fill={palette.soilLight} opacity={0.6} />
              </G>
            )}

            {/* === STEM === */}
            {stemD ? (
              <Path
                d={stemD}
                stroke={palette.stem}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
            ) : null}

            {/* === LEAVES === */}
            {leaves.map((leaf, i) => (
              <G key={`leaf-${i}`} opacity={0.88}>
                <Path d={leaf.path} fill="url(#leafGrad)" />
                <Path
                  d={leaf.veinPath}
                  stroke={palette.leaf}
                  strokeWidth={0.8}
                  strokeOpacity={0.4}
                  fill="none"
                />
              </G>
            ))}

            {/* === PETALS (outer layer first for proper overlap) === */}
            {petals
              .sort((a, b) => a.layer - b.layer)
              .map((petal, i) => (
                <Path
                  key={`petal-${i}`}
                  d={petal.path}
                  fill={petal.layer === 0 ? 'url(#petalGrad)' : 'url(#petalInnerGrad)'}
                  opacity={petal.layer === 0 ? 0.92 : 0.75}
                />
              ))}

            {/* === FLOWER CENTER === */}
            {stageConfig.showCenter && (
              <G>
                <Circle cx={CX} cy={FLOWER_CENTER_Y} r={stageConfig.centerRadius} fill="url(#centerGrad)" />
                {/* Stamen dots */}
                {[0, 60, 120, 180, 240, 300].map((angle) => {
                  const r = stageConfig.centerRadius * 0.6;
                  const x = CX + Math.cos((angle * Math.PI) / 180) * r;
                  const y = FLOWER_CENTER_Y + Math.sin((angle * Math.PI) / 180) * r;
                  return (
                    <Circle
                      key={`stamen-${angle}`}
                      cx={x}
                      cy={y}
                      r={1.2}
                      fill={palette.stamen}
                      opacity={0.6}
                    />
                  );
                })}
              </G>
            )}

            {/* === DEWDROPS === */}
            {dewdrops.map((drop, i) => (
              <Circle
                key={`dew-${i}`}
                cx={drop.cx}
                cy={drop.cy}
                r={drop.r}
                fill="url(#dewdropGrad)"
              />
            ))}

            {/* === QUALITY SPARKLES (excellent only) === */}
            {flower.quality === 'excellent' && (
              <G opacity={0.55}>
                <Circle cx={CX - 35} cy={FLOWER_CENTER_Y - 25} r={3} fill={palette.glow} />
                <Circle cx={CX + 40} cy={FLOWER_CENTER_Y - 20} r={2.5} fill={palette.glow} />
                <Circle cx={CX + 30} cy={FLOWER_CENTER_Y + 30} r={2} fill={palette.glow} />
                <Circle cx={CX - 25} cy={FLOWER_CENTER_Y + 20} r={2.5} fill={palette.glow} />
                <Circle cx={CX + 5} cy={FLOWER_CENTER_Y - 40} r={2} fill={palette.glow} />
              </G>
            )}

            {/* === GOOD QUALITY SOFT HALO === */}
            {(flower.quality === 'good' || flower.quality === 'excellent') && (
              <Circle
                cx={CX}
                cy={FLOWER_CENTER_Y}
                r={45}
                fill="none"
                stroke={palette.glow}
                strokeWidth={0.8}
                opacity={0.25}
              />
            )}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
