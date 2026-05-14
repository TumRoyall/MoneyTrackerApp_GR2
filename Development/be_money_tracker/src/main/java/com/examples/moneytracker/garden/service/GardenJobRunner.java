package com.examples.moneytracker.garden.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GardenJobRunner {

    private final GardenFeatureGuard featureGuard;

    public void runIfEnabled(String jobName, Runnable job) {
        if (!featureGuard.isEnabled()) {
            log.debug("Garden job {} skipped: feature disabled", jobName);
            return;
        }
        job.run();
    }
}
