package com.examples.moneytracker.wallet.service;

import com.examples.moneytracker.sync.service.SyncChangeLogService;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.model.TransactionType;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletBalanceService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final SyncChangeLogService syncChangeLogService;

    @Transactional
    public void applyTransactionCreate(Wallet wallet, Transaction tx) {
        wallet.setCurrentBalance(wallet.getCurrentBalance().add(signedAmount(tx.getAmount(), tx.getType())));
        walletRepository.save(wallet);
        syncChangeLogService.recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Transactional
    public void applyTransactionUpdate(Wallet wallet, BigDecimal oldAmount, TransactionType oldType,
                                       BigDecimal newAmount, TransactionType newType) {
        BigDecimal oldSigned = signedAmount(oldAmount, oldType);
        BigDecimal newSigned = signedAmount(newAmount, newType);
        wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(oldSigned).add(newSigned));
        walletRepository.save(wallet);
        syncChangeLogService.recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Transactional
    public void applyTransactionDelete(Wallet wallet, Transaction tx) {
        wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(signedAmount(tx.getAmount(), tx.getType())));
        walletRepository.save(wallet);
        syncChangeLogService.recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Transactional
    public void rebuildWalletBalance(Wallet wallet) {
        BigDecimal signedSum = transactionRepository.sumSignedAmountByWalletId(wallet.getWalletId());
        wallet.setCurrentBalance(wallet.getOpeningBalance().add(signedSum));
        walletRepository.save(wallet);
        syncChangeLogService.recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    private BigDecimal signedAmount(BigDecimal amount, TransactionType type) {
        if (type == TransactionType.INCOME) {
            return amount;
        }
        return amount.negate();
    }
}
