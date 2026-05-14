package com.examples.moneytracker.garden.service;

import com.examples.moneytracker.garden.service.score.FinancialScoreEngine;
import com.examples.moneytracker.garden.service.score.ScoreResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GardenScoreService {

    private final GardenFeatureGuard featureGuard;
    private final FinancialScoreEngine scoreEngine;

    public ScoreResult calculateMonthlyScore(UUID userId, LocalDate monthStart, LocalDate monthEnd) {
        featureGuard.assertEnabled();
        return scoreEngine.calculateMonthlyScore(userId, monthStart, monthEnd);
    }
}
