import * as SQLite from 'expo-sqlite';

export type SqlResult = SQLite.SQLResultSet;

type SqlStatement = {
  sql: string;
  params?: Array<string | number | null>;
};

const db = SQLite.openDatabase('moneytracker.db');

export const executeSql = (sql: string, params: Array<string | number | null> = []) =>
  new Promise<SqlResult>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return false;
        },
      );
    }, reject);
  });

export const executeBatch = (statements: SqlStatement[]) =>
  new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        statements.forEach((statement) => {
          tx.executeSql(statement.sql, statement.params ?? []);
        });
      },
      reject,
      () => resolve(),
    );
  });

export const queryAll = async <T>(sql: string, params: Array<string | number | null> = []) => {
  const result = await executeSql(sql, params);
  return (result.rows?._array ?? []) as T[];
};

export const queryOne = async <T>(sql: string, params: Array<string | number | null> = []) => {
  const result = await executeSql(sql, params);
  return (result.rows?._array?.[0] ?? null) as T | null;
};
