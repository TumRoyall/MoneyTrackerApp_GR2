import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient , useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, FAB, EmptyState, BackButton, borderRadius, colors, spacing, typography } from '@/components/common';
import { useEventUsecases } from '@/modules/event/usecases';
import { formatCurrency } from '@/shared/utils/money';

const eventStatusColors: Record<string, string> = {
  ACTIVE: '#34a795',
  SETTLED: '#7b878f',
  ARCHIVED: '#7b878f',
};

const eventStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  SETTLED: 'Đã kết toán',
  ARCHIVED: 'Đã lưu trữ',
};

export default function EventListScreen() {
  const router = useRouter();
  const { getEvents, joinEvent, createEvent } = useEventUsecases();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventIcon, setEventIcon] = useState('🎉');
  const [eventDescription, setEventDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Polling: refetch every 30 seconds when screen is visible
  useEffect(() => {
    const interval = setInterval(() => {
      eventsQuery.refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [eventsQuery]);

  const events = eventsQuery.data ?? [];
  const isLoading = eventsQuery.isLoading;
  const isEmpty = !isLoading && events.length === 0;
  const hasError = eventsQuery.isError;

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên sự kiện');
      return;
    }

    try {
      const newEvent = await createEvent({
        name: eventName.trim(),
        icon: eventIcon,
        description: eventDescription.trim() || undefined,
      });
      setShowCreateModal(false);
      setEventName('');
      setEventIcon('🎉');
      setEventDescription('');
      router.push(`/tools/events/${newEvent.eventId}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo sự kiện. Vui lòng thử lại.');
    }
  };

  const handleJoinEvent = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã tham gia');
      return;
    }

    try {
      const event = await joinEvent(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      router.push(`/tools/events/${event.eventId}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không tìm thấy sự kiện hoặc mã không hợp lệ.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <BackButton to="/(tabs)/tools" />
        <Text style={styles.title}>Sự kiện</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.joinBtn} onPress={() => setShowJoinModal(true)}>
            <Ionicons name="enter-outline" size={22} color="#1f1f1f" />
          </Pressable>
        </View>
      </View>

      {/* Event List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <EmptyState
            icon="sync"
            title="Đang tải sự kiện..."
            description="Vui lòng đợi trong giây lát."
          />
        ) : hasError ? (
          <EmptyState
            icon="warning"
            title="Không thể tải sự kiện"
            description="Vui lòng kiểm tra kết nối và thử lại"
            action={{
              title: "Thử lại",
              onPress: () => eventsQuery.refetch(),
            }}
          />
        ) : isEmpty ? (
          <EmptyState
            icon="calendar-outline"
            title="Chưa có sự kiện nào"
            description="Tạo sự kiện để cùng bạn bè ghi nhận chi tiêu chung"
            action={{
              title: "Tạo sự kiện",
              onPress: () => setShowCreateModal(true),
            }}
          />
        ) : (
          events.map((event) => (
            <Pressable key={event.eventId} style={styles.eventCard} onPress={() => router.push(`/tools/events/${event.eventId}`)}>
              <View style={styles.eventIconWrap}>
                <Text style={styles.eventIcon}>{event.icon || '🎉'}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventMetaText}>
                    👥 {event.memberCount} người
                  </Text>
                  <Text style={styles.eventMetaText}>
                    💰 {formatCurrency(event.totalSpent || 0, 'VND')}
                  </Text>
                  <View style={[styles.eventStatusBadge, { backgroundColor: eventStatusColors[event.status] + '20' }]}>
                    <Text style={[styles.eventStatusText, { color: eventStatusColors[event.status] }]}>
                      {eventStatusLabels[event.status]}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6c737a" />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* FAB for create event */}
      {!isEmpty && !isLoading && (
        <FAB
          icon={<Ionicons name="add" size={24} color="#fff" />}
          label="Tạo sự kiện"
          onPress={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo sự kiện mới</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tên sự kiện"
              placeholderTextColor="#8b8b8b"
              value={eventName}
              onChangeText={setEventName}
            />

            <Text style={styles.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
              {['🎉', '🏸', '🎾', '⚽', '🏀', '🎮', '🎤', '🍺', '🍔', '☕', '🎁', '🎂', '🏕️', '🎄', '🎯'].map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.iconOption, eventIcon === icon && styles.iconOptionSelected]}
                  onPress={() => setEventIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả (tùy chọn)"
              placeholderTextColor="#8b8b8b"
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
            />

            <Button
              title="Tạo sự kiện"
              onPress={handleCreateEvent}
              size="lg"
            />
          </View>
        </View>
      </Modal>

      {/* Join Event Modal */}
      <Modal visible={showJoinModal} animationType="slide" transparent onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tham gia sự kiện</Text>
              <Pressable onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.label}>Mã tham gia</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mã (VD: ABC123)"
              placeholderTextColor="#8b8b8b"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />

            <Button
              title="Tham gia"
              onPress={handleJoinEvent}
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  joinBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  listContent: {
    gap: spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  eventIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  eventName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eventMetaText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  eventStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  eventStatusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconPicker: {
    flexDirection: 'row',
  },
  iconOption: {
    width: spacing['2xl'],
    height: spacing['2xl'],
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconOptionText: {
    fontSize: 20,
  },
  iconOptionSelected: {
    backgroundColor: colors.primary,
  },
});