import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenTask } from '@/modules/garden/models/garden.types';

type GardenTaskCardProps = {
  task: GardenTask;
  onComplete?: (taskId: string) => void;
  showAction?: boolean;
};

export const GardenTaskCard = memo(({ task, onComplete, showAction = true }: GardenTaskCardProps) => {
  return (
    <View style={[styles.card, task.completed && styles.cardCompleted]}>
      <View style={styles.content}>
        <Text style={styles.title}>{task.title}</Text>
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
            {task.completed ? 'Đã xong' : 'Hoàn thành'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  description: {
    fontSize: 13,
    color: '#6a7279',
  },
  xp: {
    fontSize: 12,
    color: '#58c9d2',
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#58c9d2',
  },
  buttonCompleted: {
    backgroundColor: '#d7e7ea',
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonLabelCompleted: {
    color: '#567177',
  },
});
