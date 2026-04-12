package com.examples.moneytracker.report.service;

import com.examples.moneytracker.budget.repository.BudgetRepository;
import com.examples.moneytracker.report.dto.*;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final BudgetRepository budgetRepository;

    public ReportSummaryResponse summary(UUID userId, LocalDate fromDate, LocalDate toDate) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, fromDate, toDate),
                Sort.by(Sort.Direction.DESC, "date")
        );

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        Map<UUID, BigDecimal> expenseByCategory = new HashMap<>();
        Map<UUID, BigDecimal> expenseByWallet = new HashMap<>();
        Map<UUID, String> categoryName = new HashMap<>();

        for (Transaction tx : txs) {
            String type = tx.getCategory().getType();
            if ("INCOME".equalsIgnoreCase(type)) {
                totalIncome = totalIncome.add(tx.getAmount());
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                totalExpense = totalExpense.add(tx.getAmount());
                expenseByCategory.merge(tx.getCategory().getCategoryId(), tx.getAmount(), BigDecimal::add);
                expenseByWallet.merge(tx.getWalletId(), tx.getAmount(), BigDecimal::add);
                categoryName.putIfAbsent(tx.getCategory().getCategoryId(), tx.getCategory().getName());
            }
        }

        BigDecimal net = totalIncome.subtract(totalExpense);

        TopCategory topCategory = null;
        if (!expenseByCategory.isEmpty()) {
            var top = expenseByCategory.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElseThrow();
            topCategory = new TopCategory(top.getKey(), categoryName.get(top.getKey()), top.getValue());
        }

        TopWallet topWallet = null;
        if (!expenseByWallet.isEmpty()) {
            Map<UUID, Wallet> walletMap = walletRepository.findAllById(expenseByWallet.keySet())
                    .stream()
                    .collect(Collectors.toMap(Wallet::getWalletId, w -> w));
            var top = expenseByWallet.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElseThrow();
            String name = walletMap.containsKey(top.getKey()) ? walletMap.get(top.getKey()).getName() : null;
            topWallet = new TopWallet(top.getKey(), name, top.getValue());
        }

        return new ReportSummaryResponse(
                totalIncome,
                totalExpense,
                net,
                txs.size(),
                topCategory,
                topWallet
        );
    }

    public ReportByWalletResponse byWallet(UUID userId, LocalDate fromDate, LocalDate toDate) {
        List<Wallet> wallets = walletRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, fromDate, toDate)
        );

        Map<UUID, BigDecimal> incomeByWallet = new HashMap<>();
        Map<UUID, BigDecimal> expenseByWallet = new HashMap<>();

        for (Transaction tx : txs) {
            String type = tx.getCategory().getType();
            if ("INCOME".equalsIgnoreCase(type)) {
                incomeByWallet.merge(tx.getWalletId(), tx.getAmount(), BigDecimal::add);
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                expenseByWallet.merge(tx.getWalletId(), tx.getAmount(), BigDecimal::add);
            }
        }

        List<WalletStat> stats = new ArrayList<>();
        for (Wallet wallet : wallets) {
            BigDecimal income = incomeByWallet.getOrDefault(wallet.getWalletId(), BigDecimal.ZERO);
            BigDecimal expense = expenseByWallet.getOrDefault(wallet.getWalletId(), BigDecimal.ZERO);
            BigDecimal total = income.add(expense);
            BigDecimal ratio = total.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : expense.divide(total, 4, RoundingMode.HALF_UP);

            stats.add(new WalletStat(
                    wallet.getWalletId(),
                    wallet.getName(),
                    income,
                    expense,
                    wallet.getCurrentBalance(),
                    ratio,
                    0
            ));
        }

        stats.sort(Comparator.comparing(WalletStat::getTotalExpense).reversed());
        for (int i = 0; i < stats.size(); i++) {
            stats.get(i).setRankByExpense(i + 1);
        }

        return new ReportByWalletResponse(stats);
    }

    public ReportByTimeResponse byTime(UUID userId, LocalDate fromDate, LocalDate toDate, String groupBy) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, fromDate, toDate)
        );

        Map<String, BigDecimal> incomeByPeriod = new LinkedHashMap<>();
        Map<String, BigDecimal> expenseByPeriod = new LinkedHashMap<>();

        for (Transaction tx : txs) {
            String period = formatPeriod(tx.getDate(), groupBy);
            String type = tx.getCategory().getType();
            if ("INCOME".equalsIgnoreCase(type)) {
                incomeByPeriod.merge(period, tx.getAmount(), BigDecimal::add);
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                expenseByPeriod.merge(period, tx.getAmount(), BigDecimal::add);
            }
        }

        List<TimeSeriesPoint> series = new ArrayList<>();
        Set<String> periods = new LinkedHashSet<>();
        periods.addAll(incomeByPeriod.keySet());
        periods.addAll(expenseByPeriod.keySet());

        for (String period : periods) {
            series.add(new TimeSeriesPoint(
                    period,
                    expenseByPeriod.getOrDefault(period, BigDecimal.ZERO),
                    incomeByPeriod.getOrDefault(period, BigDecimal.ZERO)
            ));
        }

        series.sort(Comparator.comparing(TimeSeriesPoint::getPeriod));

        String trend = "flat";
        if (series.size() >= 2) {
            BigDecimal first = series.get(0).getTotalExpense();
            BigDecimal last = series.get(series.size() - 1).getTotalExpense();
            int cmp = last.compareTo(first);
            trend = cmp > 0 ? "up" : (cmp < 0 ? "down" : "flat");
        }

        String peakPeriod = series.stream()
                .max(Comparator.comparing(TimeSeriesPoint::getTotalExpense))
                .map(TimeSeriesPoint::getPeriod)
                .orElse(null);

        return new ReportByTimeResponse(series, trend, peakPeriod);
    }

    public ReportBudgetHealthResponse budgetHealth(UUID userId) {
        List<BudgetHealthItem> items = budgetRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(budget -> {
                    BigDecimal spent = transactionRepository.findAll(
                            TransactionSpecification.reportFilter(userId, budget.getPeriodStart(), budget.getPeriodEnd())
                    ).stream()
                            .filter(tx -> tx.getCategory().getCategoryId().equals(budget.getCategoryId()))
                            .filter(tx -> "EXPENSE".equalsIgnoreCase(tx.getCategory().getType()))
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal ratio = budget.getAmountLimit().compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : spent.divide(budget.getAmountLimit(), 4, RoundingMode.HALF_UP);

                    return new BudgetHealthItem(
                            budget.getBudgetId(),
                            budget.getCategoryId(),
                            spent,
                            budget.getAmountLimit(),
                            ratio
                    );
                })
                .toList();

        return new ReportBudgetHealthResponse(items);
    }

    public ReportInsightsResponse insights() {
        return new ReportInsightsResponse(List.of());
    }

    private String formatPeriod(LocalDate date, String groupBy) {
        if (groupBy == null) {
            return date.toString();
        }
        switch (groupBy.toLowerCase()) {
            case "week" -> {
                WeekFields wf = WeekFields.ISO;
                int week = date.get(wf.weekOfWeekBasedYear());
                return date.getYear() + "-W" + week;
            }
            case "month" -> {
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            }
            case "year" -> {
                return String.valueOf(date.getYear());
            }
            default -> {
                return date.toString();
            }
        }
    }
}
