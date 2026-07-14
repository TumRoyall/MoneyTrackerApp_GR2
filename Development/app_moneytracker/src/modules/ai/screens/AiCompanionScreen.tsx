import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UtensilsCrossed, MinusCircle, PieChart, Lightbulb, GraduationCap } from 'lucide-react-native';
// Lucide icons imported for structured preview components
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { useAiUsecases } from '@/modules/ai/usecases';
import { AiActionResponse, AnalyticsSummary, ChatMessageDto, Insight } from '@/modules/ai/models/ai.types';
import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { walletStorage } from '@/core/storage/walletStorage';
import { formatVndAmount } from '@/shared/utils/money';

const serifTitle = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const fallbackSuggestions = [
  'Hôm nay mình đã chi bao nhiêu?',
  'Tuần này mình tiêu gì nhiều nhất?',
  'Mức ngân sách ăn uống còn bao nhiêu?',
  'Thêm giao dịch: ăn phở 45k',
];

const formatPercent = (value?: number) => `${Math.round((value ?? 0) * 100)}%`;

const buildPrimaryInsight = (summary?: AnalyticsSummary, insights?: Insight[]) => {
  if (insights && insights.length > 0) {
    return insights[0].message;
  }
  if (summary && summary.totalExpense > 0) {
    return `Tháng này bạn chi nhiều nhất vào ${summary.topCategoryName}.`;
  }
  return 'Bắt đầu ghi nhận chi tiêu để nhận gợi ý tài chính nhanh hơn.';
};

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

const buildQuickActions = (summary?: AnalyticsSummary, budgetLabel?: string, primaryInsight?: string) => {
  const actions: QuickAction[] = [
    {
      id: 'log',
      label: 'Ghi chi tiêu nhanh',
      hint: 'Ví dụ: cafe 35k',
      icon: 'pencil' as const,
    },
    {
      id: 'spend-top',
      label: 'Tuần này tiêu gì nhiều nhất?',
      hint: 'Tuần này mình tiêu gì nhiều nhất?',
      icon: 'analytics' as const,
    },
  ];

  if (summary && summary.totalExpense > 0) {
    actions.push({
      id: 'summary',
      label: 'Tổng chi tiêu tháng này',
      hint: 'Tổng chi tiêu tháng này là bao nhiêu?',
      icon: 'receipt' as const,
    });
  }

  if (budgetLabel) {
    actions.push({
      id: 'budget',
      label: `Ngân sách ${budgetLabel} còn bao nhiêu?`,
      hint: `Ngân sách ${budgetLabel} còn bao nhiêu?`,
      icon: 'pie-chart' as const,
    });
  }

  if (primaryInsight) {
    actions.push({
      id: 'insight',
      label: 'Có gợi ý gì gần đây?',
      hint: 'Có gợi ý tài chính nào không?',
      icon: 'sparkles' as const,
    });
  }

  return actions.slice(0, 4);
};

const getBudgetRemaining = (budget?: { amountLimit: number; remainingAmount?: number; spentAmount?: number }) => {
  if (!budget) {
    return 0;
  }
  if (typeof budget.remainingAmount === 'number') {
    return budget.remainingAmount;
  }
  return budget.amountLimit - (budget.spentAmount ?? 0);
};

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const signalLabelMap: Record<string, string> = {
  WEEKEND_SPIKE: 'Chi tiêu cuối tuần cao hơn bình thường.',
};

const amountPattern = /(\d+[.,]?\d*)\s*(k|ngan|nghin|tr|trieu|m|million)?/i;

const isLikelyTransaction = (text: string) => amountPattern.test(text);

type NavTarget = {
  route: string;
  label: string;
  keywords: string[];
};

const navTargets: NavTarget[] = [
  { route: '/(tabs)/wallets', label: 'Ví', keywords: ['ví', 'wallet', 'số dư', 'tiền trong ví'] },
  { route: '/(tabs)/transactions', label: 'Giao dịch', keywords: ['giao dịch', 'lịch sử giao dịch', 'transaction'] },
  { route: '/(tabs)/tools/budgets', label: 'Ngân sách', keywords: ['ngân sách', 'budget', 'hạn mức'] },
  { route: '/(tabs)/tools/savings', label: 'Tiết kiệm', keywords: ['tiết kiệm', 'saving', 'mục tiêu'] },
  { route: '/(tabs)/tools/debts', label: 'Món nợ', keywords: ['nợ', 'debt', 'công nợ'] },
  { route: '/(tabs)/settings', label: 'Cài đặt', keywords: ['cài đặt', 'setting'] },
];

const detectNavigationIntent = (text: string): NavTarget | null => {
  const lower = text.toLowerCase();
  for (const target of navTargets) {
    const match = target.keywords.some((kw) => lower.includes(kw));
    if (match) return target;
  }
  return null;
};

type DraftTransaction = {
  amount: number;
  categoryId: string;
  walletId: string;
  note?: string | null;
  date: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
};

let chatCache: ChatMessage[] = [];

export const AiCompanionScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { action, getAnalyticsSummary, getBehaviorSignals, getInsights } = useAiUsecases();
  const { getBudgets } = useBudgetUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();
  const { createTransaction } = useTransactionUsecases();

  const [inputText, setInputText] = useState('');
  const [lastResponse, setLastResponse] = useState<AiActionResponse | null>(null);
  const [draftTransaction, setDraftTransaction] = useState<DraftTransaction | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(chatCache);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [pendingNav, setPendingNav] = useState<NavTarget | null>(null);

  const summaryQuery = useQuery({
    queryKey: ['ai-summary'],
    queryFn: () => getAnalyticsSummary(),
  });

  const insightsQuery = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => getInsights(),
  });

  const signalsQuery = useQuery({
    queryKey: ['ai-signals'],
    queryFn: () => getBehaviorSignals(),
  });

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const summary = summaryQuery.data;
  const insights = insightsQuery.data ?? [];
  const signals = signalsQuery.data ?? [];
  const budgets = budgetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const primaryInsight = useMemo(() => buildPrimaryInsight(summary, insights), [summary, insights]);

  useEffect(() => {
    if (wallets.length === 0) {
      return;
    }
    let active = true;
    const hydrateWallet = async () => {
      const lastWalletId = await walletStorage.getLastWalletId();
      if (!active) {
        return;
      }
      const match = wallets.find((wallet) => wallet.walletId === lastWalletId);
      setSelectedWalletId(match?.walletId ?? wallets[0].walletId);
    };
    hydrateWallet();
    return () => {
      active = false;
    };
  }, [wallets]);

  useEffect(() => {
    if (selectedWalletId) {
      walletStorage.setLastWalletId(selectedWalletId);
    }
  }, [selectedWalletId]);

  useEffect(() => {
    chatCache = chatMessages;
  }, [chatMessages]);

  const budgetHighlight = useMemo(() => {
    if (budgets.length === 0) {
      return null;
    }
    const scored = budgets
      .map((budget) => {
        const remaining = getBudgetRemaining(budget);
        const ratio = budget.amountLimit > 0 ? remaining / budget.amountLimit : 0;
        return { budget, remaining, ratio };
      })
      .sort((a, b) => a.ratio - b.ratio);
    return scored[0];
  }, [budgets]);

  const budgetLabel = useMemo(() => {
    if (!budgetHighlight) {
      return 'Chưa có ngân sách nào.';
    }
    const categoryId = budgetHighlight.budget.categoryId || budgetHighlight.budget.categoryIds?.[0];
    const category = categoryId ? categoryMap.get(categoryId) : null;
    return category?.name || budgetHighlight.budget.title || 'Ngân sách';
  }, [budgetHighlight, categoryMap]);

  const budgetRemaining = budgetHighlight ? budgetHighlight.remaining : 0;
  const budgetRatio = budgetHighlight ? budgetHighlight.ratio : 0;

  const suggestionItems = useMemo(() => {
    if (lastResponse?.meta?.suggestions?.length) {
      return lastResponse.meta.suggestions;
    }
    return fallbackSuggestions;
  }, [lastResponse]);

  const quickActions = useMemo(
    () => buildQuickActions(summary, budgetHighlight ? budgetLabel : undefined, primaryInsight),
    [summary, budgetHighlight, budgetLabel, primaryInsight],
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.walletId === selectedWalletId) ?? null,
    [wallets, selectedWalletId],
  );

  const showWalletSelector = useMemo(() => {
    if (isLikelyTransaction(inputText)) {
      return true;
    }
    return Boolean(draftTransaction) || lastResponse?.intent === 'LOG_TRANSACTION';
  }, [inputText, lastResponse, draftTransaction]);

  const buildWalletAwareText = (text: string) => {
    if (!selectedWallet?.name) {
      return text;
    }
    const lowerText = text.toLowerCase();
    const lowerWallet = selectedWallet.name.toLowerCase();
    if (lowerText.includes(lowerWallet)) {
      return text;
    }
    return `${text} từ ${selectedWallet.name}`;
  };

  const appendMessage = (role: ChatMessage['role'], text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        text: trimmed,
        createdAt: Date.now(),
      },
    ]);
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    const likelyTransaction = isLikelyTransaction(trimmed);
    if (likelyTransaction && !selectedWallet) {
      setSubmitError('Vui lòng chọn ví trước khi ghi nhận.');
      return;
    }

    const navTarget = detectNavigationIntent(trimmed);
    if (navTarget) {
      setPendingNav(navTarget);
      setInputText('');
      return;
    }

    appendMessage('user', trimmed);

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payloadText = likelyTransaction ? buildWalletAwareText(trimmed) : trimmed;
      const history: ChatMessageDto[] = chatMessages.slice(-10).map((msg) => ({
        role: msg.role,
        message: msg.text,
        createdAt: msg.createdAt,
      }));
      const response = await action(payloadText, history);
      setLastResponse(response);
      appendMessage('assistant', response.message);
      if (response.intent === 'LOG_TRANSACTION') {
        const amount = parseNumber(response.structuredResult['amount']);
        const categoryId = response.structuredResult['categoryId'] as string | undefined;
        const walletId = response.structuredResult['walletId'] as string | undefined;
        const note = response.structuredResult['note'] as string | undefined;
        const date = (response.structuredResult['date'] as string | undefined) ?? new Date().toISOString().slice(0, 10);

        if (categoryId && walletId && Number.isFinite(amount)) {
          setDraftTransaction({
            amount,
            categoryId,
            walletId,
            note: note ?? null,
            date,
          });
          setSelectedWalletId(walletId);
        }
      }
      setInputText('');
    } catch (error) {
      setSubmitError('Không thể xử lý yêu cầu lúc này.');
      appendMessage('assistant', 'Mình chưa xử lý được. Bạn thử lại nhé.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDraft = async () => {
    if (!draftTransaction) {
      return;
    }
    if (!draftTransaction.walletId) {
      setSubmitError('Vui lòng chọn ví trước khi ghi nhận.');
      return;
    }
    if (!draftTransaction.categoryId) {
      setSubmitError('Vui lòng chọn danh mục trước khi ghi nhận.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createTransaction({
        walletId: draftTransaction.walletId,
        categoryId: draftTransaction.categoryId,
        amount: draftTransaction.amount,
        note: draftTransaction.note ?? undefined,
        date: draftTransaction.date,
      });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions-all-for-budgets'] });
      setDraftTransaction(null);
    } catch (error) {
      setSubmitError('Không thể lưu giao dịch lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDraft = () => {
    if (!draftTransaction) {
      return;
    }
    router.push({
      pathname: '/(tabs)/transactions',
      params: {
        openCreate: '1',
        draftWalletId: draftTransaction.walletId,
        draftCategoryId: draftTransaction.categoryId,
        draftAmount: String(draftTransaction.amount),
        draftNote: draftTransaction.note ?? '',
        draftDate: draftTransaction.date,
      },
    });
  };

  const renderStructuredPreview = (response: AiActionResponse) => {
    if (response.intent === 'LOG_TRANSACTION') {
      const amount = parseNumber(response.structuredResult['amount']);
      const categoryId = response.structuredResult['categoryId'] as string | undefined;
      const category = categoryId ? categoryMap.get(categoryId) : null;
      return (
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <UtensilsCrossed size={20} color={(category as any)?.color || '#ff6b6b'} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{category?.name || 'Giao dịch mới'}</Text>
            <Text style={styles.previewSubtitle}>{formatVndAmount(amount)}</Text>
            {selectedWallet?.name ? (
              <Text style={styles.previewMeta}>Ví: {selectedWallet.name}</Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (response.intent === 'SPENDING_QUERY') {
      const summaryData = response.structuredResult['summary'] as AnalyticsSummary | undefined;
      if (!summaryData) {
        return null;
      }
      return (
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, styles.previewIconExpense]}>
            <MinusCircle size={18} color="#c94b4b" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{summaryData.topCategoryName}</Text>
            <Text style={styles.previewSubtitle}>{formatVndAmount(summaryData.topCategoryAmount)}</Text>
          </View>
        </View>
      );
    }

    if (response.intent === 'BUDGET_QUERY') {
      const remaining = parseNumber(response.structuredResult['remaining']);
      const categoryId = response.structuredResult['categoryId'] as string | undefined;
      const category = categoryId ? categoryMap.get(categoryId) : null;
      return (
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, styles.previewIconBudget]}>
            <PieChart size={18} color="#256b65" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{category?.name || 'Ngân sách'}</Text>
            <Text style={styles.previewSubtitle}>Còn {formatVndAmount(remaining)}</Text>
          </View>
        </View>
      );
    }

    if (response.intent === 'INSIGHT_REQUEST') {
      const insightsData = response.structuredResult['insights'] as Insight[] | undefined;
      const message = insightsData?.[0]?.message;
      if (!message) {
        return null;
      }
      return (
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, styles.previewIconInsight]}>
            <Lightbulb size={18} color="#7a5c2e" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Gợi ý mới</Text>
            <Text style={styles.previewSubtitle}>{message}</Text>
          </View>
        </View>
      );
    }

    if (response.intent === 'COACHING') {
      const adviceData = response.structuredResult['advice'] as string | undefined;
      if (!adviceData) {
        return null;
      }
      return (
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, { backgroundColor: '#e8f5e9' }]}>
            <GraduationCap size={18} color="#2e7d32" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Lời khuyên tài chính</Text>
            <Text style={styles.previewSubtitle}>{adviceData}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#1b1b1b" />
          </Pressable>
          <Text style={styles.headerTitle}>AI Tài chính</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.mascotWrap}>
            <View style={styles.mascotHalo} />
            <View style={styles.mascotFace}>
              <View style={styles.mascotEyes}>
                <View style={styles.mascotEye} />
                <View style={styles.mascotEye} />
              </View>
              <View style={styles.mascotMouth} />
            </View>
            <View style={styles.mascotBadge}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </View>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Xin chào, bạn nhé</Text>
            <Text style={styles.heroInsight}>{primaryInsight}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Chi tiêu</Text>
                <Text style={styles.metaValue}>{formatVndAmount(summary?.totalExpense ?? 0)}</Text>
              </View>
              <View style={[styles.metaPill, styles.metaPillAlt]}>
                <Text style={styles.metaLabel}>Thu vào</Text>
                <Text style={styles.metaValue}>{formatVndAmount(summary?.totalIncome ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {showWalletSelector ? (
          <View style={styles.cardCompact}>
            <View style={styles.cardCompactHeader}>
              <Text style={styles.cardCompactTitle}>Chọn ví giao dịch</Text>
              {selectedWallet ? <Text style={styles.cardCompactHint}>Mặc định</Text> : null}
            </View>
            {walletsQuery.isLoading ? (
              <Text style={styles.cardLoading}>Đang tải ví...</Text>
            ) : wallets.length === 0 ? (
              <Text style={styles.cardBody}>Bạn chưa có ví nào. Tạo ví trước khi ghi nhận.</Text>
            ) : (
              <View style={styles.walletChipRow}>
                {wallets.map((wallet) => (
                  <Pressable
                    key={wallet.walletId}
                    style={[
                      styles.walletChip,
                      wallet.walletId === selectedWalletId ? styles.walletChipActive : null,
                    ]}
                    onPress={() => {
                      setSelectedWalletId(wallet.walletId);
                      if (draftTransaction) {
                        setDraftTransaction({ ...draftTransaction, walletId: wallet.walletId });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.walletChipText,
                        wallet.walletId === selectedWalletId ? styles.walletChipTextActive : null,
                      ]}
                    >
                      {wallet.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {pendingNav ? (
          <View style={styles.cardCompact}>
            <View style={styles.navSuggestionRow}>
              <View style={styles.navSuggestionIcon}>
                <Ionicons name="navigate" size={18} color="#2c9da5" />
              </View>
              <View style={styles.navSuggestionInfo}>
                <Text style={styles.navSuggestionTitle}>Chuyển đến {pendingNav.label}?</Text>
                <Text style={styles.navSuggestionHint}>Bạn muốn mở tab {pendingNav.label.toLowerCase()}?</Text>
              </View>
            </View>
            <View style={styles.draftActions}>
              <Pressable style={styles.draftGhostButton} onPress={() => setPendingNav(null)}>
                <Text style={styles.draftGhostButtonText}>Ở lại</Text>
              </Pressable>
              <Pressable
                style={styles.draftPrimaryButton}
                onPress={() => {
                  router.push(pendingNav.route as any);
                  setPendingNav(null);
                }}
              >
                <Text style={styles.draftPrimaryButtonText}>Chuyển đến</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {chatMessages.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Gợi ý nhanh</Text>
              <Text style={styles.cardHint}>Chạm để hỏi</Text>
            </View>
            <View style={styles.chipRow}>
              {suggestionItems.map((item) => (
                <Pressable key={item} style={styles.chip} onPress={() => handleSend(item)}>
                  <Text style={styles.chipText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Trò chuyện</Text>
            <Text style={styles.cardHint}>{chatMessages.length} tin nhắn</Text>
          </View>
          {chatMessages.length === 0 ? (
            <Text style={styles.cardBody}>Hỏi mình điều gì về chi tiêu hoặc ngân sách nhé.</Text>
          ) : (
            <View style={styles.chatList}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.chatRow, msg.role === 'user' ? styles.chatRowUser : null]}
                >
                  <View
                    style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : null]}
                  >
                    <Text
                      style={[styles.chatBubbleText, msg.role === 'user' ? styles.chatBubbleTextUser : null]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}
              {draftTransaction ? (
                <View style={styles.chatRow}>
                  <View style={styles.chatDraftBubble}>
                    <Text style={styles.chatDraftTitle}>Bạn vừa tạo một bản nháp giao dịch</Text>
                    <View style={styles.previewRow}> 
                      <View style={styles.previewIcon}>
                        <Text style={styles.previewIconText}>
                          {categoryMap.get(draftTransaction.categoryId)?.icon || '🍜'}
                        </Text>
                      </View>
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewTitle}>
                          {categoryMap.get(draftTransaction.categoryId)?.name || 'Giao dịch'}
                        </Text>
                        <Text style={styles.previewSubtitle}>{formatVndAmount(draftTransaction.amount)}</Text>
                        <Text style={styles.previewMeta}>
                          Ví: {wallets.find((wallet) => wallet.walletId === draftTransaction.walletId)?.name || 'Chưa chọn'}
                        </Text>
                        {draftTransaction.note ? (
                          <Text style={styles.previewMeta}>Ghi chú: {draftTransaction.note}</Text>
                        ) : null}
                        <Text style={styles.previewMeta}>Ngày: {draftTransaction.date}</Text>
                      </View>
                    </View>
                    <View style={styles.draftActions}>
                      <Pressable style={styles.draftGhostButton} onPress={openEditDraft}>
                        <Text style={styles.draftGhostButtonText}>Chỉnh sửa</Text>
                      </Pressable>
                      <Pressable style={styles.draftPrimaryButton} onPress={confirmDraft}>
                        <Text style={styles.draftPrimaryButtonText}>Xác nhận</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {chatMessages.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Lệnh nhanh tài chính</Text>
            </View>
            <View style={styles.actionRow}>
              {quickActions.map((actionItem) => (
                <Pressable
                  key={actionItem.id}
                  style={styles.actionCard}
                  onPress={() => {
                    setInputText(actionItem.hint);
                  }}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name={actionItem.icon} size={18} color="#1f1f1f" />
                  </View>
                  <Text style={styles.actionLabel}>{actionItem.label}</Text>
                  <Text style={styles.actionHint}>{actionItem.hint}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {suggestionItems.length > 0 ? (
        <View style={styles.suggestionBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionBarContent}>
            {suggestionItems.map((item) => (
              <Pressable
                key={item}
                style={styles.suggestionChip}
                onPress={() => setInputText(item)}
              >
                <Text style={styles.suggestionChipText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <View style={styles.inputFieldWrap}>
          <TextInput
            style={styles.inputField}
            placeholder="Nhập chi tiêu hoặc hỏi về tài chính..."
            placeholderTextColor="#9aa4ac"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>
        <Pressable
          style={[styles.sendButton, isSubmitting ? styles.sendButtonDisabled : null]}
          onPress={() => handleSend(inputText)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f5f2',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#f3d9c9',
    opacity: 0.55,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#cbeaf0',
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 190,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1b1b',
    fontFamily: serifTitle,
  },
  headerSpacer: {
    width: 36,
  },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efe6dc',
    alignItems: 'center',
  },
  mascotWrap: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHalo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f7e4d6',
  },
  mascotFace: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d1d1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEyes: {
    flexDirection: 'row',
    gap: 6,
  },
  mascotEye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f25c54',
  },
  mascotMouth: {
    marginTop: 6,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fef3c7',
  },
  mascotBadge: {
    position: 'absolute',
    right: 2,
    top: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2c9da5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    fontFamily: serifTitle,
  },
  heroInsight: {
    fontSize: 14,
    color: '#3c3c3c',
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f2f6f7',
  },
  metaPillAlt: {
    backgroundColor: '#f8efe8',
  },
  metaLabel: {
    fontSize: 11,
    color: '#6a6a6a',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efe6dc',
    gap: 10,
  },
  cardCompact: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#efe6dc',
    gap: 8,
  },
  cardCompactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCompactTitle: {
    fontSize: 12,
    color: '#7a7a7a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardCompactHint: {
    fontSize: 11,
    color: '#9b9b9b',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
    fontFamily: serifTitle,
  },
  cardHint: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  cardBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cardLoading: {
    fontSize: 13,
    color: '#8b8b8b',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c9da5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
    gap: 4,
  },
  budgetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  budgetSubtitle: {
    fontSize: 12,
    color: '#6b6b6b',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f0ed',
  },
  chipText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  recentBody: {
    gap: 10,
  },
  recentMessage: {
    fontSize: 14,
    color: '#2a2a2a',
    lineHeight: 20,
  },
  chatList: {
    gap: 8,
  },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  chatRowUser: {
    justifyContent: 'flex-end',
  },
  chatBubble: {
    maxWidth: '86%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f2efe9',
  },
  chatBubbleUser: {
    backgroundColor: '#2c9da5',
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2c2c2c',
  },
  chatBubbleTextUser: {
    color: '#fff',
  },
  chatDraftBubble: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#f8f5f1',
    borderWidth: 1,
    borderColor: '#efe6dc',
    gap: 10,
  },
  chatDraftTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2a2a2a',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f6f2ee',
  },
  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIconExpense: {
    backgroundColor: '#ffeaea',
  },
  previewIconBudget: {
    backgroundColor: '#e2f5f2',
  },
  previewIconInsight: {
    backgroundColor: '#fff4d8',
  },
  previewIconText: {
    fontSize: 16,
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#6f6f6f',
  },
  previewMeta: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  draftActions: {
    flexDirection: 'row',
    gap: 10,
  },
  draftGhostButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8cfc7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftGhostButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4a4a4a',
  },
  draftPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#2c9da5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftPrimaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#1d1d1f',
  },
  metaBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  metaInline: {
    fontSize: 12,
    color: '#6a6a6a',
  },
  navSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navSuggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2f5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSuggestionInfo: {
    flex: 1,
    gap: 2,
  },
  navSuggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  navSuggestionHint: {
    fontSize: 12,
    color: '#6b6b6b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  walletChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#eadfd4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  walletChipActive: {
    backgroundColor: '#e2f5f2',
    borderColor: '#2c9da5',
  },
  walletChipText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  walletChipTextActive: {
    color: '#1f6b68',
  },
  actionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f4f2ef',
    gap: 6,
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  actionHint: {
    fontSize: 11,
    color: '#6b6b6b',
  },
  suggestionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
    maxHeight: 44,
  },
  suggestionBarContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  inputBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputFieldWrap: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  inputField: {
    minHeight: 42,
    fontSize: 14,
    color: '#1f1f1f',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#2c9da5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
  errorText: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 86,
    fontSize: 12,
    color: '#c94b4b',
    textAlign: 'center',
  },
});
