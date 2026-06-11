import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import * as SecureStore from 'expo-secure-store';
import { ENV } from '@/core/config/env';
import { useEventUsecases } from '@/modules/event/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { Button, BackButton, FAB, colors, spacing, CategoryPickerModal } from '@/components/common';
import type { EventDetail, EventMember, EventTransaction, Settlement, CreateEventTransactionInput, UpdateEventTransactionInput } from '@/modules/event/models/event.types';
import { formatCurrency, parseMoneyInput, formatMoneyInput } from '@/shared/utils/money';

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
    addEventTransaction,
    updateEventTransaction,
    deleteEventTransaction
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
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('');
  const [note, setNote] = useState('');
  const [isTransferFromPersonal, setIsTransferFromPersonal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedWalletName, setSelectedWalletName] = useState('');

  const [currentUsername, setCurrentUsername] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showTxOptionsModal, setShowTxOptionsModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<EventTransaction | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('display_username').then(name => {
      if (name) setCurrentUsername(name);
    });
  }, []);

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
      resetForm();
      Alert.alert('Thành công', 'Đã thêm chi tiêu!');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể thêm giao dịch. Vui lòng thử lại.');
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: (input: UpdateEventTransactionInput) => updateEventTransaction(eventId!, editingTxId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-transactions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      resetForm();
      Alert.alert('Thành công', 'Đã cập nhật chi tiêu!');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể cập nhật giao dịch. Vui lòng thử lại.');
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: string) => deleteEventTransaction(eventId!, transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-transactions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      Alert.alert('Thành công', 'Đã xoá giao dịch!');
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xoá giao dịch. Vui lòng thử lại.');
    },
  });

  const resetForm = () => {
    setShowAddTxModal(false);
    setEditingTxId(null);
    setAmount('');
    setNote('');
    setSelectedCategoryId('');
    setSelectedCategoryName('');
    setSelectedCategoryIcon('');
    setSelectedCategoryColor('');
    setIsTransferFromPersonal(false);
    setSelectedWalletId('');
    setSelectedWalletName('');
  };

  const handleAddTransaction = async () => {
    if (!amount || !selectedCategoryId) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền và chọn danh mục');
      return;
    }

    if (editingTxId) {
      updateTransactionMutation.mutate({
        amount: parseMoneyInput(amount),
        categoryId: selectedCategoryId,
        note: note.trim() || undefined,
      });
    } else {
      addTransactionMutation.mutate({
        amount: parseMoneyInput(amount),
        categoryId: selectedCategoryId,
        note: note.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
        isTransferFromPersonal: isTransferFromPersonal || undefined,
        personalWalletId: isTransferFromPersonal ? selectedWalletId || undefined : undefined,
      });
    }
  };

  const handleEditTx = () => {
    if (!selectedTx) return;
    setEditingTxId(selectedTx.id);
    setAmount(formatMoneyInput(selectedTx.amount.toString()));
    setSelectedCategoryId(selectedTx.categoryId);
    setSelectedCategoryName(selectedTx.categoryName);
    setSelectedCategoryIcon(selectedTx.categoryIcon);
    
    // Find category color from categories list
    const cat = categories?.find(c => c.categoryId === selectedTx.categoryId);
    setSelectedCategoryColor(cat?.color || '#29bcc8');
    
    setNote(selectedTx.note || '');
    setShowTxOptionsModal(false);
    setShowAddTxModal(true);
  };

  const handleDeleteTx = () => {
    if (!selectedTx) return;
    setShowTxOptionsModal(false);
    Alert.alert(
      'Xoá giao dịch',
      'Bạn có chắc chắn muốn xoá giao dịch này?',
      [
        { text: 'Huỷ', style: 'cancel' },
        { 
          text: 'Xoá', 
          style: 'destructive',
          onPress: () => deleteTransactionMutation.mutate(selectedTx.id)
        }
      ]
    );
  };

  const copyShareCode = async () => {
    if (event?.shareCode) {
      await Clipboard.setStringAsync(event.shareCode);
      Alert.alert('Đã copy', 'Mã tham gia đã được copy!');
    }
  };

  const handleCopyShareLink = async () => {
    if (event?.shareLink) {
      await Clipboard.setStringAsync(event.shareLink);
      Alert.alert('Đã copy', 'Link tham gia App đã được copy!');
    }
  };

  const handleCopyGuestLink = async () => {
    if (event?.eventId) {
      const guestLink = `${ENV.webAppUrl}/guest/${event.eventId}`;
      await Clipboard.setStringAsync(guestLink);
      Alert.alert('Đã copy', 'Link dành cho Khách đã được copy!');
    }
  };

  const handleCopyReport = async () => {
    if (!event || !transactions) return;
    
    let report = `BÁO CÁO KẾT TOÁN: ${event.name}\n`;
    report += `Tổng chi tiêu: ${formatCurrency(event.totalSpent || 0, 'VND')}\n`;
    report += `Số lượng giao dịch: ${event.transactionCount}\n\n`;
    report += `CHI TIẾT GIAO DỊCH:\n`;
    
    transactions.forEach((tx, index) => {
      const note = tx.note || tx.categoryName;
      report += `${index + 1}. [${tx.date}] ${tx.creatorName}: ${formatCurrency(tx.amount, 'VND')} - ${note}\n`;
    });
    
    await Clipboard.setStringAsync(report);
    Alert.alert('Đã copy', 'Báo cáo chi tiết đã được copy vào khay nhớ tạm!');
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
        <BackButton to="/(tabs)/tools/events" />
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
                <View style={styles.memberContributionRow}>
                  <Text style={styles.memberContributionLabel}>Đã chi: </Text>
                  <Text style={styles.memberContributionValue}>{formatCurrency(member.contribution || 0, 'VND')}</Text>
                  <Text style={styles.memberContributionLabel}> • {member.transactionCount} giao dịch</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Giao dịch gần đây</Text>
          </View>
          {(!transactions || transactions.length === 0) ? (
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const cat = categories?.find(c => c.categoryId === tx.categoryId);
              const displayIcon = tx.categoryIcon || cat?.icon || 'help';
              const catColor = cat?.color || '#29bcc8';
              const isOwner = members?.find(m => m.role === 'OWNER')?.displayName === currentUsername;
              const isCreator = tx.creatorName === currentUsername;
              const canEdit = isOwner || isCreator;
              
              return (
              <Pressable 
                key={tx.id} 
                style={({ pressed }) => [
                  styles.txRow,
                  pressed && canEdit && { opacity: 0.7 }
                ]}
                onPress={() => {
                  if (canEdit) {
                    setSelectedTx(tx);
                    setShowTxOptionsModal(true);
                  }
                }}
              >
                <View style={[styles.txIcon, { backgroundColor: catColor + '20' }]}>
                  <MaterialCommunityIcons name={displayIcon as any} size={20} color={catColor} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txNote, canEdit && { color: colors.textPrimary, fontWeight: '600' }]}>
                    {tx.note || tx.categoryName}
                  </Text>
                  <Text style={styles.txMeta}>
                    {tx.creatorName} • {tx.date}
                  </Text>
                </View>
                <View style={styles.txAmountContainer}>
                  <Text style={[styles.txAmount, canEdit && { fontWeight: '700' }]}>-{formatCurrency(tx.amount, 'VND')}</Text>
                  {canEdit && (
                    <Ionicons name="chevron-forward" size={16} color="#6c737a" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action FAB */}
      {event.status === 'ACTIVE' ? (
        <FAB icon={<Ionicons name="add" size={24} color="#fff" />} onPress={() => setShowAddTxModal(true)} />
      ) : (
        <FAB icon={<Ionicons name="document-text-outline" size={24} color="#fff" />} onPress={handleCopyReport} />
      )}

      {/* Add/Edit Transaction Modal */}
      <Modal visible={showAddTxModal} animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={resetForm}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
            <Text style={styles.modalTitle}>{editingTxId ? 'Sửa chi tiêu' : 'Thêm chi tiêu'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.label}>Số tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#8b8b8b"
              value={amount}
              onChangeText={(text) => setAmount(formatMoneyInput(text))}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Danh mục</Text>
            <Pressable style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {selectedCategoryIcon ? (
                  <MaterialCommunityIcons name={selectedCategoryIcon as any} size={20} color={selectedCategoryColor || '#1f1f1f'} />
                ) : null}
                <Text style={styles.selectBtnText}>
                  {selectedCategoryName || 'Chọn danh mục'}
                </Text>
              </View>
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

            {!editingTxId && (
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
            )}

            {!editingTxId && isTransferFromPersonal && (
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

            <Button
              title={editingTxId ? "Cập nhật" : "Thêm chi tiêu"}
              onPress={handleAddTransaction}
              variant="primary"
              loading={addTransactionMutation.isPending || updateTransactionMutation.isPending}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategoryId={selectedCategoryId}
        allowedTypes={['EXPENSE']}
        onSelectCategory={(category) => {
          setSelectedCategoryId(category.categoryId);
          setSelectedCategoryName(category.name);
          setSelectedCategoryIcon(category.icon || 'help');
          setSelectedCategoryColor(category.color || '#29bcc8');
          setShowCategoryModal(false);
        }}
      />


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
                </View>

                {event.status === 'ACTIVE' && (
                  <Button
                    title="Hoàn thành kết toán"
                    onPress={handleSettle}
                    variant="primary"
                  />
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

            <Text style={styles.label}>Link tham gia App (Dành cho thành viên)</Text>
            <Pressable style={styles.shareCodeBox} onPress={handleCopyShareLink}>
              <Text style={styles.shareLinkText} numberOfLines={1}>{event.shareLink}</Text>
              <Ionicons name="copy-outline" size={24} color="#29bcc8" />
            </Pressable>

            <Text style={[styles.label, { marginTop: 16 }]}>Link Web Khách (Cho người ngoài)</Text>
            <Pressable style={styles.shareCodeBox} onPress={handleCopyGuestLink}>
              <Text style={styles.shareLinkText} numberOfLines={1}>
                {ENV.webAppUrl}/guest/{event?.eventId}
              </Text>
              <Ionicons name="copy-outline" size={24} color="#29bcc8" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Transaction Options Modal */}
      <Modal visible={showTxOptionsModal} animationType="fade" transparent onRequestClose={() => setShowTxOptionsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTxOptionsModal(false)}>
          <View style={styles.txOptionsSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tuỳ chọn giao dịch</Text>
              <Pressable onPress={() => setShowTxOptionsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Pressable style={styles.txOptionBtn} onPress={handleEditTx}>
              <Ionicons name="pencil-outline" size={24} color="#29bcc8" />
              <Text style={[styles.txOptionText, { color: '#29bcc8' }]}>Sửa giao dịch</Text>
            </Pressable>

            <Pressable style={styles.txOptionBtn} onPress={handleDeleteTx}>
              <Ionicons name="trash-outline" size={24} color="#f36e79" />
              <Text style={[styles.txOptionText, { color: '#f36e79' }]}>Xoá giao dịch</Text>
            </Pressable>
          </View>
        </Pressable>
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
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ebef',
    gap: 12,
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
    color: colors.textPrimary,
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
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  overviewCard: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  perPersonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.backgroundPrimary,
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
    color: colors.textSecondary,
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
    color: colors.primary,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ownerBadge: {
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d48806',
  },
  memberContributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberContributionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberContributionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34a795',
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
    fontSize: 15,
    color: colors.textPrimary,
  },
  txMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  txAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAmount: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    maxHeight: '80%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 16,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  pickerSheet: {
    backgroundColor: colors.backgroundPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  pickerItemBalance: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
  settlementItem: {
    backgroundColor: '#f0f2f4',
    padding: 12,
    borderRadius: 12,
  },
  settlementItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  shareLinkText: {
    fontSize: 14,
    color: colors.primary,
    flex: 1,
  },
  txOptionsSheet: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: 'auto',
  },
  txOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    gap: 12,
  },
  txOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});