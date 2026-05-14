package com.examples.moneytracker.garden.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GardenFeatureGuard {

    @Value("${feature.garden.enabled:false}")
    private boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }

    public void assertEnabled() {
        if (!enabled) {
            throw new IllegalStateException("Financial Garden feature is disabled");
        }
    }
}
