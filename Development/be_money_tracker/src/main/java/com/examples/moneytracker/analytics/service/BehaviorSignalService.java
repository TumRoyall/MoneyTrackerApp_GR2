package com.examples.moneytracker.analytics.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BehaviorSignalService {
    List<BehaviorSignalDto> detectSignals(UUID userId, LocalDate start, LocalDate end);
}
