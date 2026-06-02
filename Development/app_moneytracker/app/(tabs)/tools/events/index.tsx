import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  });

  const events = eventsQuery.data ?? [];

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
          <Pressable style={styles.headerBtn} onPress={() => setShowJoinModal(true)}>
            <Ionicons name="enter-outline" size={22} color="#1f1f1f" />
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Event List */}
      {eventsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#29bcc8" />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>Chưa có sự kiện nào</Text>
          <Text style={styles.emptyText}>Tạo sự kiện để cùng bạn bè ghi nhận chi tiêu chung</Text>
          <Pressable style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Tạo sự kiện</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.eventId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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

            <Pressable
              onPress={handleCreateEvent}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            >
              <Text style={styles.submitBtnText}>Tạo sự kiện</Text>
            </Pressable>
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

            <Pressable
              onPress={handleJoinEvent}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            >
              <Text style={styles.submitBtnText}>Tham gia</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ebef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#1f1f1f',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventMetaText: {
    fontSize: 13,
    color: '#6c737a',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c737a',
    textAlign: 'center',
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#29bcc8',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6b75',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    color: '#1a1a1a',
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
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconOptionSelected: {
    backgroundColor: '#29bcc8',
  },
  iconOptionText: {
    fontSize: 24,
  },
  submitBtn: {
    backgroundColor: '#29bcc8',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});