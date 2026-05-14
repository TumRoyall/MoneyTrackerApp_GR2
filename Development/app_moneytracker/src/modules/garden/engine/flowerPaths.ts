/**
 * flowerPaths — SVG path data for organic flower shapes.
 * Provides petal, leaf, stem, and pot path generators for each growth stage.
 */

import type { GardenStage } from '@/modules/garden/models/garden.types';

/**
 * Generate petal SVG path (teardrop/oval shape).
 * cx, cy = center; rx, ry = radii; rotation = degrees.
 */
export const petalPath = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
): string => {
  // Create an organic petal shape using cubic bezier curves
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const transform = (x: number, y: number) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos,
  });

  const tip = transform(0, -ry);
  const right = transform(rx * 0.8, -ry * 0.3);
  const base = transform(0, ry * 0.2);
  const left = transform(-rx * 0.8, -ry * 0.3);

  const cp1r = transform(rx * 0.6, -ry * 0.85);
  const cp2r = transform(rx * 0.9, ry * 0.05);
  const cp3r = transform(rx * 0.3, ry * 0.2);
  const cp1l = transform(-rx * 0.6, -ry * 0.85);
  const cp2l = transform(-rx * 0.9, ry * 0.05);
  const cp3l = transform(-rx * 0.3, ry * 0.2);

  return [
    `M ${tip.x} ${tip.y}`,
    `C ${cp1r.x} ${cp1r.y}, ${cp2r.x} ${cp2r.y}, ${right.x} ${right.y}`,
    `C ${cp2r.x} ${cp2r.y + ry * 0.15}, ${cp3r.x} ${cp3r.y}, ${base.x} ${base.y}`,
    `C ${cp3l.x} ${cp3l.y}, ${cp2l.x} ${cp2l.y + ry * 0.15}, ${left.x} ${left.y}`,
    `C ${cp2l.x} ${cp2l.y}, ${cp1l.x} ${cp1l.y}, ${tip.x} ${tip.y}`,
    'Z',
  ].join(' ');
};

/**
 * Generate leaf SVG path (elongated with pointed tip and slight curve).
 */
export const leafPath = (
  startX: number,
  startY: number,
  length: number,
  width: number,
  angle: number,
  curve: number,
): string => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const tipX = startX + length * cos;
  const tipY = startY + length * sin;
  const midX = startX + length * 0.5 * cos;
  const midY = startY + length * 0.5 * sin;

  const perpX = -sin;
  const perpY = cos;

  const cp1X = midX + perpX * width + curve * cos;
  const cp1Y = midY + perpY * width + curve * sin;
  const cp2X = midX - perpX * width + curve * cos;
  const cp2Y = midY - perpY * width + curve * sin;

  return [
    `M ${startX} ${startY}`,
    `Q ${cp1X} ${cp1Y}, ${tipX} ${tipY}`,
    `Q ${cp2X} ${cp2Y}, ${startX} ${startY}`,
    'Z',
  ].join(' ');
};

/**
 * Leaf vein path — simple line from base toward tip.
 */
export const leafVeinPath = (
  startX: number,
  startY: number,
  length: number,
  angle: number,
): string => {
  const rad = (angle * Math.PI) / 180;
  const endX = startX + length * 0.85 * Math.cos(rad);
  const endY = startY + length * 0.85 * Math.sin(rad);
  return `M ${startX} ${startY} L ${endX} ${endY}`;
};

/**
 * Organic stem path — slightly curved vertical line with thickness.
 */
export const stemPath = (
  baseX: number,
  baseY: number,
  topY: number,
  curvature: number,
): string => {
  const midY = (baseY + topY) / 2;
  return [
    `M ${baseX} ${baseY}`,
    `Q ${baseX + curvature} ${midY}, ${baseX} ${topY}`,
  ].join(' ');
};

/** Stage-specific configuration for the flower */
export interface StageConfig {
  /** Overall scale multiplier */
  scale: number;
  /** Number of petals to render */
  petalCount: number;
  /** Petal size (rx, ry) */
  petalSize: { rx: number; ry: number };
  /** Whether to show bloom center */
  showCenter: boolean;
  /** Center radius */
  centerRadius: number;
  /** Stem height (relative to viewBox) */
  stemHeight: number;
  /** Number of leaves */
  leafCount: number;
  /** Leaf size (length, width) */
  leafSize: { length: number; width: number };
  /** Whether to show glow effects */
  showGlow: boolean;
  /** Whether to show dewdrops */
  showDewdrops: boolean;
  /** Petal layer count (1 = single ring, 2 = inner+outer) */
  petalLayers: number;
  /** Description label */
  label: string;
}

export const STAGE_CONFIGS: Record<GardenStage, StageConfig> = {
  Seed: {
    scale: 0.4,
    petalCount: 0,
    petalSize: { rx: 0, ry: 0 },
    showCenter: false,
    centerRadius: 8,
    stemHeight: 0,
    leafCount: 0,
    leafSize: { length: 0, width: 0 },
    showGlow: false,
    showDewdrops: false,
    petalLayers: 0,
    label: 'Hạt giống',
  },
  Sprout: {
    scale: 0.55,
    petalCount: 0,
    petalSize: { rx: 0, ry: 0 },
    showCenter: false,
    centerRadius: 0,
    stemHeight: 30,
    leafCount: 2,
    leafSize: { length: 18, width: 7 },
    showGlow: false,
    showDewdrops: false,
    petalLayers: 0,
    label: 'Mầm non',
  },
  YoungPlant: {
    scale: 0.65,
    petalCount: 0,
    petalSize: { rx: 0, ry: 0 },
    showCenter: false,
    centerRadius: 0,
    stemHeight: 50,
    leafCount: 4,
    leafSize: { length: 24, width: 9 },
    showGlow: false,
    showDewdrops: false,
    petalLayers: 0,
    label: 'Cây non',
  },
  GrowingPlant: {
    scale: 0.8,
    petalCount: 4,
    petalSize: { rx: 10, ry: 14 },
    showCenter: true,
    centerRadius: 6,
    stemHeight: 60,
    leafCount: 4,
    leafSize: { length: 28, width: 10 },
    showGlow: false,
    showDewdrops: false,
    petalLayers: 1,
    label: 'Cây lớn',
  },
  Budding: {
    scale: 0.92,
    petalCount: 6,
    petalSize: { rx: 14, ry: 20 },
    showCenter: true,
    centerRadius: 9,
    stemHeight: 65,
    leafCount: 4,
    leafSize: { length: 30, width: 11 },
    showGlow: false,
    showDewdrops: true,
    petalLayers: 1,
    label: 'Nụ hoa',
  },
  Blooming: {
    scale: 1.0,
    petalCount: 8,
    petalSize: { rx: 18, ry: 26 },
    showCenter: true,
    centerRadius: 12,
    stemHeight: 70,
    leafCount: 5,
    leafSize: { length: 34, width: 12 },
    showGlow: true,
    showDewdrops: true,
    petalLayers: 2,
    label: 'Nở hoa',
  },
};
