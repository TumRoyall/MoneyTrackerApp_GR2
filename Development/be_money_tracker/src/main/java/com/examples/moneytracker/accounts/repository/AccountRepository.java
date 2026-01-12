package com.examples.moneytracker.accounts.repository;

import com.examples.moneytracker.accounts.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    // Kiểm tra account_name đã tồn tại với user_id đó hay chưa
    boolean existsByUserIdAndAccountName(Long userId, String accountName);

}
