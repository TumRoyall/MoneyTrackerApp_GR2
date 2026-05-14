import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenTask } from '@/modules/garden/models/garden.types';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

type GardenTaskCardProps = {
  task: GardenTask;
  onComplete?: (taskId: string) => void;
  showAction?: boolean;
};

export const GardenTaskCard = memo(({ task, onComplete, showAction = true }: GardenTaskCardProps) => {
  return (
    <GlassCard
      opacity={task.completed ? 0.5 : 0.6}
      style={styles.cardOverride}
    >
      <View style={styles.content}>
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            {task.completed && <View style={styles.checkmark} />}
            <Text style={[styles.title, task.completed && styles.titleCompleted]}>
              {task.title}
            </Text>
          </View>
          <Text style={styles.description}>{task.description}</Text>
          <Text style={styles.xp}>+{task.xp} XP</Text>
        </View>
        {showAction ? (
          <Pressable
            style={[styles.button, task.completed && styles.buttonCompleted]}
            disabled={task.completed}
            onPress={() => onComplete?.(task.taskId)}
          >
            <Text style={[styles.buttonLabel, task.completed && styles.buttonLabelCompleted]}>
              {task.completed ? '✓ Xong' : 'Hoàn thành'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  cardOverride: {
    padding: 14,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6DD4A0',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2E35',
  },
  titleCompleted: {
    color: '#8A939B',
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    color: '#6A7279',
    lineHeight: 18,
  },
  xp: {
    fontSize: 12,
    color: '#5ABCB4',
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(90, 188, 180, 0.85)',
  },
  buttonCompleted: {
    backgroundColor: 'rgba(200, 215, 220, 0.5)',
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonLabelCompleted: {
    color: '#7A8A90',
  },
});
