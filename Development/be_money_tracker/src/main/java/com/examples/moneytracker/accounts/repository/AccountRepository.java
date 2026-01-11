package com.examples.moneytracker.accounts.repository;

import com.examples.moneytracker.accounts.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    // Lấy tất cả ví của 1 user (chưa xoá)
    List<Account> findByUserId(Long userId);

    // Lấy tất cả ví theo user + type
    List<Account> findByUserIdAndType(Long userId, String type);

    // Kiểm tra user có sở hữu account không (rất hay dùng cho security)
    boolean existsByAccountIdAndUserId(Long accountId, Long userId);
}
