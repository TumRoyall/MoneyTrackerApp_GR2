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
  userId: string | null;
  displayName: string;
  guestName?: string;
  guestEmail?: string;
  avatarUrl?: string;
  role: EventMemberRole;
  isOwner: boolean;
  isGuest: boolean;
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
  guestName?: string;
  walletId?: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  note?: string;
  date: string;
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

export interface JoinEventInput {
  shareCode: string;
}

export interface CreateGuestTransactionInput {
  creatorName: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  note?: string;
  date: string;
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
  walletId: string;
}

export interface UpdateEventTransactionInput {
  note?: string;
  amount?: number;
  categoryId?: string;
}

// ==================== MEMBER MANAGEMENT (mới) ====================

export interface AddMemberInput {
  guestName: string;
  guestEmail: string;
}

export interface UpdateMemberInput {
  displayName?: string;
  role?: EventMemberRole;
  /**
   * Chỉ áp dụng cho guest member. Khi update email mà không kèm displayName,
   * server sẽ tự động đặt guestName = email mới.
   */
  guestEmail?: string;
}