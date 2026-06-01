import * as SQLite from 'expo-sqlite';

export type SqlResult = {
  insertId?: number;
  rowsAffected: number;
};

export type SqlStatement = {
  sql: string;
  params?: Array<string | number | null>;
};

const db = SQLite.openDatabaseSync('moneytracker.db');

export const executeSql = async (sql: string, params: Array<string | number | null> = []): Promise<SqlResult> => {
  const safeParams = params.map(p => {
    if (p === null || typeof p === 'undefined') return '';
    if (typeof p === 'object') {
      try { return JSON.stringify(p); } catch { return String(p); }
    }
    return p;
  });
  
  let statement;
  try {
    statement = await db.prepareAsync(sql);
    const result = await statement.executeAsync(...safeParams);
    return {
      insertId: result.lastInsertRowId,
      rowsAffected: result.changes,
    };
  } catch (error) {
    console.error(`[SQLite Error] Query: ${sql} | Params: ${JSON.stringify(safeParams)} | Error:`, error);
    throw error;
  } finally {
    if (statement) {
      await statement.finalizeAsync();
    }
  }
};

export const executeBatch = async (statements: SqlStatement[]) => {
  await db.withTransactionAsync(async () => {
    for (const statement of statements) {
      const safeParams = (statement.params ?? []).map(p => {
        if (p === null || typeof p === 'undefined') return '';
        if (typeof p === 'object') {
          try { return JSON.stringify(p); } catch { return String(p); }
        }
        return p;
      });
      let stmt;
      try {
        stmt = await db.prepareAsync(statement.sql);
        await stmt.executeAsync(...safeParams);
      } catch (error) {
        console.error(`[SQLite Error executeBatch] Query: ${statement.sql} | Params: ${JSON.stringify(safeParams)} | Error:`, error);
        throw error;
      } finally {
        if (stmt) {
          await stmt.finalizeAsync();
        }
      }
    }
  });
};

export const queryAll = async <T>(sql: string, params: Array<string | number | null> = []) => {
  const safeParams = params.map(p => {
    if (p === null || typeof p === 'undefined') return '';
    if (typeof p === 'object') {
      try { return JSON.stringify(p); } catch { return String(p); }
    }
    return p;
  });
  try {
    return await db.getAllAsync<T>(sql, ...safeParams);
  } catch (error) {
    console.error(`[SQLite Error queryAll] Query: ${sql} | Params: ${JSON.stringify(safeParams)} | Error:`, error);
    throw error;
  }
};

export const queryOne = async <T>(sql: string, params: Array<string | number | null> = []) => {
  const safeParams = params.map(p => {
    if (p === null || typeof p === 'undefined') return '';
    if (typeof p === 'object') {
      try { return JSON.stringify(p); } catch { return String(p); }
    }
    return p;
  });
  try {
    return (await db.getFirstAsync<T>(sql, ...safeParams)) ?? null;
  } catch (error) {
    console.error(`[SQLite Error queryOne] Query: ${sql} | Params: ${JSON.stringify(safeParams)} | Error:`, error);
    throw error;
  }
};
