"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetToolScreen = void 0;
var react_1 = require("react");
var vector_icons_1 = require("@expo/vector-icons");
var react_query_1 = require("@tanstack/react-query");
var react_native_1 = require("react-native");
var expo_router_1 = require("expo-router");
var usecases_1 = require("@/modules/budget/usecases");
var usecases_2 = require("@/modules/category/usecases");
var usecases_3 = require("@/modules/wallet/usecases");
var money_1 = require("@/shared/utils/money");
var formatDateVi = function (isoDate) {
    var _a = isoDate.split('-').map(Number), year = _a[0], month = _a[1], day = _a[2];
    if (!year || !month || !day) {
        return isoDate;
    }
    return "".concat(day, " thg ").concat(month, ", ").concat(year);
};
var parseIsoDate = function (value) {
    var _a = value.split('-').map(function (item) { return Number(item); }), year = _a[0], month = _a[1], day = _a[2];
    if (!year || !month || !day) {
        return null;
    }
    var parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};
var normalizeCategoryType = function (value) {
    var stringValue = String(value || '').toUpperCase();
    return stringValue === 'INCOME' ? 'INCOME' : 'EXPENSE';
};
var isSameDate = function (left, right) {
    return left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate();
};
var buildCalendarMatrix = function (monthDate) {
    var firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    var startOffset = (firstDay.getDay() + 6) % 7;
    var startDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - startOffset);
    return Array.from({ length: 42 }, function (_, index) {
        var date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
        var inCurrentMonth = date.getMonth() === monthDate.getMonth();
        return { date: date, inCurrentMonth: inCurrentMonth };
    });
};
var getPeriodEndDate = function (startDateIso, periodType) {
    var _a = startDateIso.split('-').map(Number), year = _a[0], month = _a[1], day = _a[2];
    if (!year || !month || !day) {
        return startDateIso;
    }
    var start = new Date(year, month - 1, day);
    var end = new Date(start);
    var preserveDay = start.getDate();
    var normalizeMonthEnd = function () {
        if (end.getDate() !== preserveDay) {
            end.setDate(0);
        }
    };
    switch (periodType) {
        case 'weekly':
            end.setDate(end.getDate() + 6);
            break;
        case 'biweekly':
            end.setDate(end.getDate() + 13);
            break;
        case 'monthly':
            end.setMonth(end.getMonth() + 1);
            normalizeMonthEnd();
            if (end.getDate() === preserveDay) {
                end.setDate(end.getDate() - 1);
            }
            break;
        case 'yearly':
            end.setFullYear(end.getFullYear() + 1);
            normalizeMonthEnd();
            if (end.getDate() === preserveDay) {
                end.setDate(end.getDate() - 1);
            }
            break;
        default:
            break;
    }
    return "".concat(end.getFullYear(), "-").concat("".concat(end.getMonth() + 1).padStart(2, '0'), "-").concat("".concat(end.getDate()).padStart(2, '0'));
};
var toIsoDate = function (value) {
    var year = value.getFullYear();
    var month = "".concat(value.getMonth() + 1).padStart(2, '0');
    var day = "".concat(value.getDate()).padStart(2, '0');
    return "".concat(year, "-").concat(month, "-").concat(day);
};
var formatIsoDate = function (value) { return toIsoDate(value); };
var BudgetToolScreen = function () {
    var _a, _b, _c;
    var router = (0, expo_router_1.useRouter)();
    var queryClient = (0, react_query_1.useQueryClient)();
    var _d = (0, usecases_1.useBudgetUsecases)(), getBudgets = _d.getBudgets, createBudget = _d.createBudget;
    var getCategories = (0, usecases_2.useCategoryUsecases)().getCategories;
    var getWallets = (0, usecases_3.useWalletUsecases)().getWallets;
    var _e = (0, react_1.useState)(false), showCreateModal = _e[0], setShowCreateModal = _e[1];
    var _f = (0, react_1.useState)(false), showCategoryPickerModal = _f[0], setShowCategoryPickerModal = _f[1];
    var _g = (0, react_1.useState)(''), titleInput = _g[0], setTitleInput = _g[1];
    var _h = (0, react_1.useState)(''), amountLimitInput = _h[0], setAmountLimitInput = _h[1];
    var _j = (0, react_1.useState)('monthly'), periodType = _j[0], setPeriodType = _j[1];
    var _k = (0, react_1.useState)(toIsoDate(new Date())), periodStart = _k[0], setPeriodStart = _k[1];
    var _l = (0, react_1.useState)([]), selectedCategoryIds = _l[0], setSelectedCategoryIds = _l[1];
    var _m = (0, react_1.useState)(null), selectedWalletId = _m[0], setSelectedWalletId = _m[1];
    var _o = (0, react_1.useState)(true), showAllWallets = _o[0], setShowAllWallets = _o[1];
    var _p = (0, react_1.useState)('EXPENSE'), budgetType = _p[0], setBudgetType = _p[1];
    var _q = (0, react_1.useState)(false), showPeriodDropdown = _q[0], setShowPeriodDropdown = _q[1];
    var _r = (0, react_1.useState)(false), showCalendarModal = _r[0], setShowCalendarModal = _r[1];
    var _s = (0, react_1.useState)('day'), calendarTarget = _s[0], setCalendarTarget = _s[1];
    var _t = (0, react_1.useState)(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), calendarMonth = _t[0], setCalendarMonth = _t[1];
    var _u = (0, react_1.useState)(new Date()), calendarSelectedDate = _u[0], setCalendarSelectedDate = _u[1];
    var budgetsQuery = (0, react_query_1.useQuery)({
        queryKey: ['budgets'],
        queryFn: getBudgets,
    });
    var categoriesQuery = (0, react_query_1.useQuery)({
        queryKey: ['categories'],
        queryFn: getCategories,
    });
    var walletsQuery = (0, react_query_1.useQuery)({
        queryKey: ['wallets'],
        queryFn: getWallets,
    });
    var budgets = (_a = budgetsQuery.data) !== null && _a !== void 0 ? _a : [];
    var categories = (_b = categoriesQuery.data) !== null && _b !== void 0 ? _b : [];
    var wallets = (_c = walletsQuery.data) !== null && _c !== void 0 ? _c : [];
    var budgetTypeCategories = (0, react_1.useMemo)(function () { return categories.filter(function (item) { return normalizeCategoryType(item.type) === budgetType; }); }, [categories, budgetType]);
    var categoryMap = (0, react_1.useMemo)(function () { return new Map(categories.map(function (item) { return [item.categoryId, item]; })); }, [categories]);
    var walletMap = (0, react_1.useMemo)(function () { return new Map(wallets.map(function (item) { return [item.walletId, item]; })); }, [wallets]);
    (0, react_1.useEffect)(function () {
        if (!selectedWalletId && wallets.length > 0) {
            setSelectedWalletId(wallets[0].walletId);
        }
    }, [selectedWalletId, wallets]);
    var filteredBudgets = (0, react_1.useMemo)(function () {
        if (showAllWallets || !selectedWalletId) {
            return budgets;
        }
        return budgets.filter(function (budget) { return budget.walletId === selectedWalletId; });
    }, [budgets, selectedWalletId, showAllWallets]);
    var selectedCategories = (0, react_1.useMemo)(function () { return categories.filter(function (item) { return selectedCategoryIds.includes(item.categoryId); }); }, [categories, selectedCategoryIds]);
    var openCalendarPicker = function (target, valueIso) {
        var parsed = valueIso ? parseIsoDate(valueIso) : null;
        var base = parsed !== null && parsed !== void 0 ? parsed : new Date();
        setCalendarTarget(target);
        setCalendarSelectedDate(base);
        setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
        setShowCalendarModal(true);
    };
    var applyCalendarSelection = function () {
        var value = formatIsoDate(calendarSelectedDate);
        if (calendarTarget === 'day') {
            setPeriodStart(value);
        }
        setShowCalendarModal(false);
    };
    (0, react_1.useEffect)(function () {
        setSelectedCategoryIds(function (current) {
            return current.filter(function (id) { return budgetTypeCategories.some(function (item) { return item.categoryId === id; }); });
        });
    }, [budgetTypeCategories]);
    var periodEnd = (0, react_1.useMemo)(function () { return getPeriodEndDate(periodStart, periodType); }, [periodStart, periodType]);
    var toggleCategoryId = function (categoryId) {
        setSelectedCategoryIds(function (current) {
            return current.includes(categoryId) ? current.filter(function (id) { return id !== categoryId; }) : __spreadArray(__spreadArray([], current, true), [categoryId], false);
        });
    };
    var createBudgetHandler = function () { return __awaiter(void 0, void 0, void 0, function () {
        var amountLimit, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    amountLimit = (0, money_1.parseMoneyInput)(amountLimitInput);
                    if (!titleInput.trim()) {
                        react_native_1.Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề cho ngân sách.');
                        return [2 /*return*/];
                    }
                    if (!selectedWalletId) {
                        react_native_1.Alert.alert('Thiếu ví', 'Vui lòng chọn ví cho ngân sách.');
                        return [2 /*return*/];
                    }
                    if (selectedCategoryIds.length === 0) {
                        react_native_1.Alert.alert('Thiếu danh mục', 'Vui lòng chọn ít nhất một danh mục cho ngân sách.');
                        return [2 /*return*/];
                    }
                    if (!Number.isFinite(amountLimit) || amountLimit <= 0) {
                        react_native_1.Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền ngân sách lớn hơn 0.');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, createBudget({
                            walletId: selectedWalletId,
                            categoryId: selectedCategoryIds[0],
                            categoryIds: selectedCategoryIds,
                            title: titleInput.trim(),
                            amountLimit: amountLimit,
                            periodStart: periodStart,
                            periodEnd: periodEnd,
                            periodType: periodType,
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ['budgets'] })];
                case 3:
                    _b.sent();
                    setShowCreateModal(false);
                    setAmountLimitInput('');
                    setTitleInput('');
                    setPeriodType('monthly');
                    setPeriodStart(toIsoDate(new Date()));
                    setSelectedCategoryIds([]);
                    react_native_1.Alert.alert('Thành công', 'Đã tạo ngân sách mới.');
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    react_native_1.Alert.alert('Lỗi', 'Không thể tạo ngân sách. Vui lòng thử lại.');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<react_native_1.View style={styles.screen}>
      <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.Pressable style={styles.backBtn} onPress={function () { return router.back(); }}>
            <vector_icons_1.Ionicons name="chevron-back" size={24} color="#1f1f1f"/>
          </react_native_1.Pressable>
          <react_native_1.Text style={styles.title}>Ngân sách</react_native_1.Text>
          <react_native_1.View style={{ width: 24 }}/>
        </react_native_1.View>

        <react_native_1.View style={styles.walletToggleRow}>
          <react_native_1.Text style={styles.walletToggleLabel}>Hiển thị tất cả ví</react_native_1.Text>
          <react_native_1.Switch value={showAllWallets} onValueChange={setShowAllWallets} trackColor={{ false: '#d4dde3', true: '#33c3cd' }} thumbColor={showAllWallets ? '#ffffff' : '#f1f5f8'}/>
        </react_native_1.View>

        {!showAllWallets ? (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
            {wallets.map(function (wallet) {
                var selected = selectedWalletId === wallet.walletId;
                return (<react_native_1.Pressable key={wallet.walletId} style={[styles.walletChip, selected ? styles.walletChipActive : null]} onPress={function () { return setSelectedWalletId(wallet.walletId); }}>
                  <react_native_1.Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                    {wallet.name}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
            })}
          </react_native_1.ScrollView>) : null}

        {budgetsQuery.isLoading ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyText}>Đang tải ngân sách...</react_native_1.Text>
          </react_native_1.View>) : filteredBudgets.length === 0 ? (<react_native_1.View style={styles.emptyCard}>
            <react_native_1.Text style={styles.emptyTitle}>Chưa có ngân sách</react_native_1.Text>
            <react_native_1.Text style={styles.emptyText}>Bạn có thể tạo ngân sách đầu tiên bằng nút bên dưới.</react_native_1.Text>
          </react_native_1.View>) : (filteredBudgets.map(function (budget) {
            var _a, _b, _c;
            var category = budget.categoryId ? categoryMap.get(budget.categoryId) : undefined;
            var wallet = budget.walletId ? walletMap.get(budget.walletId) : undefined;
            var spent = Number((_a = budget.spentAmount) !== null && _a !== void 0 ? _a : (budget.remainingAmount == null ? 0 : budget.amountLimit - budget.remainingAmount));
            var percent = budget.amountLimit > 0 ? Math.min((spent / budget.amountLimit) * 100, 100) : 0;
            var title = ((_b = budget.title) === null || _b === void 0 ? void 0 : _b.trim()) || (category === null || category === void 0 ? void 0 : category.name) || 'Ngân sách';
            var isIncome = (category === null || category === void 0 ? void 0 : category.type) === 'INCOME';
            var remainingAmount = Math.max((_c = budget.remainingAmount) !== null && _c !== void 0 ? _c : budget.amountLimit - spent, 0);
            var targetAmount = budget.amountLimit;
            var neededAmount = Math.max(targetAmount - spent, 0);
            return (<react_native_1.Pressable key={budget.budgetId} style={styles.budgetCard} onPress={function () {
                    return router.push({
                        pathname: '/(tabs)/budgets/[budgetId]',
                        params: { budgetId: budget.budgetId },
                    });
                }}>
                  <react_native_1.View style={styles.budgetCardHeader}>
                    <react_native_1.Text style={styles.budgetTitle}>{title}</react_native_1.Text>
                    <react_native_1.Pressable hitSlop={10} onPress={function (event) {
                    event.stopPropagation();
                    router.push({
                        pathname: '/(tabs)/budgets/[budgetId]/edit',
                        params: { budgetId: budget.budgetId },
                    });
                }} style={styles.editButton}>
                      <vector_icons_1.Ionicons name="pencil" size={18} color="#1f1f1f"/>
                    </react_native_1.Pressable>
                  </react_native_1.View>

                  <react_native_1.View style={styles.categoryChip}>
                    <react_native_1.Text style={styles.categoryChipIcon}>{(category === null || category === void 0 ? void 0 : category.icon) || '💸'}</react_native_1.Text>
                    <react_native_1.Text style={styles.categoryChipText}>{(category === null || category === void 0 ? void 0 : category.name) || 'Danh mục'}</react_native_1.Text>
                  </react_native_1.View>

                  {wallet ? (<react_native_1.View style={styles.walletInfoRow}>
                      <vector_icons_1.Ionicons name="wallet" size={14} color="#5b6770"/>
                      <react_native_1.Text style={styles.walletName}>{wallet.name}</react_native_1.Text>
                    </react_native_1.View>) : null}

                  <react_native_1.Text style={styles.budgetSummary}>
                    {isIncome
                    ? "C\u1EA7n th\u00EAm ".concat((0, money_1.formatVndAmount)(neededAmount), " \u0111\u1EC3 \u0111\u1EA1t m\u1EE5c ti\u00EAu ").concat((0, money_1.formatVndAmount)(targetAmount))
                    : "".concat((0, money_1.formatVndAmount)(remainingAmount), " c\u00F2n l\u1EA1i t\u1EEB ng\u00E2n s\u00E1ch ").concat((0, money_1.formatVndAmount)(targetAmount))}
                  </react_native_1.Text>

                <react_native_1.View style={styles.progressTrack}>
                  <react_native_1.View style={[styles.progressFill, { width: "".concat(percent, "%") }]}/>
                </react_native_1.View>

                <react_native_1.View style={styles.footerRow}>
                  <react_native_1.Text style={styles.footerText}>{formatDateVi(budget.periodStart)}</react_native_1.Text>
                  <react_native_1.Text style={styles.footerText}>{formatDateVi(budget.periodEnd)}</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.Pressable>);
        }))}
      </react_native_1.ScrollView>

      <react_native_1.Pressable style={styles.fab} onPress={function () { return setShowCreateModal(true); }}>
        <vector_icons_1.Ionicons name="add" size={24} color="#fff"/>
        <react_native_1.Text style={styles.fabText}>Thêm ngân sách</react_native_1.Text>
      </react_native_1.Pressable>

      <react_native_1.Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={function () { return setShowCreateModal(false); }}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={styles.modalSheet}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>
                {budgetType === 'EXPENSE' ? 'Tạo ngân sách' : 'Tạo mục tiêu'}
              </react_native_1.Text>
              <react_native_1.Pressable onPress={function () { return setShowCreateModal(false); }}>
                <vector_icons_1.Ionicons name="close" size={24} color="#333"/>
              </react_native_1.Pressable>
            </react_native_1.View>

            <react_native_1.View style={styles.typeToggleTopRow}>
              {['EXPENSE', 'INCOME'].map(function (type) {
            var selected = budgetType === type;
            return (<react_native_1.Pressable key={type} style={[styles.typeToggleButton, selected ? styles.typeToggleButtonActive : null]} onPress={function () {
                    setBudgetType(type);
                    setShowPeriodDropdown(false);
                }}>
                    <react_native_1.Text style={[styles.typeToggleText, selected ? styles.typeToggleTextActive : null]}>
                      {type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
                    </react_native_1.Text>
                  </react_native_1.Pressable>);
        })}
            </react_native_1.View>

            <react_native_1.View style={styles.dropdownWrapper}>
              <react_native_1.Pressable style={styles.dropdownInput} onPress={function () { return setShowPeriodDropdown(function (current) { return !current; }); }}>
                <react_native_1.Text style={styles.dropdownText}>
                  {periodType === 'monthly'
            ? 'Hàng tháng'
            : periodType === 'biweekly'
                ? '2 tuần'
                : periodType === 'weekly'
                    ? 'Hàng tuần'
                    : 'Hàng năm'}
                </react_native_1.Text>
                <vector_icons_1.Ionicons name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#3a464e"/>
              </react_native_1.Pressable>
              {showPeriodDropdown ? (<react_native_1.View style={styles.dropdownMenu}>
                  {[
                { value: 'monthly', label: 'Hàng tháng' },
                { value: 'biweekly', label: '2 tuần' },
                { value: 'weekly', label: 'Hàng tuần' },
                { value: 'yearly', label: 'Hàng năm' },
            ].map(function (option) { return (<react_native_1.Pressable key={option.value} style={styles.dropdownMenuItem} onPress={function () {
                    setPeriodType(option.value);
                    setShowPeriodDropdown(false);
                }}>
                      <react_native_1.Text style={styles.dropdownMenuItemText}>{option.label}</react_native_1.Text>
                    </react_native_1.Pressable>); })}
                </react_native_1.View>) : null}
            </react_native_1.View>

            <react_native_1.TextInput style={styles.input} placeholder="Tiêu đề" value={titleInput} onChangeText={setTitleInput}/>
            <react_native_1.TextInput style={styles.input} placeholder="Số tiền ngân sách" keyboardType="numeric" value={amountLimitInput} onChangeText={function (value) { return setAmountLimitInput((0, money_1.formatMoneyInput)(value)); }}/>
            <react_native_1.View style={styles.dateTypeRow}>
              <react_native_1.Pressable style={styles.calendarInput} onPress={function () { return openCalendarPicker('day', periodStart); }}>
                <vector_icons_1.Ionicons name="calendar" size={18} color="#29bcc8"/>
                <react_native_1.Text style={styles.calendarInputText}>{formatDateVi(periodStart)}</react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>
            <react_native_1.View style={styles.endDateRow}>
              <react_native_1.Text style={styles.endDateLabel}>Ngày kết thúc</react_native_1.Text>
              <react_native_1.Text style={styles.endDateText}>{formatDateVi(periodEnd)}</react_native_1.Text>
            </react_native_1.View>

            <react_native_1.Text style={styles.sectionLabel}>Danh mục ngân sách</react_native_1.Text>
            <react_native_1.View style={styles.selectedCategoryRow}>
              {selectedCategories.length === 0 ? (<react_native_1.Text style={styles.selectedCategoryEmpty}>Chưa có danh mục nào được chọn.</react_native_1.Text>) : (selectedCategories.map(function (item) { return (<react_native_1.Pressable key={item.categoryId} style={styles.selectedCategoryChip} onPress={function () { return toggleCategoryId(item.categoryId); }}>
                    <react_native_1.Text style={styles.selectedCategoryIcon}>{item.icon || '💸'}</react_native_1.Text>
                    <react_native_1.Text style={styles.selectedCategoryText}>{item.name}</react_native_1.Text>
                    <react_native_1.Text style={styles.selectedCategoryRemove}>✕</react_native_1.Text>
                  </react_native_1.Pressable>); }))}
            </react_native_1.View>
            <react_native_1.Pressable style={styles.openCategoryPickerButton} onPress={function () { return setShowCategoryPickerModal(true); }}>
              <vector_icons_1.Ionicons name="add-circle-outline" size={18} color="#179ea9"/>
              <react_native_1.Text style={styles.openCategoryPickerButtonText}>Thêm danh mục</react_native_1.Text>
            </react_native_1.Pressable>

            <react_native_1.Text style={styles.sectionLabel}>Chọn ví</react_native_1.Text>
            <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
              {wallets.length === 0 ? (<react_native_1.View style={styles.walletEmptyChip}>
                  <react_native_1.Text style={styles.walletEmptyText}>Chưa có ví</react_native_1.Text>
                </react_native_1.View>) : (wallets.map(function (wallet) {
            var selected = selectedWalletId === wallet.walletId;
            return (<react_native_1.Pressable key={wallet.walletId} onPress={function () { return setSelectedWalletId(wallet.walletId); }} style={[styles.walletChip, selected ? styles.walletChipActive : null]}>
                      <react_native_1.Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                        {wallet.name}
                      </react_native_1.Text>
                    </react_native_1.Pressable>);
        }))}
            </react_native_1.ScrollView>

            <react_native_1.Pressable style={styles.saveBtn} onPress={createBudgetHandler}>
              <react_native_1.Text style={styles.saveBtnText}>Lưu</react_native_1.Text>
            </react_native_1.Pressable>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      <react_native_1.Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={function () { return setShowCalendarModal(false); }}>
        <react_native_1.View style={styles.modalOverlayCenter}>
          <react_native_1.View style={styles.calendarCard}>
            <react_native_1.Text style={styles.modalTitle}>Chọn ngày bắt đầu</react_native_1.Text>

            <react_native_1.View style={styles.calendarHeaderRow}>
              <react_native_1.Pressable onPress={function () { return setCalendarMonth(function (current) { return new Date(current.getFullYear(), current.getMonth() - 1, 1); }); }} style={styles.monthNavBtn}>
                <vector_icons_1.Ionicons name="chevron-back" size={18} color="#555"/>
              </react_native_1.Pressable>

              <react_native_1.Text style={styles.calendarMonthTitle}>
                {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </react_native_1.Text>

              <react_native_1.Pressable onPress={function () { return setCalendarMonth(function (current) { return new Date(current.getFullYear(), current.getMonth() + 1, 1); }); }} style={styles.monthNavBtn}>
                <vector_icons_1.Ionicons name="chevron-forward" size={18} color="#555"/>
              </react_native_1.Pressable>
            </react_native_1.View>

            <react_native_1.View style={styles.calendarWeekdays}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (day) { return (<react_native_1.Text key={day} style={styles.calendarWeekdayText}>
                  {day}
                </react_native_1.Text>); })}
            </react_native_1.View>

            <react_native_1.View style={styles.calendarGrid}>
              {buildCalendarMatrix(calendarMonth).map(function (cell, index) {
            var selected = isSameDate(cell.date, calendarSelectedDate);
            return (<react_native_1.Pressable key={"".concat(cell.date.toISOString(), "-").concat(index)} onPress={function () { return setCalendarSelectedDate(cell.date); }} style={[styles.calendarCell, selected ? styles.calendarCellSelected : null]}>
                    <react_native_1.Text style={[
                    styles.calendarCellText,
                    !cell.inCurrentMonth ? styles.calendarCellTextMuted : null,
                    selected ? styles.calendarCellTextSelected : null,
                ]}>
                      {cell.date.getDate()}
                    </react_native_1.Text>
                  </react_native_1.Pressable>);
        })}
            </react_native_1.View>

            <react_native_1.View style={styles.rangeActionRow}>
              <react_native_1.Pressable style={styles.rangeGhostBtn} onPress={function () { return setShowCalendarModal(false); }}>
                <react_native_1.Text style={styles.rangeGhostBtnText}>Hủy</react_native_1.Text>
              </react_native_1.Pressable>
              <react_native_1.Pressable style={styles.rangeConfirmBtn} onPress={applyCalendarSelection}>
                <react_native_1.Text style={styles.rangeConfirmBtnText}>OK</react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      <react_native_1.Modal visible={showCategoryPickerModal} transparent animationType="slide" onRequestClose={function () { return setShowCategoryPickerModal(false); }}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={styles.categoryPickerSheet}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>Chọn danh mục</react_native_1.Text>
              <react_native_1.Pressable onPress={function () { return setShowCategoryPickerModal(false); }}>
                <vector_icons_1.Ionicons name="close" size={24} color="#333"/>
              </react_native_1.Pressable>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.categoryPickerContent} showsVerticalScrollIndicator={false}>
              {budgetTypeCategories.length === 0 ? (<react_native_1.Text style={styles.selectedCategoryEmpty}>Chưa có danh mục phù hợp.</react_native_1.Text>) : (budgetTypeCategories.map(function (item) {
            var selected = selectedCategoryIds.includes(item.categoryId);
            return (<react_native_1.Pressable key={item.categoryId} onPress={function () { return toggleCategoryId(item.categoryId); }} style={[styles.categoryPickerItem, selected ? styles.categoryPickerItemSelected : null]}>
                      <react_native_1.View style={styles.categoryPickerIconWrap}>
                        <react_native_1.Text style={styles.categoryPickerIcon}>{item.icon || '💸'}</react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.categoryPickerName, selected ? styles.categoryPickerNameSelected : null]}>
                        {item.name}
                      </react_native_1.Text>
                      {selected ? <react_native_1.Text style={styles.categoryPickerSelectedMark}>✓</react_native_1.Text> : null}
                    </react_native_1.Pressable>);
        }))}
            </react_native_1.ScrollView>

            <react_native_1.Pressable style={styles.categoryPickerDoneButton} onPress={function () { return setShowCategoryPickerModal(false); }}>
              <react_native_1.Text style={styles.categoryPickerDoneButtonText}>Xong</react_native_1.Text>
            </react_native_1.Pressable>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
};
exports.BudgetToolScreen = BudgetToolScreen;
var styles = react_native_1.StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f7f9',
    },
    content: {
        padding: 16,
        paddingBottom: 120,
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
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#1f1f1f',
    },
    walletToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    walletToggleLabel: {
        fontSize: 14,
        color: '#4b5963',
        fontWeight: '600',
    },
    emptyCard: {
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e6ecef',
        padding: 20,
        gap: 6,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    emptyText: {
        fontSize: 14,
        color: '#667179',
    },
    budgetCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#14b8c4',
        backgroundColor: '#fff',
        padding: 16,
        gap: 10,
    },
    budgetCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    editButton: {
        padding: 6,
        borderRadius: 10,
    },
    budgetTitle: {
        flex: 1,
        fontSize: 26,
        fontWeight: '700',
        color: '#1f1f1f',
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
        fontSize: 22,
        color: '#2a333a',
        fontWeight: '600',
    },
    walletInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    walletName: {
        fontSize: 14,
        color: '#5b6770',
        fontWeight: '600',
    },
    budgetSummary: {
        fontSize: 15,
        color: '#4b5963',
    },
    remainingText: {
        color: '#129f8a',
        fontWeight: '700',
    },
    totalText: {
        color: '#1f1f1f',
        fontWeight: '700',
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: '#e8edf0',
        overflow: 'hidden',
    },
    progressFill: {
        height: 8,
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
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 18,
        borderRadius: 999,
        backgroundColor: '#22648e',
        paddingHorizontal: 18,
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 5,
    },
    fabText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        gap: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#1f1f1f',
    },
    periodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    periodChip: {
        flex: 1,
        minHeight: 40,
        minWidth: 120,
        borderRadius: 999,
        backgroundColor: '#edf1f5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    endDateRow: {
        marginTop: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f3fafb',
        borderWidth: 1,
        borderColor: '#d9f0f2',
    },
    endDateLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5d6972',
        marginBottom: 4,
    },
    endDateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    periodChipActive: {
        backgroundColor: '#29bcc8',
    },
    periodChipText: {
        color: '#3b4750',
        fontSize: 14,
        fontWeight: '700',
    },
    periodChipTextActive: {
        color: '#fff',
    },
    input: {
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d5dde3',
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    dateTypeRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    calendarInput: {
        flex: 1,
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d5dde3',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    calendarInputText: {
        fontSize: 14,
        color: '#1f1f1f',
    },
    typeToggleTopRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    typeToggleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dropdownWrapper: {
        marginBottom: 10,
    },
    dropdownInput: {
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d5dde3',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 14,
        color: '#1f1f1f',
    },
    dropdownMenu: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d5dde3',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    dropdownMenuItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eff3f6',
    },
    dropdownMenuItemText: {
        fontSize: 14,
        color: '#3a464e',
    },
    typeToggleButton: {
        minHeight: 40,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d5dde3',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeToggleButtonActive: {
        borderColor: '#29bcc8',
        backgroundColor: '#e9fbfd',
    },
    typeToggleText: {
        fontSize: 13,
        color: '#3a464e',
        fontWeight: '700',
    },
    typeToggleTextActive: {
        color: '#0f8c95',
    },
    selectedCategoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    selectedCategoryEmpty: {
        color: '#667179',
        fontSize: 14,
    },
    selectedCategoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#e9fbfd',
        borderWidth: 1,
        borderColor: '#29bcc8',
    },
    selectedCategoryIcon: {
        fontSize: 16,
    },
    selectedCategoryText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f8c95',
    },
    selectedCategoryRemove: {
        color: '#0f8c95',
        fontWeight: '700',
    },
    openCategoryPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#effbf9',
        marginBottom: 12,
    },
    openCategoryPickerButtonText: {
        color: '#179ea9',
        fontSize: 14,
        fontWeight: '700',
    },
    categoryPickerSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        maxHeight: '80%',
    },
    categoryPickerContent: {
        gap: 10,
        paddingBottom: 16,
    },
    categoryPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#f7fbfc',
        borderWidth: 1,
        borderColor: '#d9e2e8',
        gap: 12,
    },
    categoryPickerItemSelected: {
        backgroundColor: '#e9fbfd',
        borderColor: '#29bcc8',
    },
    categoryPickerIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#eef9fb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryPickerIcon: {
        fontSize: 18,
    },
    categoryPickerName: {
        flex: 1,
        fontSize: 15,
        color: '#3a464e',
        fontWeight: '600',
    },
    categoryPickerNameSelected: {
        color: '#0f8c95',
    },
    categoryPickerSelectedMark: {
        fontSize: 16,
        color: '#0f8c95',
        fontWeight: '700',
    },
    categoryPickerDoneButton: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#29bcc8',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    categoryPickerDoneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionLabel: {
        marginTop: 2,
        fontSize: 13,
        fontWeight: '700',
        color: '#5d6972',
    },
    walletRow: {
        gap: 8,
        paddingBottom: 6,
    },
    walletChip: {
        minHeight: 40,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d9e2e8',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletChipActive: {
        borderColor: '#29bcc8',
        backgroundColor: '#e9fbfd',
    },
    walletChipText: {
        fontSize: 13,
        color: '#3a464e',
        fontWeight: '600',
    },
    walletChipTextActive: {
        color: '#0f8c95',
    },
    walletEmptyChip: {
        minHeight: 40,
        borderRadius: 14,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f8',
    },
    walletEmptyText: {
        fontSize: 13,
        color: '#7b868d',
        fontWeight: '600',
    },
    modalOverlayCenter: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 20,
        backgroundColor: '#fff',
        padding: 16,
        gap: 12,
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    monthNavBtn: {
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f8',
    },
    calendarMonthTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    calendarWeekdays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    calendarWeekdayText: {
        fontSize: 12,
        color: '#74808a',
        width: 32,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    calendarCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginBottom: 4,
    },
    calendarCellSelected: {
        backgroundColor: '#29bcc8',
    },
    calendarCellText: {
        fontSize: 14,
        color: '#1f1f1f',
    },
    calendarCellTextMuted: {
        color: '#b0bdc7',
    },
    calendarCellTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    rangeActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 8,
    },
    rangeGhostBtn: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d5dde3',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    rangeGhostBtnText: {
        color: '#4b5963',
        fontWeight: '700',
    },
    rangeConfirmBtn: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: '#29bcc8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rangeConfirmBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    categoryRow: {
        gap: 8,
        paddingBottom: 6,
    },
    categoryOption: {
        minHeight: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d9e2e8',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    categoryOptionActive: {
        borderColor: '#29bcc8',
        backgroundColor: '#e9fbfd',
    },
    categoryOptionIcon: {
        fontSize: 16,
    },
    categoryOptionText: {
        fontSize: 13,
        color: '#3a464e',
        fontWeight: '600',
    },
    categoryOptionTextActive: {
        color: '#0f8c95',
    },
    saveBtn: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#29bcc8',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
