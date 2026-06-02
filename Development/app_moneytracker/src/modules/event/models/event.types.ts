export type EventStatus = 'ACTIVE' | 'SETTLED' | 'ARCHIVED';

export type EventMemberRole = 'OWNER' | 'MEMBER';

export interface Event {
  eventId: string;
  name: string;
  icon: string;
  description?: string;
  shareCode: string;
  shareLink: string;
  status: EventStatus;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  totalSpent: number;
  transactionCount: number;
}

export interface EventDetail extends Event {
  updatedAt: string;
  version: number;
  perPersonShare: number;
}

export interface EventMember {
  id: string;
  eventId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: EventMemberRole;
  joinedAt: string;
  contribution: number;
  transactionCount: number;
  balance: number;
}

export interface EventTransaction {
  id: string;
  eventId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  payerId: string;
  payerName: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  note?: string;
  date: string;
  isTransferFromPersonal?: boolean;
  personalWalletId?: string;
  createdAt: string;
  version: number;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  contribution: number;
  balance: number;
}

export interface SettlementItem {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface Settlement {
  eventId: string;
  totalSpent: number;
  memberCount: number;
  perPersonShare: number;
  memberBalances: MemberBalance[];
  settlements: SettlementItem[];
}

export interface CreateEventInput {
  name: string;
  icon?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateEventInput {
  name?: string;
  icon?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateEventTransactionInput {
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  payerId?: string;
  isTransferFromPersonal?: boolean;
  personalWalletId?: string;
}

export interface UpdateEventTransactionInput {
  note?: string;
  amount?: number;
  categoryId?: string;
}