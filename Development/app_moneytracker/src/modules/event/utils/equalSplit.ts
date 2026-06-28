import type { EventMember, EventTransaction } from '@/modules/event/models/event.types';

/**
 * Participant trong chế độ "Chia đều (kể cả khách)".
 * Mỗi người có 2 ô nhập:
 *   - paid: tổng đã chi (auto-fill từ contribution, user có thể sửa)
 *   - received: tổng đã nhận (vd: thù lao, ứng trước — mặc định 0, user tự nhập)
 */
export interface EqualSplitParticipant {
  /** Member ID, hoặc synthetic ID cho guest (vd: "guest:hung@x.com") */
  id: string;
  /** Tên hiển thị */
  name: string;
  /** Email (chỉ có với guest) */
  email?: string;
  /** True nếu là guest */
  isGuest: boolean;
  /** True nếu là user hiện tại */
  isCurrentUser?: boolean;
  /** Tổng đã chi (auto-fill, có thể sửa) */
  paid: number;
  /** Tổng đã nhận (user nhập tay) */
  received: number;
}

export interface EqualSplitRow {
  participant: EqualSplitParticipant;
  /** = totalSpent / participantCount */
  share: number;
  /** = paid - received - share (>0: được nhận, <0: phải trả) */
  net: number;
}

export interface EqualSplitTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface EqualSplitResult {
  totalSpent: number;
  participantCount: number;
  perPersonShare: number;
  rows: EqualSplitRow[];
  transfers: EqualSplitTransfer[];
}

/**
 * Tính paid cho từng member bằng cách sum transactions theo createdBy (user)
 * hoặc guestName (guest). Bỏ qua member có paid = 0 và received = 0.
 */
export function buildEqualSplitParticipants(
  members: EventMember[],
  transactions: EventTransaction[]
): EqualSplitParticipant[] {
  const participants: EqualSplitParticipant[] = [];

  for (const member of members) {
    let paid = 0;

    if (member.userId) {
      // User member — match theo creatorId
      paid = transactions
        .filter((tx) => tx.creatorId === member.userId)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    } else {
      // Guest member — match theo guestName (đã unique trong event nhờ auto-promote)
      const guestKey = member.guestName ?? member.displayName;
      if (guestKey) {
        paid = transactions
          .filter((tx) => tx.guestName === guestKey)
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      }
    }

    participants.push({
      id: member.id,
      name: member.displayName,
      email: member.guestEmail,
      isGuest: !member.userId,
      isCurrentUser: !!member.userId && member.userId === member.userId, // placeholder, UI sẽ override
      paid,
      received: 0,
    });
  }

  // Chỉ giữ member đã tham gia (paid > 0)
  return participants.filter((p) => p.paid > 0);
}

/**
 * Tính breakdown equal-split:
 *   - perPersonShare = totalSpent / participantCount
 *   - net = paid - received - share
 *   - Greedy match creditors ↔ debtors để tối ưu số lệnh chuyển
 */
export function calculateEqualSplit(
  participants: EqualSplitParticipant[],
  totalSpent: number
): EqualSplitResult {
  const count = participants.length;
  const perPersonShare = count > 0 ? totalSpent / count : 0;

  const rows: EqualSplitRow[] = participants.map((p) => ({
    participant: p,
    share: perPersonShare,
    net: p.paid - p.received - perPersonShare,
  }));

  // Greedy: sort creditors giảm dần, debtors tăng dần theo |balance|
  const creditors = rows
    .filter((r) => r.net > 0)
    .map((r) => ({ row: r, remaining: r.net }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = rows
    .filter((r) => r.net < 0)
    .map((r) => ({ row: r, remaining: -r.net })) // lưu dương cho dễ
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: EqualSplitTransfer[] = [];

  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.remaining, d.remaining);

    // Làm tròn 2 chữ số thập phân để tránh floating point
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) {
      transfers.push({
        fromId: d.row.participant.id,
        fromName: d.row.participant.name,
        toId: c.row.participant.id,
        toName: c.row.participant.name,
        amount: rounded,
      });
    }

    c.remaining -= amount;
    d.remaining -= amount;

    if (c.remaining <= 0.01) i++;
    if (d.remaining <= 0.01) j++;
  }

  return {
    totalSpent,
    participantCount: count,
    perPersonShare,
    rows,
    transfers,
  };
}

/**
 * Format breakdown thành text multi-line để copy ra clipboard.
 */
export function formatEqualSplitReport(
  eventName: string,
  result: EqualSplitResult
): string {
  const fmt = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`;
  const lines: string[] = [];

  lines.push(`BÁO CÁO CHIA ĐỀU - ${eventName}`);
  lines.push(`Tổng chi: ${fmt(result.totalSpent)}`);
  lines.push(`Số người: ${result.participantCount}`);
  lines.push(`Mỗi người: ${fmt(result.perPersonShare)}`);
  lines.push('');
  lines.push('CHI TIẾT:');

  for (const row of result.rows) {
    const sign = row.net > 0 ? '+' : '';
    lines.push(
      `• ${row.participant.name}: đã chi ${fmt(row.participant.paid)}, đã nhận ${fmt(row.participant.received)} → ${sign}${fmt(row.net)}`
    );
  }

  if (result.transfers.length > 0) {
    lines.push('');
    lines.push('LỆNH CHUYỂN:');
    for (const t of result.transfers) {
      lines.push(`• ${t.fromName} → ${t.toName}: ${fmt(t.amount)}`);
    }
  } else {
    lines.push('');
    lines.push('Không có lệnh chuyển (đã chia đều).');
  }

  return lines.join('\n');
}