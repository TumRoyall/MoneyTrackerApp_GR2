package com.examples.moneytracker.analytics.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DefaultBehaviorSignalService implements BehaviorSignalService {

    private final TransactionRepository transactionRepository;

    @Override
    public List<BehaviorSignalDto> detectSignals(UUID userId, LocalDate start, LocalDate end) {
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

        List<BehaviorSignalDto> signals = new ArrayList<>();
        if (weekend.compareTo(weekday) > 0) {
            signals.add(new BehaviorSignalDto(
                    "WEEKEND_SPIKE",
                    "MEDIUM",
                    start,
                    end,
                    "weekend_spend=" + weekend + ", weekday_spend=" + weekday
            ));
        }

        return signals;
    }
}
