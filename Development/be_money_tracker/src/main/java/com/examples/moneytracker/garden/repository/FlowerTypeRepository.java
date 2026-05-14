package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.FlowerType;
import com.examples.moneytracker.garden.model.FlowerTypeCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FlowerTypeRepository extends JpaRepository<FlowerType, UUID> {
    Optional<FlowerType> findByCode(FlowerTypeCode code);
}
