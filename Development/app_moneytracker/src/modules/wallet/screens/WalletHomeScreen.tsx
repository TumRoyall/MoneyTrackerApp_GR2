import { useMemo, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

import { Wallet, WalletCreateInput, WalletType } from '@/modules/wallet/models/wallet.types';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, parseMoneyInput, formatVndAmount } from '@/shared/utils/money';

const walletTypeOptions: Array<{ label: string; value: WalletType }> = [
  { label: 'Thường', value: 'REGULAR' },
  { label: 'Tiền mặt', value: 'CASH' },
  { label: 'Tiết kiệm', value: 'SAVING' },
  { label: 'Nợ', value: 'DEBT' },
  { label: 'Đầu tư', value: 'INVEST' },
  { label: 'Sự kiện', value: 'EVENT' },
];

const currencyOptions = ['VND', 'USD', 'EUR'];

  const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return formatVndAmount(amount);
  }
};

const walletTypeLabel = (type: string) => {
  const option = walletTypeOptions.find((item) => item.value === type);
  return option?.label ?? type;
};

export const WalletHomeScreen = () => {
  const { getWallets, createWallet } = useWalletUsecases();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('REGULAR');
  const [currency, setCurrency] = useState('VND');
  const [balance, setBalance] = useState('0');
  const [description, setDescription] = useState('');

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const wallets = walletsQuery.data ?? [];
  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + (wallet.currentBalance ?? 0), 0),
    [wallets],
  );

  const walletDistribution = useMemo(() => {
    const colors = ['#8BC3ED', '#58C9D2', '#F6C04B', '#EF7D83', '#A98FF0'];
    const total = wallets.reduce((sum, wallet) => sum + Math.max(wallet.currentBalance ?? 0, 0), 0);

    return wallets
      .slice()
      .sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0))
      .slice(0, 5)
      .map((wallet, index) => {
        const value = Math.max(wallet.currentBalance ?? 0, 0);
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return {
          wallet,
          value,
          percentage,
          color: colors[index % colors.length],
        };
      });
  }, [wallets]);

  const createWalletHandler = async () => {
    const payload: WalletCreateInput = {
      name: walletName.trim(),
      type: walletType,
      currency: currency.trim().toUpperCase() || 'VND',
      currentBalance: parseMoneyInput(balance),
      description: description.trim() || null,
    };

    if (!payload.name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví.');
      return;
    }

    try {
      await createWallet(payload);
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setWalletName('');
      setWalletType('REGULAR');
      setCurrency('VND');
      setBalance('0');
      setDescription('');
      setShowCreateModal(false);
      Alert.alert('Thành công', 'Đã tạo ví mới.');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo ví. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={[styles.quickCard, styles.milestoneCard]}>
            <Text style={styles.quickCardText}>Những cột mốc</Text>
          </View>
          <View style={[styles.quickCard, styles.analysisCard]}>
            <Text style={styles.quickCardText}>Phân tích thêm</Text>
          </View>
        </View>

        <View style={styles.botWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Chào bạn! 👋</Text>
          </View>
          <View style={styles.botCircle}>
            <Ionicons name="sparkles" size={34} color="#4c88ff" />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Tổng số dư</Text>
            <Text style={styles.balanceValue}>{formatCurrency(totalBalance, 'VND')}</Text>
          </View>
          <View style={styles.balanceIcon}>
            <MaterialIcons name="account-balance-wallet" size={28} color="#1f6681" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ví của bạn</Text>
          <View style={styles.sectionActions}>
            <Text style={styles.sectionSubtitle}>{wallets.length} ví</Text>
            <Pressable onPress={() => setShowCreateModal(true)} style={styles.inlineCreateBtn}>
              <Text style={styles.inlineCreateBtnText}>Tạo ví</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cơ cấu số dư theo ví</Text>
          {walletDistribution.length === 0 ? (
            <Text style={styles.chartEmpty}>Chưa có dữ liệu để hiển thị biểu đồ.</Text>
          ) : (
            walletDistribution.map((item) => (
              <View key={item.wallet.walletId} style={styles.chartRow}>
                <View style={[styles.chartDot, { backgroundColor: item.color }]} />
                <Text style={styles.chartWalletName} numberOfLines={1}>
                  {item.wallet.name}
                </Text>
                <Text style={styles.chartPercent}>{item.percentage.toFixed(0)}%</Text>
                <Text style={styles.chartAmount}>{formatCurrency(item.value, item.wallet.currency || 'VND')}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Xu hướng số dư ví</Text>
          {walletDistribution.length === 0 ? (
            <Text style={styles.chartEmpty}>Chưa có dữ liệu để hiển thị biểu đồ.</Text>
          ) : (
            <View style={styles.trendWrap}>
              {walletDistribution.map((item) => (
                <View key={`trend-${item.wallet.walletId}`} style={styles.trendItem}>
                  <View style={styles.trendTrack}>
                    <View
                      style={[
                        styles.trendFill,
                        {
                          height: `${Math.max(item.percentage, 6)}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendLabel} numberOfLines={1}>
                    {item.wallet.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {walletsQuery.isLoading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Đang tải ví...</Text>
          </View>
        ) : wallets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có ví nào</Text>
            <Text style={styles.emptyText}>Hãy tạo ví đầu tiên của bạn bên dưới.</Text>
          </View>
        ) : (
          wallets.map((wallet) => <WalletItem key={wallet.walletId} wallet={wallet} />)
        )}

      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={36} color="#fff" />
      </Pressable>

      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.createTitle}>Tạo ví mới</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tên ví"
              placeholderTextColor="#8b8b8b"
              value={walletName}
              onChangeText={setWalletName}
            />

            <View style={styles.pillWrap}>
              {walletTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setWalletType(option.value)}
                  style={[styles.pill, walletType === option.value ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, walletType === option.value ? styles.pillTextActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Số dư ban đầu"
                placeholderTextColor="#8b8b8b"
                value={balance}
                onChangeText={(text) => setBalance(formatMoneyInput(text))}
                keyboardType="numeric"
              />
              <View style={[styles.currencyBox, styles.rowInput]}>
                {currencyOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[styles.currencyChip, currency === item ? styles.currencyChipActive : null]}
                  >
                    <Text style={[styles.currencyChipText, currency === item ? styles.currencyChipTextActive : null]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Mô tả"
              placeholderTextColor="#8b8b8b"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Pressable
              onPress={createWalletHandler}
              style={({ pressed }) => [styles.createButton, pressed ? styles.createButtonPressed : null]}
            >
              <Text style={styles.createButtonText}>Tạo ví</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const WalletItem = ({ wallet }: { wallet: Wallet }) => {
  return (
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View>
          <Text style={styles.walletName}>{wallet.name}</Text>
          <Text style={styles.walletType}>{walletTypeLabel(wallet.type)}</Text>
        </View>
        <MaterialIcons name="account-balance-wallet" size={22} color="#1f6681" />
      </View>

      <Text style={styles.walletAmount}>{formatCurrency(wallet.currentBalance ?? 0, wallet.currency || 'VND')}</Text>

      <View style={styles.walletFooter}>
        <Text style={styles.walletCurrency}>{wallet.currency}</Text>
        <Text style={styles.walletDescription} numberOfLines={1}>
          {wallet.description || 'Không có mô tả'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  milestoneCard: {
    backgroundColor: '#f6c04b',
  },
  analysisCard: {
    backgroundColor: '#d8f2f5',
  },
  quickCardText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  botWrap: {
    alignItems: 'center',
    gap: 6,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  bubbleText: {
    fontSize: 16,
    color: '#333',
  },
  botCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  balanceCard: {
    borderRadius: 24,
    backgroundColor: '#d8f5f8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#4c676b',
  },
  balanceValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: '#1b2a2d',
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  inlineCreateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#29bcc8',
  },
  inlineCreateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28333b',
  },
  chartEmpty: {
    fontSize: 13,
    color: '#6f7478',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  chartWalletName: {
    flex: 1,
    fontSize: 13,
    color: '#2f3a42',
  },
  chartPercent: {
    width: 46,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#2f3a42',
  },
  chartAmount: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    color: '#5c6872',
  },
  trendWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 160,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  trendTrack: {
    width: 22,
    height: 120,
    borderRadius: 99,
    backgroundColor: '#edf1f4',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendFill: {
    width: '100%',
    borderRadius: 99,
  },
  trendLabel: {
    fontSize: 11,
    color: '#64707a',
  },
  loadingCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  walletCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  walletType: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b6f74',
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f6681',
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  walletCurrency: {
    fontSize: 13,
    color: '#5f7c84',
    fontWeight: '700',
  },
  walletDescription: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: '#6f6f6f',
  },
  createCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  createTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  descriptionInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eef1f5',
  },
  pillActive: {
    backgroundColor: '#58c9d2',
  },
  pillText: {
    fontSize: 13,
    color: '#3f4950',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  currencyBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8dde3',
    backgroundColor: '#fff',
  },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eef1f5',
  },
  currencyChipActive: {
    backgroundColor: '#58c9d2',
  },
  currencyChipText: {
    fontSize: 12,
    color: '#3f4950',
    fontWeight: '700',
  },
  currencyChipTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#29bcc8',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2c6389',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 9,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});