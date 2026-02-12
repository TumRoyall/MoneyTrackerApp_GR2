import * as SQLite from "expo-sqlite";
import { initializeSchema } from "./schema";
import { seedInitialData } from "./seed";

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database and create schema
 */
export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database;
  }

  try {
    database = await SQLite.openDatabaseAsync("moneytracker.db");

    // Enable foreign keys
    await database.execAsync("PRAGMA foreign_keys = ON;");

    // Initialize schema
    await initializeSchema(database);

    // Seed initial data (default categories, etc.)
    await seedInitialData(database);

    console.log("[DB] Database initialized successfully");
    return database;
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
};

/**
 * Get the database instance
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!database) {
    return initializeDatabase();
  }
  return database;
};

/**
 * Execute raw SQL query
 */
export const executeSQL = async (
  sql: string,
  params: any[] = [],
): Promise<SQLite.SQLiteResultSet> => {
  const db = await getDatabase();
  return db.runAsync(sql, params);
};

/**
 * Fetch rows from query
 */
export const fetchRows = async <T>(
  sql: string,
  params: any[] = [],
): Promise<T[]> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<T>(sql, params);
  return result || [];
};

/**
 * Fetch single row
 */
export const fetchOne = async <T>(
  sql: string,
  params: any[] = [],
): Promise<T | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<T>(sql, params);
  return result || null;
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (database) {
    await database.closeAsync();
    database = null;
  }
};
