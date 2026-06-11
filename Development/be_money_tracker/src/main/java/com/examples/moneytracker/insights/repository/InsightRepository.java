package com.examples.moneytracker.insights.repository;

import com.examples.moneytracker.insights.model.Insight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InsightRepository extends JpaRepository<Insight, UUID> {
    List<Insight> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
