package com.examples.moneytracker.analytics.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DefaultBehaviorSignalService implements BehaviorSignalService {

    private final TransactionRepository transactionRepository;

    @Override
    public List<BehaviorSignalDto> detectSignals(UUID userId, LocalDate start, LocalDate end) {
        List<BehaviorSignalDto> signals = new ArrayList<>();

        detectWeekendSpike(signals, userId, start, end);
        detectHighCategoryConcentration(signals, userId, start, end);
        detectLargeTransactionAnomaly(signals, userId, start, end);
        detectNoRecentIncome(signals, userId, start, end);
        detectFrequentSpending(signals, userId, start, end);

        return signals;
    }

    private void detectWeekendSpike(List<BehaviorSignalDto> signals, UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end)
                        .and(TransactionSpecification.hasType("EXPENSE"))
        );

        BigDecimal weekend = BigDecimal.ZERO;
        BigDecimal weekday = BigDecimal.ZERO;

        for (Transaction tx : txs) {
            DayOfWeek day = tx.getDate().getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekend = weekend.add(tx.getAmount());
            } else {
                weekday = weekday.add(tx.getAmount());
            }
        }

        if (weekend.compareTo(weekday) > 0) {
            signals.add(new BehaviorSignalDto(
                    "WEEKEND_SPIKE",
                    "MEDIUM",
                    start,
                    end,
                    "weekend_spend=" + weekend + ", weekday_spend=" + weekday
            ));
        }
    }

    private void detectHighCategoryConcentration(List<BehaviorSignalDto> signals, UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end)
                        .and(TransactionSpecification.hasType("EXPENSE"))
        );

        if (txs.isEmpty()) return;

        Map<String, BigDecimal> byCategory = new HashMap<>();
        for (Transaction tx : txs) {
            String name = tx.getCategory().getName();
            byCategory.merge(name, tx.getAmount(), BigDecimal::add);
        }

        BigDecimal total = byCategory.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.ZERO) == 0) return;

        for (Map.Entry<String, BigDecimal> entry : byCategory.entrySet()) {
            BigDecimal ratio = entry.getValue().divide(total, 2, RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("0.50")) >= 0) {
                String evidence = "category=" + entry.getKey() + ", ratio=" + ratio + ", amount=" + entry.getValue();
                signals.add(new BehaviorSignalDto(
                        "HIGH_CATEGORY_CONCENTRATION",
                        ratio.compareTo(new BigDecimal("0.75")) >= 0 ? "HIGH" : "MEDIUM",
                        start, end, evidence
                ));
                break;
            }
        }
    }

    private void detectLargeTransactionAnomaly(List<BehaviorSignalDto> signals, UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end)
                        .and(TransactionSpecification.hasType("EXPENSE"))
        );

        if (txs.size() < 3) return;

        long days = ChronoUnit.DAYS.between(start, end) + 1;
        BigDecimal total = txs.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal dailyAvg = total.divide(BigDecimal.valueOf(Math.max(days, 1)), 2, RoundingMode.HALF_UP);

        for (Transaction tx : txs) {
            if (dailyAvg.compareTo(BigDecimal.ZERO) > 0 && tx.getAmount().compareTo(dailyAvg.multiply(new BigDecimal("3"))) > 0) {
                signals.add(new BehaviorSignalDto(
                        "LARGE_TRANSACTION_ANOMALY",
                        "MEDIUM",
                        tx.getDate(), tx.getDate(),
                        "amount=" + tx.getAmount() + ", dailyAvg=" + dailyAvg + ", category=" + tx.getCategory().getName()
                ));
                break;
            }
        }
    }

    private void detectNoRecentIncome(List<BehaviorSignalDto> signals, UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> incomeTx = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end)
                        .and(TransactionSpecification.hasType("INCOME"))
        );

        if (incomeTx.isEmpty()) {
            signals.add(new BehaviorSignalDto(
                    "NO_RECENT_INCOME",
                    "HIGH",
                    start, end,
                    "no_income_in_period"
            ));
        }
    }

    private void detectFrequentSpending(List<BehaviorSignalDto> signals, UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end)
                        .and(TransactionSpecification.hasType("EXPENSE"))
        );

        if (txs.size() < 10) return;

        long days = ChronoUnit.DAYS.between(start, end) + 1;
        double avgPerDay = (double) txs.size() / Math.max(days, 1);

        if (avgPerDay > 5) {
            signals.add(new BehaviorSignalDto(
                    "FREQUENT_SPENDING",
                    "MEDIUM",
                    start, end,
                    "avgTxPerDay=" + String.format("%.1f", avgPerDay) + ", totalTx=" + txs.size()
            ));
        }
    }
}
