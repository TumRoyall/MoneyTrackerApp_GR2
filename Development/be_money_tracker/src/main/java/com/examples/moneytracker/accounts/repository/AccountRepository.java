package com.examples.moneytracker.accounts.repository;

import com.examples.moneytracker.accounts.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    // Kiểm tra account_name đã tồn tại với user_id đó hay chưa
    boolean existsByUserIdAndAccountName(UUID userId, String accountName);

    // Lấy danh sách account của user (chưa bị xóa)
    List<Account> findByUserIdAndDeletedAtIsNull(UUID userId);

    List<Account> findByUserIdAndAccountIdInAndDeletedAtIsNull(UUID userId, Collection<UUID> accountIds);

    // Lấy account theo id + user + chưa bị xóa
    Optional<Account> findByAccountIdAndUserIdAndDeletedAtIsNull(UUID accountId, UUID userId);
}
