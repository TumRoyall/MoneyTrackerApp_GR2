package com.examples.moneytracker.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple liveness endpoint that ALWAYS returns 200 OK.
 * Used as Railway's healthcheck target so the service is not killed while
 * other components (DB, mail, etc.) finish initializing.
 *
 * Real component health is at /actuator/health (Spring Boot Actuator).
 */
@RestController
public class HealthController {

    @GetMapping("/healthz")
    public Map<String, String> healthz() {
        return Map.of("status", "ok");
    }
}
