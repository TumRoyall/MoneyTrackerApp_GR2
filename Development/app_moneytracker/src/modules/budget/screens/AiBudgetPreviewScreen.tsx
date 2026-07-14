import { useEffect, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react-native';
import { CategoryIcon } from '@/components/common';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
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
import { aiBudgetApi, AiBudgetDraftResponse } from '@/modules/budget/api/aiBudgetApi';
import { PercentAdjusterRow } from '@/modules/budget/components/PercentAdjusterRow';
import { usePercentSum, PercentItem } from '@/modules/budget/hooks/usePercentSum';
import { profileStorage } from '@/modules/budget/storage/profileStorage';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

interface PreviewItem {
  categoryId: string;
  categoryName: string;
  icon: string | null;
  color: string | null;
  aiReasoning: string | null;
}

export const AiBudgetPreviewScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ draftId?: string }>();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [draft, setDraft] = useState<AiBudgetDraftResponse | null>(null);
  const [incomeInput, setIncomeInput] = useState('');
  const [showAllWallets, setShowAllWallets] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets });
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

  // Load draft from local profile + re-call AI (only on first mount, ref guard via state)
  useEffect(() => {
    (async () => {
      try {
        const profile = await profileStorage.get();
        const income = profile?.lastIncome ?? 0;
        const periodStart = new Date().toISOString().slice(0, 10);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        const periodEnd = endDate.toISOString().slice(0, 10);

        if (income > 0) {
          setIncomeInput(formatMoneyInput(String(income)));
        }
        if (profile?.lastWalletId != null) {
          setSelectedWalletId(profile.lastWalletId);
          setShowAllWallets(false);
        }

        const fetched = await aiBudgetApi.generateDraft({
          income,
          userPrompt: profile?.lastPrompt,
          walletId: profile?.lastWalletId ?? null,
          periodStart,
          periodEnd,
        });
        setDraft(fetched);
      } catch (err) {
        console.error('Failed to load draft', err);
        setErrorMessage('KhÃ´ng táº£i Ä‘Æ°á»£c báº£n nhÃ¡p. Vui lÃ²ng thá»­ láº¡i.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Map categoryId â†’ metadata for icons
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.categoryId, c])),
    [categories],
  );

  // Build percent items (source of truth: usePercentSum)
  const percentItems: PercentItem[] = useMemo(
    () => draft?.items.map((i) => ({ id: i.categoryId, percent: i.percent })) ?? [],
    [draft?.items],
  );
  const income = parseMoneyInput(incomeInput) || 0;
  const percentSum = usePercentSum(percentItems, income);

  // Enrich items with icon/color for rendering
  const enrichedItems: PreviewItem[] = useMemo(() => {
    if (!draft) {
      return [];
    }
    return draft.items.map((it) => {
      const c = categoryMap.get(it.categoryId);
      return {
        categoryId: it.categoryId,
        categoryName: it.categoryName,
        icon: (c as { icon?: string } | undefined)?.icon ?? null,
        color: (c as { color?: string } | undefined)?.color ?? null,
        aiReasoning: it.aiReasoning ?? null,
      };
    });
  }, [draft, categoryMap]);

  const handleConfirm = async () => {
    if (!draft) {
      return;
    }
    if (percentSum.sum !== 100) {
      Alert.alert(
        'Tá»•ng chÆ°a Ä‘Ãºng',
        `Tá»•ng percent hiá»‡n táº¡i = ${percentSum.sum}%. Vui lÃ²ng chá»‰nh vá» 100.`,
      );
      return;
    }
    if (income <= 0) {
      Alert.alert('Thu nháº­p khÃ´ng há»£p lá»‡', 'Vui lÃ²ng nháº­p thu nháº­p lá»›n hÆ¡n 0.');
      return;
    }

    setSaving(true);
    try {
      const itemsWithAmount = draft.items.map((it, idx) => ({
        categoryId: it.categoryId,
        percent: percentSum.items[idx]?.percent ?? it.percent,
        amount: percentSum.amounts[idx] ?? 0,
        aiReasoning: it.aiReasoning,
      }));

      const _startDate = new Date().toISOString().slice(0, 10);
      const _endDate = new Date();
      _endDate.setMonth(_endDate.getMonth() + 1);
      _endDate.setDate(_endDate.getDate() - 1);
      const _endDateStr = _endDate.toISOString().slice(0, 10);
      await aiBudgetApi.batchCreate({
        draftId: draft.draftId,
        walletId: showAllWallets ? null : selectedWalletId,
        periodStart: _startDate,
        periodEnd: _endDateStr,
        periodType: 'monthly',
        income,
        items: itemsWithAmount,
      });

      Alert.alert('ThÃ nh cÃ´ng', 'ÄÃ£ táº¡o ngÃ¢n sÃ¡ch AI.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/tools/budgets') },
      ]);
    } catch (err) {
      console.error('Batch create failed', err);
      Alert.alert('Lá»—i', 'KhÃ´ng thá»ƒ lÆ°u ngÃ¢n sÃ¡ch. Vui lÃ²ng thá»­ láº¡i.');
    } finally {
      setSaving(false);
    }
  };

  if (errorMessage) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Button title="Quay láº¡i" onPress={() => router.back()} />
      </View>
    );
  }

  if (loading || !draft) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color="#29bcc8" />
        <Text style={styles.loadingText}>Äang táº£i báº£n nhÃ¡p...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools/budgets/ai-create" />
          <Text style={styles.title}>AI Budget Draft</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>ðŸ’° Tá»•ng thu nháº­p</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={incomeInput}
            onChangeText={(v) => setIncomeInput(formatMoneyInput(v))}
          />
          <Text style={styles.hint}>= {formatVndAmount(income)}</Text>
        </View>

        {draft.summary.strategy ? (
          <View style={styles.strategyCard}>
            <Text style={styles.strategyLabel}>Chiáº¿n lÆ°á»£c</Text>
            <Text style={styles.strategyText}>{draft.summary.strategy}</Text>
          </View>
        ) : null}

        <View style={styles.itemsList}>
          {enrichedItems.map((item, idx) => {
            const isLast = idx === enrichedItems.length - 1;
            return (
              <PercentAdjusterRow
                key={item.categoryId}
                categoryIcon={item.icon ?? 'cash'}
                categoryName={item.categoryName}
                percent={percentSum.items[idx]?.percent ?? 0}
                amount={percentSum.amounts[idx] ?? 0}
                aiReasoning={item.aiReasoning}
                disabled={isLast}
                onChange={(next) => percentSum.updatePercent(item.categoryId, next)}
              />
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tá»•ng:</Text>
          <Text
            style={[
              styles.totalValue,
              percentSum.sum !== 100 ? styles.totalValueWarn : null,
            ]}
          >
            {percentSum.sum}% = {formatVndAmount(income)}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.walletToggleRow}>
            <Text style={styles.cardLabel}>Ãp dá»¥ng cho táº¥t cáº£ vÃ­</Text>
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
              {wallets.map((w) => {
                const selected = selectedWalletId === w.walletId;
                return (
                  <Pressable
                    key={w.walletId}
                    onPress={() => setSelectedWalletId(w.walletId)}
                    style={[
                      styles.walletChip,
                      selected ? styles.walletChipActive : null,
                    ]}
                  >
                    {(() => {
                      const iconName = ((w as { icon?: string }).icon ?? 'Wallet');
                      return <CategoryIcon icon={iconName} size={14} color={selected ? '#0f8c95' : '#3a464e'} />;
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
              })}
            </ScrollView>
          ) : null}
        </View>

        <Button
          title={saving ? 'Äang lÆ°u...' : 'XÃ¡c nháº­n & Táº¡o budget'}
          onPress={handleConfirm}
          disabled={saving}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f9' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#5d6972' },
  errorText: { color: '#c0392b', padding: 16, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 80, gap: 12 },
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
  card: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6ecef',
    gap: 6,
  },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#5d6972' },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1f1f1f',
  },
  hint: { fontSize: 12, color: '#7b868d' },
  strategyCard: {
    padding: 12,
    backgroundColor: '#f3fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9f0f2',
    gap: 4,
  },
  strategyLabel: { fontSize: 12, fontWeight: '700', color: '#0f8c95' },
  strategyText: { fontSize: 13, color: '#1f1f1f' },
  itemsList: { gap: 10 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#e9fbfd',
    borderRadius: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#5d6972' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#0f8c95' },
  totalValueWarn: { color: '#c0392b' },
  walletToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletRow: { gap: 8, paddingTop: 8 },
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
});
