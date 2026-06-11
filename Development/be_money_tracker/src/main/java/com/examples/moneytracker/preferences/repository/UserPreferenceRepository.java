package com.examples.moneytracker.preferences.repository;

import com.examples.moneytracker.preferences.model.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID> {
}
