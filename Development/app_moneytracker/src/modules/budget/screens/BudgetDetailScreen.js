"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetDetailScreen = void 0;
var react_1 = require("react");
var vector_icons_1 = require("@expo/vector-icons");
var react_query_1 = require("@tanstack/react-query");
var react_native_1 = require("react-native");
var expo_router_1 = require("expo-router");
var usecases_1 = require("@/modules/budget/usecases");
var usecases_2 = require("@/modules/category/usecases");
var usecases_3 = require("@/modules/transaction/usecases");
var usecases_4 = require("@/modules/wallet/usecases");
var money_1 = require("@/shared/utils/money");
var formatDateVi = function (isoDate) {
    var _a = isoDate.split('-').map(Number), year = _a[0], month = _a[1], day = _a[2];
    if (!year || !month || !day) {
        return isoDate;
    }
    return "".concat(day, " thg ").concat(month, ", ").concat(year);
};
var BudgetDetailScreen = function () {
    var _a, _b, _c;
    var router = (0, expo_router_1.useRouter)();
    var params = (0, expo_router_1.useLocalSearchParams)();
    var budgetId = params.budgetId || '';
    var getBudget = (0, usecases_1.useBudgetUsecases)().getBudget;
    var getCategories = (0, usecases_2.useCategoryUsecases)().getCategories;
    var getWallets = (0, usecases_4.useWalletUsecases)().getWallets;
    var getTransactions = (0, usecases_3.useTransactionUsecases)().getTransactions;
    var budgetQuery = (0, react_query_1.useQuery)({
        queryKey: ['budget', budgetId],
        queryFn: function () { return getBudget(budgetId); },
        enabled: Boolean(budgetId),
    });
    var categoriesQuery = (0, react_query_1.useQuery)({
        queryKey: ['categories'],
        queryFn: getCategories,
    });
    var walletsQuery = (0, react_query_1.useQuery)({
        queryKey: ['wallets'],
        queryFn: getWallets,
    });
    var budget = budgetQuery.data;
    var categories = (_a = categoriesQuery.data) !== null && _a !== void 0 ? _a : [];
    var wallets = (_b = walletsQuery.data) !== null && _b !== void 0 ? _b : [];
    var category = (0, react_1.useMemo)(function () { return categories.find(function (item) { return item.categoryId === (budget === null || budget === void 0 ? void 0 : budget.categoryId); }); }, [categories, budget === null || budget === void 0 ? void 0 : budget.categoryId]);
    var wallet = (0, react_1.useMemo)(function () { return wallets.find(function (item) { return item.walletId === (budget === null || budget === void 0 ? void 0 : budget.walletId); }); }, [wallets, budget === null || budget === void 0 ? void 0 : budget.walletId]);
    var transactionsQuery = (0, react_query_1.useQuery)({
        queryKey: ['budget-transactions', budget === null || budget === void 0 ? void 0 : budget.budgetId],
        queryFn: function () {
            var _a, _b;
            return getTransactions({
                walletId: (_a = budget === null || budget === void 0 ? void 0 : budget.walletId) !== null && _a !== void 0 ? _a : undefined,
                categoryId: (_b = budget === null || budget === void 0 ? void 0 : budget.categoryId) !== null && _b !== void 0 ? _b : undefined,
                fromDate: budget === null || budget === void 0 ? void 0 : budget.periodStart,
                toDate: budget === null || budget === void 0 ? void 0 : budget.periodEnd,
                type: 'EXPENSE',
                page: 0,
                size: 200,
                sort: 'date,desc',
            });
        },
        enabled: Boolean((budget === null || budget === void 0 ? void 0 : budget.walletId) && (budget === null || budget === void 0 ? void 0 : budget.categoryId)),
    });
    var transactions = (_c = transactionsQuery.data) !== null && _c !== void 0 ? _c : [];
    var spentAmount = (0, react_1.useMemo)(function () {
        if ((budget === null || budget === void 0 ? void 0 : budget.spentAmount) != null) {
            return budget.spentAmount;
        }
        return transactions.reduce(function (sum, item) { return sum + item.amount; }, 0);
    }, [budget === null || budget === void 0 ? void 0 : budget.spentAmount, transactions]);
    var remainingAmount = budget ? budget.amountLimit - spentAmount : 0;
    var percent = budget && budget.amountLimit > 0 ? Math.min((spentAmount / budget.amountLimit) * 100, 100) : 0;
    return (<react_native_1.View style={styles.screen}>
      <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.Pressable style={styles.backBtn} onPress={function () { return router.back(); }}>
            <vector_icons_1.Ionicons name="chevron-back" size={24} color="#1f1f1f"/>
          </react_native_1.Pressable>
          <react_native_1.Text style={styles.title}>{(category === null || category === void 0 ? void 0 : category.name) || 'Ngân sách'}</react_native_1.Text>
          {budget ? (<react_native_1.Pressable style={styles.editButton} onPress={function () {
                return router.push({
                    pathname: '/(tabs)/budgets/[budgetId]/edit',
                    params: { budgetId: budgetId },
                });
            }}>
              <vector_icons_1.Ionicons name="pencil" size={20} color="#1f1f1f"/>
            </react_native_1.Pressable>) : (<react_native_1.View style={{ width: 24 }}/>)}
        </react_native_1.View>

        {budgetQuery.isLoading ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyText}>Đang tải ngân sách...</react_native_1.Text>
          </react_native_1.View>) : !budget ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyText}>Không tìm thấy ngân sách.</react_native_1.Text>
          </react_native_1.View>) : (<react_native_1.View style={styles.summaryCard}>
            <react_native_1.View style={styles.categoryChip}>
              <react_native_1.Text style={styles.categoryChipIcon}>{(category === null || category === void 0 ? void 0 : category.icon) || '💸'}</react_native_1.Text>
              <react_native_1.Text style={styles.categoryChipText}>{(category === null || category === void 0 ? void 0 : category.name) || 'Danh mục'}</react_native_1.Text>
            </react_native_1.View>
            {wallet ? <react_native_1.Text style={styles.walletName}>{wallet.name}</react_native_1.Text> : null}

            <react_native_1.Text style={styles.summaryText}>
              {(0, money_1.formatVndAmount)(spentAmount)} / {(0, money_1.formatVndAmount)(budget.amountLimit)}
            </react_native_1.Text>
            <react_native_1.Text style={styles.percentText}>{Math.round(percent)}%</react_native_1.Text>

            <react_native_1.View style={styles.progressTrack}>
              <react_native_1.View style={[styles.progressFill, { width: "".concat(percent, "%") }]}/>
            </react_native_1.View>

            <react_native_1.View style={styles.footerRow}>
              <react_native_1.Text style={styles.footerText}>{formatDateVi(budget.periodStart)}</react_native_1.Text>
              <react_native_1.Text style={styles.footerText}>{formatDateVi(budget.periodEnd)}</react_native_1.Text>
            </react_native_1.View>

            <react_native_1.Text style={styles.remainingText}>Còn lại {(0, money_1.formatVndAmount)(remainingAmount)}</react_native_1.Text>
          </react_native_1.View>)}

        <react_native_1.Text style={styles.sectionTitle}>Giao dịch trong kỳ</react_native_1.Text>

        {transactionsQuery.isLoading ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyText}>Đang tải giao dịch...</react_native_1.Text>
          </react_native_1.View>) : transactions.length === 0 ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyText}>Chưa có giao dịch trong kỳ này.</react_native_1.Text>
          </react_native_1.View>) : (transactions.map(function (item) { return (<react_native_1.View key={item.transactionId} style={styles.transactionRow}>
              <react_native_1.Text style={styles.transactionDate}>{formatDateVi(item.date)}</react_native_1.Text>
              <react_native_1.View style={styles.transactionInfoRow}>
                <react_native_1.Text style={styles.transactionNote}>{item.note || (category === null || category === void 0 ? void 0 : category.name) || 'Chi tiêu'}</react_native_1.Text>
                <react_native_1.Text style={styles.transactionAmount}>- {(0, money_1.formatVndAmount)(item.amount)}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>); }))}
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
exports.BudgetDetailScreen = BudgetDetailScreen;
var styles = react_native_1.StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f7f9',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    backBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1f1f1f',
    },
    summaryCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#14b8c4',
        backgroundColor: '#fff',
        padding: 16,
        gap: 10,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        minHeight: 42,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#f1f5f8',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    categoryChipIcon: {
        fontSize: 20,
    },
    categoryChipText: {
        fontSize: 18,
        color: '#2a333a',
        fontWeight: '700',
    },
    walletName: {
        fontSize: 14,
        color: '#5b6770',
        fontWeight: '600',
    },
    summaryText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    percentText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#129f8a',
    },
    progressTrack: {
        height: 10,
        borderRadius: 999,
        backgroundColor: '#e8edf0',
        overflow: 'hidden',
    },
    progressFill: {
        height: 10,
        backgroundColor: '#29bcc8',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 13,
        color: '#667179',
    },
    remainingText: {
        fontSize: 14,
        color: '#4b5963',
        fontWeight: '600',
    },
    sectionTitle: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    emptyCard: {
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e6ecef',
        padding: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#667179',
    },
    transactionRow: {
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#edf1f5',
        padding: 14,
        gap: 8,
    },
    transactionDate: {
        fontSize: 13,
        color: '#7b868d',
    },
    transactionInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    transactionNote: {
        fontSize: 15,
        color: '#1f1f1f',
        fontWeight: '600',
        flex: 1,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#e35d5d',
    },
});
