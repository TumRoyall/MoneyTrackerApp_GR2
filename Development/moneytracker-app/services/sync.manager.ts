/**
 * Sync Manager - Local ↔ Cloud Synchronization
 *
 * Purpose:
 * - Lưu dữ liệu cá nhân trên LOCAL (SQLite) để nhanh
 * - Sync lên CLOUD (backend) khi có mạng
 * - Handle conflict resolution
 * - Batch sync để tiết kiệm bandwidth
 *
 * Architecture:
 * - Local SQLite (source of truth for UI)
 * - Cloud Backend (source of truth for data)
 * - Sync queue (pending changes)
 *
 * Data Entities:
 * - Accounts
 * - Transactions
 * - Categories (mostly static, sync on app start)
 */

import * as authStorage from "./auth.storage";
import api from "./axios";

/**
 * SYNC TYPES
 */

export interface SyncItem {
  id: string;
  entity_type: "account" | "transaction" | "category";
  operation: "create" | "update" | "delete";
  local_data: any;
  sync_status: "pending" | "syncing" | "synced" | "failed";
  last_error?: string;
  created_at: number;
  synced_at?: number;
}

export interface SyncStatus {
  total_pending: number;
  last_sync: number | null;
  last_sync_error?: string;
  syncing: boolean;
}

/**
 * SYNC MANAGER - Quản lý sync queue
 */

class SyncManager {
  private syncQueue: Map<string, SyncItem> = new Map();
  private isSyncing = false;

  /**
   * Thêm item vào sync queue
   */
  addToQueue(item: SyncItem): void {
    this.syncQueue.set(item.id, item);
    console.log("[SyncManager] Added to queue:", item.entity_type, item.id);
  }

  /**
   * Lấy pending items
   */
  getPendingItems(): SyncItem[] {
    return Array.from(this.syncQueue.values()).filter(
      (item) => item.sync_status === "pending",
    );
  }

  /**
   * MAIN SYNC FUNCTION - Sync tất cả pending items
   *
   * Gọi khi:
   * - App start (có mạng)
   * - Pull-to-refresh
   * - Periodic sync (background)
   */
  async syncAll(): Promise<SyncStatus> {
    if (this.isSyncing) {
      console.log("[SyncManager] Sync already in progress");
      return {
        total_pending: this.getPendingItems().length,
        last_sync: null,
        syncing: true,
      };
    }

    try {
      this.isSyncing = true;
      console.log("[SyncManager] Starting sync...");

      const pendingItems = this.getPendingItems();
      console.log("[SyncManager] Pending items:", pendingItems.length);

      if (pendingItems.length === 0) {
        console.log("[SyncManager] No pending items");
        return {
          total_pending: 0,
          last_sync: Date.now(),
          syncing: false,
        };
      }

      // Get token
      const token = await authStorage.getToken();
      if (!token) {
        throw new Error("No token found");
      }

      // Sync each item
      for (const item of pendingItems) {
        try {
          await this.syncItem(item, token);
        } catch (error) {
          console.error("[SyncManager] Failed to sync item:", item.id, error);
          item.sync_status = "failed";
          item.last_error = String(error);
        }
      }

      console.log("[SyncManager] Sync completed");

      return {
        total_pending: this.getPendingItems().length,
        last_sync: Date.now(),
        syncing: false,
      };
    } catch (error: any) {
      console.error("[SyncManager] Sync failed:", error);
      return {
        total_pending: this.getPendingItems().length,
        last_sync: null,
        last_sync_error: error.message,
        syncing: false,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single item to backend
   */
  private async syncItem(item: SyncItem, token: string): Promise<void> {
    item.sync_status = "syncing";
    console.log("[SyncManager] Syncing:", item.entity_type, item.id);

    let endpoint = `/api/${item.entity_type}`;
    let method: "post" | "put" | "delete" = "post";

    switch (item.operation) {
      case "create":
        method = "post";
        break;
      case "update":
        method = "put";
        endpoint += `/${item.id}`;
        break;
      case "delete":
        method = "delete";
        endpoint += `/${item.id}`;
        break;
    }

    const response = await api({
      method,
      url: endpoint,
      data: item.local_data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status >= 200 && response.status < 300) {
      item.sync_status = "synced";
      item.synced_at = Date.now();
      console.log("[SyncManager] Synced:", item.entity_type, item.id);
    } else {
      throw new Error(`Sync failed with status ${response.status}`);
    }
  }

  /**
   * GET SYNC STATUS
   */
  getStatus(): SyncStatus {
    return {
      total_pending: this.getPendingItems().length,
      last_sync: null,
      syncing: this.isSyncing,
    };
  }

  /**
   * CLEAR SYNCED ITEMS
   */
  clearSynced(): void {
    let cleared = 0;
    this.syncQueue.forEach((item, id) => {
      if (item.sync_status === "synced") {
        this.syncQueue.delete(id);
        cleared++;
      }
    });
    console.log("[SyncManager] Cleared synced items:", cleared);
  }
}

export const syncManager = new SyncManager();

/**
 * SYNC API - Backend endpoints
 */

/**
 * Download accounts from backend
 *
 * Gọi khi app start hoặc pull-to-refresh
 * Lưu vào local SQLite
 */
export const downloadAccounts = async (): Promise<any[]> => {
  try {
    const token = await authStorage.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    console.log("[Sync] Downloading accounts...");

    const response = await api.get("/api/accounts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[Sync] Downloaded accounts:", response.data.length);
    return response.data;
  } catch (error: any) {
    console.error("[Sync] Download accounts failed:", error);
    throw error;
  }
};

/**
 * Download transactions from backend
 *
 * Query params:
 * - from_date: ISO date
 * - to_date: ISO date
 * - account_id: filter
 */
export const downloadTransactions = async (filters?: {
  from_date?: string;
  to_date?: string;
  account_id?: string;
}): Promise<any[]> => {
  try {
    const token = await authStorage.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    console.log("[Sync] Downloading transactions...", filters);

    const response = await api.get("/api/transactions", {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[Sync] Downloaded transactions:", response.data.length);
    return response.data;
  } catch (error: any) {
    console.error("[Sync] Download transactions failed:", error);
    throw error;
  }
};

/**
 * Download categories
 *
 * Categories mostly static, download once on app start
 */
export const downloadCategories = async (): Promise<any[]> => {
  try {
    const token = await authStorage.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    console.log("[Sync] Downloading categories...");

    const response = await api.get("/api/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[Sync] Downloaded categories:", response.data.length);
    return response.data;
  } catch (error: any) {
    console.error("[Sync] Download categories failed:", error);
    throw error;
  }
};

/**
 * BATCH SYNC - Upload multiple items at once
 *
 * Giảm số lần gọi API
 */
export const batchSync = async (items: SyncItem[]): Promise<void> => {
  try {
    const token = await authStorage.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    console.log("[Sync] Batch syncing", items.length, "items");

    await api.post(
      "/api/sync/batch",
      { items },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("[Sync] Batch sync completed");
  } catch (error: any) {
    console.error("[Sync] Batch sync failed:", error);
    throw error;
  }
};

/**
 * GET SYNC STATUS - Từ backend
 *
 * Biết backend có data mới nào không
 */
export const getSyncStatus = async (): Promise<{
  new_transactions: number;
  new_accounts: number;
  deleted_items: any[];
}> => {
  try {
    const token = await authStorage.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    console.log("[Sync] Getting backend sync status...");

    const response = await api.get("/api/sync/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("[Sync] Get sync status failed:", error);
    throw error;
  }
};
