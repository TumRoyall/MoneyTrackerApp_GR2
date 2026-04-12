package com.examples.moneytracker.wallet.repository;

import com.examples.moneytracker.wallet.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    boolean existsByUserIdAndName(UUID userId, String name);

    List<Wallet> findByUserIdAndDeletedAtIsNull(UUID userId);

    List<Wallet> findByUserIdAndWalletIdInAndDeletedAtIsNull(UUID userId, Iterable<UUID> walletIds);

    Optional<Wallet> findByWalletIdAndUserIdAndDeletedAtIsNull(UUID walletId, UUID userId);
}
