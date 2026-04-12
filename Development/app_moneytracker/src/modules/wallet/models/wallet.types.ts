export interface Wallet {
  walletId: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface WalletCreateInput {
  name: string;
  type: string;
  currency: string;
  description?: string | null;
}

export interface WalletUpdateInput {
  name?: string;
  type?: string;
  currency?: string;
  description?: string | null;
}
