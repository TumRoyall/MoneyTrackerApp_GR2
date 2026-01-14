package com.examples.moneytracker.accounts.repository;

import com.examples.moneytracker.accounts.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    // Kiểm tra account_name đã tồn tại với user_id đó hay chưa
    boolean existsByUserIdAndAccountName(Long userId, String accountName);

    // Lấy danh sách account của user (chưa bị xóa)
    List<Account> findByUserIdAndDeletedFalse(Long userId);

    // Lấy account theo id + user + chưa bị xóa
    Optional<Account> findByAccountIdAndUserIdAndDeletedFalse(Long accountId, Long userId);
}
