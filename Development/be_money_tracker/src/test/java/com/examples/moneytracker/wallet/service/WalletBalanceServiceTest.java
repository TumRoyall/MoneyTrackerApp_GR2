package com.examples.moneytracker.wallet.service;

import com.examples.moneytracker.sync.service.SyncChangeLogService;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.model.TransactionType;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletBalanceServiceTest {

    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private SyncChangeLogService syncChangeLogService;

    private WalletBalanceService walletBalanceService;

    @BeforeEach
    void setUp() {
        walletBalanceService = new WalletBalanceService(walletRepository, transactionRepository, syncChangeLogService);
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void applyTransactionCreate_updatesBalance() {
        Wallet wallet = buildWallet("100.00");
        Transaction tx = buildTransaction("20.00", TransactionType.EXPENSE);

        walletBalanceService.applyTransactionCreate(wallet, tx);

        assertThat(wallet.getCurrentBalance()).isEqualByComparingTo("80.00");
        verify(syncChangeLogService).recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Test
    void applyTransactionUpdate_rollsBackAndAppliesNew() {
        Wallet wallet = buildWallet("100.00");

        walletBalanceService.applyTransactionUpdate(
                wallet,
                new BigDecimal("40.00"),
                TransactionType.EXPENSE,
                new BigDecimal("10.00"),
                TransactionType.EXPENSE
        );

        assertThat(wallet.getCurrentBalance()).isEqualByComparingTo("130.00");
        verify(syncChangeLogService).recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Test
    void applyTransactionDelete_updatesBalance() {
        Wallet wallet = buildWallet("100.00");
        Transaction tx = buildTransaction("15.00", TransactionType.INCOME);

        walletBalanceService.applyTransactionDelete(wallet, tx);

        assertThat(wallet.getCurrentBalance()).isEqualByComparingTo("85.00");
        verify(syncChangeLogService).recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    @Test
    void rebuildWalletBalance_usesOpeningBalancePlusSignedSum() {
        Wallet wallet = buildWallet("100.00");
        when(transactionRepository.sumSignedAmountByWalletId(wallet.getWalletId()))
                .thenReturn(new BigDecimal("25.00"));

        walletBalanceService.rebuildWalletBalance(wallet);

        assertThat(wallet.getCurrentBalance()).isEqualByComparingTo("125.00");
        verify(syncChangeLogService).recordChange(wallet.getUserId(), "wallets", wallet.getWalletId(), "UPSERT");
    }

    private Wallet buildWallet(String openingBalance) {
        Wallet wallet = new Wallet();
        wallet.setWalletId(java.util.UUID.randomUUID());
        wallet.setUserId(java.util.UUID.randomUUID());
        wallet.setOpeningBalance(new BigDecimal(openingBalance));
        wallet.setCurrentBalance(new BigDecimal(openingBalance));
        return wallet;
    }

    private Transaction buildTransaction(String amount, TransactionType type) {
        Transaction tx = new Transaction();
        tx.setAmount(new BigDecimal(amount));
        tx.setType(type);
        return tx;
    }
}
