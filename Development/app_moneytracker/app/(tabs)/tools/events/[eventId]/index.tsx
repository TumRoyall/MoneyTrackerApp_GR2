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
import * as SecureStore from 'expo-secure-store';
import { ENV } from '@/core/config/env';
import { useEventUsecases } from '@/modules/event/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { Button, BackButton, FAB, colors, spacing, CategoryPickerModal } from '@/components/common';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import type { EventDetail, EventMember, EventTransaction, Settlement, CreateEventTransactionInput, UpdateEventTransactionInput, AddMemberInput, UpdateMemberInput } from '@/modules/event/models/event.types';
import { formatCurrency, parseMoneyInput, formatMoneyInput } from '@/shared/utils/money';
import {
  buildEqualSplitParticipants,
  calculateEqualSplit,
  formatEqualSplitReport,
  type EqualSplitParticipant,
} from '@/modules/event/utils/equalSplit';

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
    deleteEventTransaction,
    addMember,
    updateMember,
    removeMember,
  } = useEventUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEqualSplitModal, setShowEqualSplitModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('');
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('');
  const [note, setNote] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState<string | null>(null);

  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showTxOptionsModal, setShowTxOptionsModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<EventTransaction | null>(null);

  // Equal-Split state
  const [paidOverrides, setPaidOverrides] = useState<Record<string, string>>({});
  const [receivedOverrides, setReceivedOverrides] = useState<Record<string, string>>({});

  // Add Member form state — chỉ cần email, name = email mặc định
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Edit Member form state (admin có thể sửa cả email + name cho guest)
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<EventMember | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [editingMemberEmail, setEditingMemberEmail] = useState('');

  useEffect(() => {
    SecureStore.getItemAsync('display_username').then(name => {
      if (name) setCurrentUsername(name);
    });
    SecureStore.getItemAsync('user_id').then(id => {
      if (id) setCurrentUserId(id);
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

  // Member CRUD mutations
  const addMemberMutation = useMutation({
    mutationFn: (input: AddMemberInput) => addMember(eventId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setShowAddMemberModal(false);
      setNewMemberEmail('');
      Alert.alert('Thành công', 'Đã thêm thành viên!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể thêm thành viên.';
      Alert.alert('Lỗi', msg);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, input }: { memberId: string; input: UpdateMemberInput }) =>
      updateMember(eventId!, memberId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      Alert.alert('Thành công', 'Đã cập nhật thành viên!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể cập nhật thành viên.';
      Alert.alert('Lỗi', msg);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(eventId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Thành công', 'Đã xoá thành viên!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể xoá thành viên.';
      Alert.alert('Lỗi', msg);
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
    setSelectedWalletId(null);
    setSelectedWalletName(null);
  };

  const handleAddTransaction = async () => {
    if (!amount || !selectedCategoryId) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền và chọn danh mục');
      return;
    }

    if (!editingTxId && !selectedWalletId) {
      Alert.alert('Lỗi', 'Vui lòng chọn ví thanh toán');
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
        walletId: selectedWalletId!,
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

  // ==================== EQUAL-SPLIT (chia đều kể cả khách) ====================

  const isOwner = !!event && !!currentUserId && event.createdBy === currentUserId;

  /**
   * Build participants + apply user overrides (paid, received).
   * Recalc mỗi khi members/transactions/overrides thay đổi.
   */
  const equalSplitParticipants: EqualSplitParticipant[] = (() => {
    if (!members || !transactions) return [];
    const base = buildEqualSplitParticipants(members, transactions);
    return base.map((p) => ({
      ...p,
      isCurrentUser: members.find((m) => m.id === p.id)?.userId === currentUserId,
      paid: paidOverrides[p.id] !== undefined ? parseMoneyInput(paidOverrides[p.id]) : p.paid,
      received: parseMoneyInput(receivedOverrides[p.id] ?? '0'),
    }));
  })();

  const equalSplitResult = (() => {
    if (!event || equalSplitParticipants.length === 0) return null;
    return calculateEqualSplit(equalSplitParticipants, event.totalSpent || 0);
  })();

  const handleCopyEqualSplitReport = async () => {
    if (!event || !equalSplitResult) return;
    try {
      const text = formatEqualSplitReport(event.name, equalSplitResult);
      await Clipboard.setStringAsync(text);
      Alert.alert('Đã copy', 'Báo cáo chia đều đã được copy!');
    } catch {
      Alert.alert('Lỗi', 'Không thể copy báo cáo.');
    }
  };

  const resetEqualSplitOverrides = () => {
    setPaidOverrides({});
    setReceivedOverrides({});
  };

  // ==================== MEMBER MANAGEMENT ====================

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email.');
      return;
    }
    const email = newMemberEmail.trim().toLowerCase();
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return;
    }
    // Name mặc định = email. Admin có thể sửa sau qua "Sửa tên".
    addMemberMutation.mutate({
      guestName: email,
      guestEmail: email,
    });
  };

  const handleRemoveMember = (member: EventMember) => {
    if (member.userId === currentUserId) {
      Alert.alert('Lỗi', 'OWNER không thể tự xoá. Hãy chuyển quyền trước.');
      return;
    }
    Alert.alert(
      'Xoá thành viên',
      `Bạn có chắc chắn muốn xoá ${member.displayName}? Lịch sử giao dịch của họ sẽ được giữ lại.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => removeMemberMutation.mutate(member.id),
        },
      ]
    );
  };

  const handleEditMemberName = (member: EventMember) => {
    if (!member.isGuest) {
      Alert.alert('Thông báo', 'Không thể sửa thông tin của thành viên là user thật.');
      return;
    }
    setEditingMember(member);
    setEditingMemberName(member.displayName);
    setEditingMemberEmail(member.guestEmail || '');
    setShowEditMemberModal(true);
  };

  const handleSaveMemberName = () => {
    if (!editingMember) return;
    if (!editingMemberName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống.');
      return;
    }
    if (!editingMemberEmail.trim()) {
      Alert.alert('Lỗi', 'Email không được để trống.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingMemberEmail.trim())) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return;
    }
    updateMemberMutation.mutate(
      {
        memberId: editingMember.id,
        input: {
          displayName: editingMemberName.trim(),
          guestEmail: editingMemberEmail.trim().toLowerCase(),
        },
      },
      {
        onSuccess: () => {
          setShowEditMemberModal(false);
          setEditingMember(null);
        },
      }
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
          {isOwner && (
            <Pressable style={styles.headerIconBtn} onPress={() => setShowMembersModal(true)}>
              <Ionicons name="people-outline" size={22} color="#1f1f1f" />
            </Pressable>
          )}
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
                  {member.userId === currentUserId && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Bạn</Text>
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
              const isOwner = members?.find(m => m.role === 'OWNER')?.userId === currentUserId;
              const isCreator = tx.creatorId === currentUserId;
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
                  <CategoryIcon icon={displayIcon} size={20} color={catColor} />
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
                  <CategoryIcon icon={selectedCategoryIcon} size={20} color={selectedCategoryColor || '#1f1f1f'} />
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
              <>
                <Text style={styles.label}>Ví thanh toán</Text>
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
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.settlementSummary}>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Tổng chi</Text>
                    <Text style={styles.settlementValue}>{formatCurrency(settlement.totalSpent, 'VND')}</Text>
                  </View>
                </View>

                <Text style={[styles.label, { marginTop: 8 }]}>Chọn chế độ kết toán</Text>

                <Pressable
                  style={styles.modeCard}
                  onPress={() => {
                    setShowSettlementModal(false);
                    resetEqualSplitOverrides();
                    setShowEqualSplitModal(true);
                  }}
                >
                  <Ionicons name="pie-chart-outline" size={28} color="#29bcc8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeCardTitle}>Chia đều (kể cả khách)</Text>
                    <Text style={styles.modeCardSubtitle}>
                      Tính tiền cho từng người dựa trên đã chi & đã nhận
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
                </Pressable>

                <View
                  style={[styles.modeCard, { borderColor: '#29bcc8', borderWidth: 1, backgroundColor: '#f0fdfd' }]}
                >
                  <Ionicons name="swap-horizontal-outline" size={28} color="#1f6681" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeCardTitle}>Kết toán tối ưu (user)</Text>
                    <Text style={styles.modeCardSubtitle}>
                      Tối ưu số lệnh chuyển — chỉ tính cho thành viên user
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#29bcc8" />
                </View>

                {settlement.memberBalances.length > 0 && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text style={styles.label}>Cân đối (chỉ user)</Text>
                    {settlement.memberBalances.map((mb) => (
                      <View key={mb.userId} style={styles.balanceRow}>
                        <Text style={styles.balanceName}>{mb.userName}</Text>
                        <Text style={styles.balanceAmount}>
                          {mb.balance >= 0 ? '+' : ''}{formatCurrency(mb.balance, 'VND')}
                        </Text>
                      </View>
                    ))}
                    {settlement.settlements.length > 0 && (
                      <>
                        <Text style={[styles.label, { marginTop: 8 }]}>Lệnh chuyển</Text>
                        {settlement.settlements.map((s, idx) => (
                          <View key={idx} style={styles.balanceRow}>
                            <Text style={styles.balanceName}>
                              {s.fromUserName} → {s.toUserName}
                            </Text>
                            <Text style={styles.balanceAmount}>
                              {formatCurrency(s.amount, 'VND')}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}

                {isOwner && event.status === 'ACTIVE' && (
                  <View style={{ marginTop: 16 }}>
                    <Button
                      title="Hoàn thành kết toán"
                      onPress={handleSettle}
                      variant="primary"
                    />
                  </View>
                )}
              </ScrollView>
            ) : (
              <ActivityIndicator size="large" color="#29bcc8" />
            )}
          </View>
        </View>
      </Modal>

      {/* Manage Members Modal (OWNER only) */}
      <Modal visible={showMembersModal} animationType="slide" transparent onRequestClose={() => setShowMembersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quản lý thành viên ({members?.length ?? 0})</Text>
              <Pressable onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70%' }}>
              {members?.map((member) => (
                <View key={member.id} style={styles.memberManageRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.memberManageName}>{member.displayName}</Text>
                      {member.isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>OWNER</Text>
                        </View>
                      )}
                      {member.isGuest && (
                        <View style={styles.guestBadge}>
                          <Text style={styles.guestBadgeText}>Khách</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberManageEmail}>
                      {member.guestEmail || (member.userId ? `User ID: ${member.userId.slice(0, 8)}...` : '')}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.memberActionBtn}
                    onPress={() => handleEditMemberName(member)}
                    disabled={!member.isGuest}
                  >
                    <Ionicons name="pencil-outline" size={20} color={member.isGuest ? '#29bcc8' : '#ccc'} />
                  </Pressable>
                  <Pressable
                    style={styles.memberActionBtn}
                    onPress={() => handleRemoveMember(member)}
                    disabled={member.userId === currentUserId}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={member.userId === currentUserId ? '#ccc' : '#f36e79'}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            {event.status === 'ACTIVE' && (
              <Button
                title="＋ Thêm thành viên"
                onPress={() => setShowAddMemberModal(true)}
                variant="primary"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showAddMemberModal} animationType="slide" transparent onRequestClose={() => setShowAddMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm thành viên</Text>
              <Pressable onPress={() => setShowAddMemberModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.label}>Email <Text style={{ color: '#f36e79' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="VD: hung@example.com"
              placeholderTextColor="#8b8b8b"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.helperText}>
              Email dùng để định danh duy nhất khách trong event này.{'\n'}
              Tên hiển thị mặc định = email — bạn có thể sửa sau qua nút ✏️.
            </Text>

            <Button
              title="Thêm"
              onPress={handleAddMember}
              variant="primary"
              loading={addMemberMutation.isPending}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Member Modal (admin sửa email + name cho guest) */}
      <Modal visible={showEditMemberModal} animationType="slide" transparent onRequestClose={() => setShowEditMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa thông tin thành viên</Text>
              <Pressable onPress={() => setShowEditMemberModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {editingMember && (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editingMemberEmail}
                  onChangeText={setEditingMemberEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Tên hiển thị</Text>
                <TextInput
                  style={styles.input}
                  value={editingMemberName}
                  onChangeText={setEditingMemberName}
                />

                <Text style={styles.helperText}>
                  Đổi email sẽ dùng làm định danh mới. Nếu bạn không đổi tên, hệ thống sẽ tự đặt tên = email.
                </Text>

                <Button
                  title="Lưu"
                  onPress={handleSaveMemberName}
                  variant="primary"
                  loading={updateMemberMutation.isPending}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Equal-Split Modal (chia đều kể cả khách) */}
      <Modal visible={showEqualSplitModal} animationType="slide" transparent onRequestClose={() => setShowEqualSplitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable onPress={() => {
                  setShowEqualSplitModal(false);
                  setShowSettlementModal(true);
                }}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </Pressable>
                <Text style={styles.modalTitle}>
                  Chia đều{equalSplitResult ? ` • ${equalSplitResult.participantCount} người` : ''}
                </Text>
              </View>
              <Pressable onPress={() => setShowEqualSplitModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {equalSplitResult && equalSplitResult.participantCount > 0 ? (
              <>
                <View style={styles.settlementSummary}>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Tổng chi</Text>
                    <Text style={styles.settlementValue}>
                      {formatCurrency(equalSplitResult.totalSpent, 'VND')}
                    </Text>
                  </View>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Mỗi người</Text>
                    <Text style={styles.settlementValue}>
                      {formatCurrency(equalSplitResult.perPersonShare, 'VND')}
                    </Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  {equalSplitResult.rows.map((row) => {
                    const p = row.participant;
                    const isPositive = row.net > 0;
                    const isNegative = row.net < 0;
                    const netColor = isPositive ? '#34a795' : isNegative ? '#f36e79' : '#8b8b8b';
                    return (
                      <View key={p.id} style={styles.equalSplitRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name={p.isGuest ? 'person-outline' : 'person'}
                            size={18}
                            color={p.isGuest ? '#1f6681' : '#1f1f1f'}
                          />
                          <Text style={styles.equalSplitName}>
                            {p.name}
                            {p.isCurrentUser ? ' (Bạn)' : ''}
                          </Text>
                          {p.isGuest && (
                            <View style={styles.guestBadge}>
                              <Text style={styles.guestBadgeText}>Khách</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.equalSplitInputs}>
                          <View style={styles.equalSplitInputCol}>
                            <Text style={styles.equalSplitInputLabel}>Đã chi</Text>
                            <TextInput
                              style={styles.equalSplitInput}
                              value={paidOverrides[p.id] ?? formatMoneyInput(p.paid)}
                              onChangeText={(text) => setPaidOverrides((prev) => ({ ...prev, [p.id]: text }))}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#8b8b8b"
                            />
                          </View>
                          <View style={styles.equalSplitInputCol}>
                            <Text style={styles.equalSplitInputLabel}>Đã nhận</Text>
                            <TextInput
                              style={styles.equalSplitInput}
                              value={receivedOverrides[p.id] ?? ''}
                              onChangeText={(text) => setReceivedOverrides((prev) => ({ ...prev, [p.id]: text }))}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor="#8b8b8b"
                            />
                          </View>
                        </View>

                        <View style={styles.equalSplitNet}>
                          <Text style={[styles.equalSplitNetText, { color: netColor }]}>
                            {isPositive ? '+' : ''}{formatCurrency(row.net, 'VND')}
                          </Text>
                          <Text style={styles.equalSplitNetSub}>
                            {isPositive ? 'được nhận' : isNegative ? 'phải trả' : 'cân bằng'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {equalSplitResult.transfers.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Lệnh chuyển</Text>
                    <View style={{ gap: 6 }}>
                      {equalSplitResult.transfers.map((t, idx) => (
                        <View key={idx} style={styles.transferRow}>
                          <Text style={styles.transferText}>
                            {t.fromName} → {t.toName}
                          </Text>
                          <Text style={styles.transferAmount}>
                            {formatCurrency(t.amount, 'VND')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={{ marginTop: 12 }}>
                  <Button
                    title="📋 Copy báo cáo"
                    onPress={handleCopyEqualSplitReport}
                    variant="primary"
                  />
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calculator-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  Chưa có dữ liệu để chia đều. Hãy thêm giao dịch trước.
                </Text>
              </View>
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
  youBadge: {
    backgroundColor: '#fff0f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffadd2',
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#eb2f96',
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

  // ==================== Settlement mode cards ====================
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#f0f7f9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8eff3',
  },
  modeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  modeCardSubtitle: {
    fontSize: 13,
    color: '#5f6b75',
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafbfc',
    borderRadius: 10,
  },
  balanceName: {
    fontSize: 14,
    color: '#1f1f1f',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f6681',
  },

  // ==================== Member Management ====================
  memberManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  memberManageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  memberManageEmail: {
    fontSize: 13,
    color: '#5f6b75',
    marginTop: 2,
  },
  memberActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f4',
  },
  guestBadge: {
    backgroundColor: '#eef7f8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b6e3ea',
  },
  guestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f6681',
  },
  helperText: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 12,
  },

  // ==================== Equal-Split ====================
  equalSplitRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    gap: 8,
  },
  equalSplitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  equalSplitInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  equalSplitInputCol: {
    flex: 1,
  },
  equalSplitInputLabel: {
    fontSize: 12,
    color: '#5f6b75',
    marginBottom: 4,
  },
  equalSplitInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f1f1f',
    backgroundColor: '#fff',
  },
  equalSplitNet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  equalSplitNetText: {
    fontSize: 16,
    fontWeight: '700',
  },
  equalSplitNetSub: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  transferText: {
    fontSize: 14,
    color: '#1f1f1f',
  },
  transferAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d48806',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
});