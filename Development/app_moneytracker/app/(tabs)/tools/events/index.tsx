import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, FAB, EmptyState, colors, spacing } from '@/components/common';
import { useEventUsecases } from '@/modules/event/usecases';
import type { Event } from '@/modules/event/models/event.types';
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

  const renderEventItem = ({ item }: { item: Event }) => (
    <Pressable style={styles.eventCard} onPress={() => router.push(`/tools/events/${item.eventId}`)}>
      <View style={styles.eventIconWrap}>
        <Text style={styles.eventIcon}>{item.icon || '🎉'}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.name}</Text>
        <View style={styles.eventMeta}>
          <Text style={styles.eventMetaText}>
            👥 {item.memberCount} người
          </Text>
          <Text style={styles.eventMetaText}>
            💰 {formatCurrency(item.totalSpent || 0, 'VND')}
          </Text>
          <View style={[styles.eventStatusBadge, { backgroundColor: eventStatusColors[item.status] + '20' }]}>
            <Text style={[styles.eventStatusText, { color: eventStatusColors[item.status] }]}>
              {eventStatusLabels[item.status]}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6c737a" />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sự kiện</Text>
        <View style={styles.headerActions}>
          <Button
            title=""
            variant="ghost"
            size="sm"
            iconLeft={<Ionicons name="enter-outline" size={22} color="#1f1f1f" />}
            onPress={() => setShowJoinModal(true)}
            style={styles.headerBtn}
          />
        </View>
      </View>

      {/* Event List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#29bcc8" />
        </View>
      ) : hasError ? (
        <EmptyState
          icon="⚠️"
          title="Không thể tải sự kiện"
          description="Vui lòng kiểm tra kết nối và thử lại"
          action={{
            title: "Thử lại",
            icon: <Ionicons name="refresh" size={20} color="#fff" />,
            onPress: () => eventsQuery.refetch(),
          }}
        />
      ) : isEmpty ? (
        <EmptyState
          icon="🎉"
          title="Chưa có sự kiện nào"
          description="Tạo sự kiện để cùng bạn bè ghi nhận chi tiêu chung"
          action={{
            title: "Tạo sự kiện",
            icon: <Ionicons name="add" size={20} color="#fff" />,
            onPress: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.eventId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgTertiary,
  },
  listContent: {
    padding: spacing.lg,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  eventIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef7f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
    gap: 6,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  eventStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconPicker: {
    flexDirection: 'row',
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconOptionSelected: {
    backgroundColor: colors.primary,
  },
});