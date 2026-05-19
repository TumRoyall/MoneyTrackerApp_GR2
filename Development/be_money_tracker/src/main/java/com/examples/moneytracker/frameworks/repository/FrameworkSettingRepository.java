package com.examples.moneytracker.frameworks.repository;

import com.examples.moneytracker.frameworks.model.FrameworkSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FrameworkSettingRepository extends JpaRepository<FrameworkSetting, UUID> {
}
