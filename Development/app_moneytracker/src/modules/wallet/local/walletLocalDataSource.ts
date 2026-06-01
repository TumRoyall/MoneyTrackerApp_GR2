import { executeSql, queryAll, queryOne } from '@/core/db/sqlite';
import { Wallet } from '@/modules/wallet/models/wallet.types';

export class WalletLocalDataSource {
  async getWallets(): Promise<Wallet[]> {
    return queryAll<Wallet>("SELECT * FROM wallets WHERE (deletedAt IS NULL OR deletedAt = '') ORDER BY createdAt DESC");
  }

  async getWalletById(walletId: string): Promise<Wallet | null> {
    return queryOne<Wallet>('SELECT * FROM wallets WHERE walletId = ?', [walletId]);
  }

  async upsert(wallet: Wallet) {
    await executeSql(
      `INSERT OR REPLACE INTO wallets
        (walletId, name, type, currency, openingBalance, currentBalance, description, createdAt, updatedAt, deletedAt, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wallet.walletId,
        wallet.name,
        wallet.type,
        wallet.currency,
        wallet.openingBalance,
        wallet.currentBalance,
        wallet.description ?? null,
        wallet.createdAt,
        wallet.updatedAt ?? wallet.createdAt,
        wallet.deletedAt ?? null,
        wallet.version ?? 1,
      ],
    );
  }

  async upsertMany(wallets: Wallet[]) {
    for (const wallet of wallets) {
      await this.upsert(wallet);
    }
  }

  async markDeleted(walletId: string, deletedAt: string) {
    await executeSql('UPDATE wallets SET deletedAt = ?, updatedAt = ? WHERE walletId = ?', [
      deletedAt,
      deletedAt,
      walletId,
    ]);
  }
}
