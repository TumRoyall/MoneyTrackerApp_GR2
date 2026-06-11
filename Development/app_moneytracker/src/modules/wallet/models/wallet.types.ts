export type WalletType = 'REGULAR' | 'CASH' | 'SAVING' | 'DEBT' | 'INVEST' | 'EVENT';

export interface Wallet {
  walletId: string;
  name: string;
  type: WalletType | string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  version?: number | null;
}

export interface WalletCreateInput {
  name: string;
  type: WalletType;
  currency: string;
  openingBalance?: number;
  description?: string | null;
}

export interface WalletUpdateInput {
  name?: string;
  type?: WalletType;
  currency?: string;
  openingBalance?: number;
  description?: string | null;
}
