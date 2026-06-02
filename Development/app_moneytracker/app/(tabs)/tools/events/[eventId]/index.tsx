import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { useEventUsecases } from '@/modules/event/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import type { EventDetail, EventMember, EventTransaction, Settlement, CreateEventTransactionInput } from '@/modules/event/models/event.types';
import { formatCurrency, parseMoneyInput } from '@/shared/utils/money';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    getEventDetail,
    getEventMembers,
    getEventTransactions,
    getSettlement,
    settleEvent,
    addEventTransaction
  } = useEventUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('');
  const [note, setNote] = useState('');
  const [isTransferFromPersonal, setIsTransferFromPersonal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedWalletName, setSelectedWalletName] = useState('');

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventDetail(eventId!),
    enabled: !!eventId,
    staleTime: 10000, // 10 seconds
  });

  const { data: members } = useQuery({
    queryKey: ['event-members', eventId],
    queryFn: () => getEventMembers(eventId!),
    enabled: !!eventId,
    staleTime: 10000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['event-transactions', eventId],
    queryFn: () => getEventTransactions(eventId!),
    enabled: !!eventId,
    staleTime: 10000,
  });

  const { data: settlement } = useQuery({
    queryKey: ['event-settlement', eventId],
    queryFn: () => getSettlement(eventId!),
    enabled: !!eventId && showSettlementModal,
  });

  // Polling: refetch every 10 seconds for real-time updates
  // Stop polling when event is settled
  useEffect(() => {
    if (event?.status === 'SETTLED' || event?.status === 'ARCHIVED') {
      return;
    }

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-transactions', eventId] });
    }, 10000);

    return () => clearInterval(interval);
  }, [eventId, queryClient, event?.status]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const addTransactionMutation = useMutation({
    mutationFn: (input: CreateEventTransactionInput) => addEventTransaction(eventId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-transactions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      setShowAddTxModal(false);
      setAmount('');
      setNote('');
      setSelectedCategoryId('');
      setSelectedCategoryName('');
      setSelectedCategoryIcon('');
      setIsTransferFromPersonal(false);
      setSelectedWalletId('');
      setSelectedWalletName('');
      Alert.alert('Thành công', 'Đã thêm chi tiêu!');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể thêm giao dịch. Vui lòng thử lại.');
    },
  });

  const handleAddTransaction = async () => {
    if (!amount || !selectedCategoryId) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền và chọn danh mục');
      return;
    }

    addTransactionMutation.mutate({
      amount: parseMoneyInput(amount),
      categoryId: selectedCategoryId,
      note: note.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
      isTransferFromPersonal: isTransferFromPersonal || undefined,
      personalWalletId: isTransferFromPersonal ? selectedWalletId || undefined : undefined,
    });
  };

  const copyShareCode = async () => {
    if (event?.shareCode) {
      await Clipboard.setStringAsync(event.shareCode);
      Alert.alert('Đã copy', 'Mã tham gia đã được copy!');
    }
  };

  const copyShareLink = async () => {
    if (event?.shareLink) {
      await Clipboard.setStringAsync(event.shareLink);
      Alert.alert('Đã copy', 'Link tham gia đã được copy!');
    }
  };

  const handleSettle = async () => {
    Alert.alert(
      'Kết toán sự kiện',
      'Bạn có chắc chắn muốn kết toán sự kiện này? Sau khi kết toán, sẽ không thể thêm giao dịch mới.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Kết toán',
          onPress: async () => {
            try {
              await settleEvent(eventId!);
              queryClient.invalidateQueries({ queryKey: ['event', eventId] });
              Alert.alert('Thành công', 'Sự kiện đã được kết toán!');
              setShowSettlementModal(false);
            } catch {
              Alert.alert('Lỗi', 'Không thể kết toán sự kiện');
            }
          },
        },
      ]
    );
  };

  if (eventLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#29bcc8" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy sự kiện</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(tabs)/tools/events')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.eventIcon}>{event.icon || '🎉'}</Text>
          <Text style={styles.eventName}>{event.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn} onPress={() => setShowShareModal(true)}>
            <Ionicons name="share-outline" size={22} color="#1f1f1f" />
          </Pressable>
          <Pressable style={styles.headerIconBtn} onPress={() => setShowSettlementModal(true)}>
            <Ionicons name="calculator-outline" size={22} color="#1f1f1f" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Tổng quan</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{formatCurrency(event.totalSpent || 0, 'VND')}</Text>
              <Text style={styles.overviewLabel}>Tổng chi</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{event.memberCount}</Text>
              <Text style={styles.overviewLabel}>Thành viên</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{event.transactionCount}</Text>
              <Text style={styles.overviewLabel}>Giao dịch</Text>
            </View>
          </View>
          <View style={styles.perPersonRow}>
            <Text style={styles.perPersonLabel}>Trung bình mỗi người:</Text>
            <Text style={styles.perPersonValue}>{formatCurrency(event.perPersonShare || 0, 'VND')}</Text>
          </View>
        </View>

        {/* Members Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thành viên</Text>
            <Text style={styles.cardSubtitle}>{members?.length || 0} người</Text>
          </View>
          {members?.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.displayName.charAt(0)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  {member.role === 'OWNER' && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>Chủ sở hữu</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberContribution}>
                  Chi: {formatCurrency(member.contribution || 0, 'VND')} • {member.transactionCount} giao dịch
                </Text>
              </View>
              {member.balance !== 0 && (
                <View style={[
                  styles.balanceBadge,
                  { backgroundColor: member.balance > 0 ? '#dff7f5' : '#fef0f0' }
                ]}>
                  <Text style={[
                    styles.balanceText,
                    { color: member.balance > 0 ? '#34a795' : '#f36e79' }
                  ]}>
                    {member.balance > 0 ? '+' : ''}{formatCurrency(member.balance, 'VND')}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Giao dịch gần đây</Text>
          </View>
          {transactions?.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          ) : (
            transactions?.slice(0, 5).map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txIcon}>
                  <Text>{tx.categoryIcon || '📝'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txNote}>{tx.note || tx.categoryName}</Text>
                  <Text style={styles.txMeta}>
                    {tx.creatorName} • {tx.date}
                  </Text>
                </View>
                <Text style={styles.txAmount}>-{formatCurrency(tx.amount, 'VND')}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Transaction FAB */}
      {event.status === 'ACTIVE' && (
        <Pressable style={styles.fab} onPress={() => setShowAddTxModal(true)}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      )}

      {/* Add Transaction Modal */}
      <Modal visible={showAddTxModal} animationType="slide" onRequestClose={() => setShowAddTxModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddTxModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
            <Text style={styles.modalTitle}>Thêm chi tiêu</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.label}>Số tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#8b8b8b"
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Danh mục</Text>
            <Pressable style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
              <Text style={styles.selectBtnText}>
                {selectedCategoryIcon ? `${selectedCategoryIcon} ${selectedCategoryName}` : 'Chọn danh mục'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6c737a" />
            </Pressable>

            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiêu"
              placeholderTextColor="#8b8b8b"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={styles.checkboxRow}>
              <Pressable
                style={styles.checkbox}
                onPress={() => setIsTransferFromPersonal(!isTransferFromPersonal)}
              >
                <Ionicons
                  name={isTransferFromPersonal ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isTransferFromPersonal ? '#29bcc8' : '#6c737a'}
                />
                <Text style={styles.checkboxLabel}>Chuyển tiền từ ví cá nhân</Text>
              </Pressable>
            </View>

            {isTransferFromPersonal && (
              <>
                <Text style={styles.label}>Chọn ví</Text>
                <Pressable style={styles.selectBtn} onPress={() => setShowWalletModal(true)}>
                  <Text style={styles.selectBtnText}>
                    {selectedWalletName || 'Chọn ví'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6c737a" />
                </Pressable>
              </>
            )}

            <Pressable
              onPress={handleAddTransaction}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
              disabled={addTransactionMutation.isPending}
            >
              {addTransactionMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Thêm chi tiêu</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn danh mục</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            <ScrollView>
              {categories?.filter(c => c.type === 'EXPENSE').map((cat) => (
                <Pressable
                  key={cat.categoryId}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCategoryId(cat.categoryId);
                    setSelectedCategoryName(cat.name);
                    setSelectedCategoryIcon(cat.icon || '📝');
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.pickerItemIcon}>{cat.icon || '📝'}</Text>
                  <Text style={styles.pickerItemText}>{cat.name}</Text>
                  {selectedCategoryId === cat.categoryId && (
                    <Ionicons name="checkmark" size={20} color="#29bcc8" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Wallet Picker Modal */}
      <Modal visible={showWalletModal} animationType="slide" transparent onRequestClose={() => setShowWalletModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn ví</Text>
              <Pressable onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            <ScrollView>
              {wallets?.filter(w => w.type === 'REGULAR' || w.type === 'CASH').map((wallet) => (
                <Pressable
                  key={wallet.walletId}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedWalletId(wallet.walletId);
                    setSelectedWalletName(wallet.name);
                    setShowWalletModal(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{wallet.name}</Text>
                  <Text style={styles.pickerItemBalance}>{formatCurrency(wallet.currentBalance || 0, 'VND')}</Text>
                  {selectedWalletId === wallet.walletId && (
                    <Ionicons name="checkmark" size={20} color="#29bcc8" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settlement Modal */}
      <Modal visible={showSettlementModal} animationType="slide" transparent onRequestClose={() => setShowSettlementModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết toán sự kiện</Text>
              <Pressable onPress={() => setShowSettlementModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {settlement ? (
              <>
                <View style={styles.settlementSummary}>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Tổng chi</Text>
                    <Text style={styles.settlementValue}>{formatCurrency(settlement.totalSpent, 'VND')}</Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Mỗi người</Text>
                    <Text style={styles.settlementValue}>{formatCurrency(settlement.perPersonShare, 'VND')}</Text>
                  </View>
                </View>

                <Text style={styles.label}>Gợi ý kết toán</Text>
                {settlement.settlements.map((item, index) => (
                  <View key={index} style={styles.settlementItem}>
                    <Text style={styles.settlementItemText}>
                      {item.fromUserName} → {item.toUserName}: {formatCurrency(item.amount, 'VND')}
                    </Text>
                  </View>
                ))}

                {event.status === 'ACTIVE' && (
                  <Pressable
                    onPress={handleSettle}
                    style={({ pressed }) => [styles.settleBtn, pressed && styles.settleBtnPressed]}
                  >
                    <Text style={styles.settleBtnText}>Hoàn thành kết toán</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <ActivityIndicator size="large" color="#29bcc8" />
            )}
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={showShareModal} animationType="slide" transparent onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chia sẻ sự kiện</Text>
              <Pressable onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.label}>Mã tham gia</Text>
            <View style={styles.shareCodeBox}>
              <Text style={styles.shareCodeText}>{event.shareCode}</Text>
              <Pressable onPress={copyShareCode}>
                <Ionicons name="copy-outline" size={24} color="#29bcc8" />
              </Pressable>
            </View>

            <Text style={styles.label}>Link tham gia</Text>
            <Pressable style={styles.shareCodeBox} onPress={copyShareLink}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{event.shareLink}</Text>
              <Ionicons name="copy-outline" size={24} color="#29bcc8" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper function to format money input
const formatCurrencyInput = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('vi-VN');
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6c737a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ebef',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventIcon: {
    fontSize: 28,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f6681',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6c737a',
    marginTop: 4,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e8ebef',
  },
  perPersonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8ebef',
  },
  perPersonLabel: {
    fontSize: 14,
    color: '#6c737a',
  },
  perPersonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6c737a',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef7f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#29bcc8',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  ownerBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  memberContribution: {
    fontSize: 12,
    color: '#6c737a',
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef7f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 4,
  },
  txNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  txMeta: {
    fontSize: 12,
    color: '#6c737a',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f36e79',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c737a',
    textAlign: 'center',
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    maxHeight: '80%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  modalContent: {
    padding: 20,
    gap: 16,
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
  selectBtn: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#1f1f1f',
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
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    gap: 12,
  },
  pickerItemIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  pickerItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1f1f1f',
  },
  pickerItemBalance: {
    fontSize: 14,
    color: '#6c737a',
  },
  settlementSummary: {
    backgroundColor: '#f0f7f9',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settlementLabel: {
    fontSize: 14,
    color: '#5f6b75',
  },
  settlementValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  settlementItem: {
    backgroundColor: '#f0f2f4',
    padding: 12,
    borderRadius: 12,
  },
  settlementItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  settleBtn: {
    backgroundColor: '#34a795',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleBtnPressed: {
    opacity: 0.85,
  },
  settleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f2f4',
    padding: 16,
    borderRadius: 12,
  },
  shareCodeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f1f1f',
    letterSpacing: 4,
  },
  shareLinkText: {
    fontSize: 14,
    color: '#29bcc8',
    flex: 1,
  },
});