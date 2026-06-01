import { executeSql, queryAll, queryOne } from '@/core/db/sqlite';
import { Transaction, TransactionFilters } from '@/modules/transaction/models/transaction.types';

export class TransactionLocalDataSource {
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const conditions: string[] = ['deletedAt IS NULL'];
    const params: Array<string | number | null> = [];

    if (filters?.walletId) {
      conditions.push('walletId = ?');
      params.push(filters.walletId);
    }
    if (filters?.categoryId) {
      conditions.push('categoryId = ?');
      params.push(filters.categoryId);
    }
    if (filters?.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters?.fromDate) {
      conditions.push('date >= ?');
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      conditions.push('date <= ?');
      params.push(filters.toDate);
    }
    if (filters?.keyword) {
      conditions.push('note LIKE ?');
      params.push(`%${filters.keyword}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, createdAt DESC`;

    return queryAll<Transaction>(sql, params);
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return queryOne<Transaction>('SELECT * FROM transactions WHERE transactionId = ?', [transactionId]);
  }

  async upsert(transaction: Transaction) {
    await executeSql(
      `INSERT OR REPLACE INTO transactions
        (transactionId, walletId, categoryId, amount, type, note, date, createdAt, updatedAt, deletedAt, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.transactionId,
        transaction.walletId,
        transaction.categoryId,
        transaction.amount,
        transaction.type ?? 'EXPENSE',
        transaction.note ?? null,
        transaction.date,
        transaction.createdAt,
        transaction.updatedAt ?? transaction.createdAt,
        transaction.deletedAt ?? null,
        transaction.version ?? 1,
      ],
    );
  }

  async upsertMany(transactions: Transaction[]) {
    for (const tx of transactions) {
      await this.upsert(tx);
    }
  }

  async markDeleted(transactionId: string, deletedAt: string) {
    await executeSql('UPDATE transactions SET deletedAt = ?, updatedAt = ? WHERE transactionId = ?', [
      deletedAt,
      deletedAt,
      transactionId,
    ]);
  }
}
