import { useEffect, useMemo, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react-native';
import { CategoryIcon } from '@/components/common';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackButton, Button } from '@/components/common';
import { colors, spacing, typography } from '@/components/common/theme';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { aiBudgetApi } from '@/modules/budget/api/aiBudgetApi';
import { profileStorage } from '@/modules/budget/storage/profileStorage';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

const toIsoDate = (value: Date) => {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, '0');
  const d = `${value.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthEnd = (startIso: string) => {
  const [y, m] = startIso.split('-').map(Number);
  if (!y || !m) {
    return startIso;
  }
  // Last day of the month
  const end = new Date(y, m, 0);
  return toIsoDate(end);
};

export const AiBudgetCreateScreen = () => {
  const router = useRouter();
  const { getWallets } = useWalletUsecases();
  const { getCategories } = useCategoryUsecases();

  const [incomeInput, setIncomeInput] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [showAllWallets, setShowAllWallets] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const didPrefillRef = useRef(false);

  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  // Default period = current month (read-only for MVP)
  const periodStart = useMemo(() => toIsoDate(new Date()), []);
  const periodEnd = useMemo(() => getMonthEnd(periodStart), [periodStart]);

  // Pre-fill income/prompt from local profile (once)
  useEffect(() => {
    if (didPrefillRef.current) {
      return;
    }
    didPrefillRef.current = true;
    (async () => {
      const profile = await profileStorage.get();
      if (profile?.lastIncome) {
        setIncomeInput(formatMoneyInput(String(profile.lastIncome)));
      }
      if (profile?.lastPrompt) {
        setUserPrompt(profile.lastPrompt);
      }
      if (profile?.lastWalletId !== undefined) {
        setSelectedWalletId(profile.lastWalletId);
        setShowAllWallets(profile.lastWalletId == null);
      }
    })();
  }, []);

  // Ensure "Tiết kiệm" exists in user's categories (validator requires it)
  const savingsCategory = useMemo(
    () => categories.find((c) => c.name === 'Tiết kiệm'),
    [categories],
  );

  const handleSubmit = async () => {
    setErrorMessage(null);
    const income = parseMoneyInput(incomeInput);
    if (!Number.isFinite(income) || income <= 0) {
      setErrorMessage('Vui lòng nhập thu nhập lớn hơn 0.');
      return;
    }
    if (!savingsCategory) {
      setErrorMessage('Không tìm thấy danh mục "Tiết kiệm". Vui lòng tạo trước.');
      return;
    }

    setLoading(true);
    try {
      const draft = await aiBudgetApi.generateDraft({
        income,
        userPrompt: userPrompt.trim() || undefined,
        walletId: showAllWallets ? null : selectedWalletId,
        periodStart,
        periodEnd,
      });

      // Persist profile for next time (local only, no server sync)
      await profileStorage.save({
        lastIncome: income,
        lastPrompt: userPrompt.trim(),
        lastWalletId: showAllWallets ? null : selectedWalletId,
        updatedAt: new Date().toISOString(),
      });

      router.push({
        pathname: '/(tabs)/tools/budgets/ai-preview',
        params: { draftId: draft.draftId },
      });
    } catch (err) {
      console.error('AI draft failed', err);
      setErrorMessage('AI tạm thời không khả dụng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools/budgets" />
          <Text style={styles.title}>AI Budget</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Thu nhập thực tế (VND)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={incomeInput}
            placeholder="VD: 20,000,000"
            onChangeText={(v) => setIncomeInput(formatMoneyInput(v))}
          />
          {incomeInput ? (
            <Text style={styles.hint}>= {formatVndAmount(parseMoneyInput(incomeInput) || 0)}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mô tả nhu cầu (tuỳ chọn)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={userPrompt}
            placeholder="VD: Đám cưới 2tr, muốn mua iPhone"
            onChangeText={setUserPrompt}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Thời gian</Text>
          <View style={styles.periodRow}>
            <Text style={styles.periodValue}>{periodStart}</Text>
            <Text style={styles.periodArrow}>→</Text>
            <Text style={styles.periodValue}>{periodEnd}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.walletToggleRow}>
            <Text style={styles.label}>Áp dụng cho tất cả ví</Text>
            <Switch
              value={showAllWallets}
              onValueChange={(v) => {
                setShowAllWallets(v);
                if (v) {
                  setSelectedWalletId(null);
                }
              }}
            />
          </View>
          {!showAllWallets ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.walletRow}
            >
              {wallets.length === 0 ? (
                <View style={styles.walletEmptyChip}>
                  <Text style={styles.walletEmptyText}>Chưa có ví</Text>
                </View>
              ) : (
                wallets.map((w) => {
                  const selected = selectedWalletId === w.walletId;
                  return (
                    <Pressable
                      key={w.walletId}
                      onPress={() => setSelectedWalletId(w.walletId)}
                      style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                    >
                      {(() => {
                        const iconName = ((w as { icon?: string }).icon ?? 'Wallet');
                        return <CategoryIcon icon={iconName} size={16} color={selected ? '#0f8c95' : '#3a464e'} />;
                      })()}
                      <Text
                        style={[
                          styles.walletChipText,
                          selected ? styles.walletChipTextActive : null,
                        ]}
                      >
                        {w.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          ) : (
            <Text style={styles.hint}>Budget sẽ áp dụng cho tất cả ví.</Text>
          )}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Button
          title={loading ? 'Đang gọi AI...' : 'Tạo bằng AI'}
          onPress={handleSubmit}
          disabled={loading}
        />
        <Text style={styles.disclaimer}>
          AI sẽ gợi ý phân bổ dựa trên thu nhập. Bạn có thể chỉnh trước khi lưu.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f9' },
  content: { padding: 16, paddingBottom: 80, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#5d6972' },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1f1f1f',
  },
  textArea: { minHeight: 80, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#7b868d' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodValue: { fontSize: 14, color: '#1f1f1f', fontWeight: '600' },
  periodArrow: { fontSize: 14, color: '#7b868d' },
  walletToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletRow: { gap: 8, paddingTop: 8, paddingBottom: 4 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e2e8',
    backgroundColor: '#fff',
  },
  walletChipActive: { borderColor: '#29bcc8', backgroundColor: '#e9fbfd' },
  walletChipText: { fontSize: 13, color: '#3a464e', fontWeight: '600' },
  walletChipTextActive: { color: '#0f8c95' },
  walletEmptyChip: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#f1f5f8',
  },
  walletEmptyText: { fontSize: 13, color: '#7b868d', fontWeight: '600' },
  error: { color: '#c0392b', fontSize: 13, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#7b868d', textAlign: 'center', marginTop: 8 },
});
