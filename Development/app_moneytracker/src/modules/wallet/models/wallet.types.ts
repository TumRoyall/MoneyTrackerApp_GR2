export type WalletType = 'REGULAR' | 'CASH' | 'SAVING' | 'DEBT' | 'INVEST' | 'EVENT';

export interface Wallet {
  walletId: string;
  name: string;
  type: WalletType | string;
  currency: string;
  currentBalance: number;
  description?: string | null;
  createdAt: string;
}

export interface WalletCreateInput {
  name: string;
  type: WalletType;
  currency: string;
  currentBalance?: number;
  description?: string | null;
}

export interface WalletUpdateInput {
  name?: string;
  type?: WalletType;
  currency?: string;
  currentBalance?: number;
  description?: string | null;
}
