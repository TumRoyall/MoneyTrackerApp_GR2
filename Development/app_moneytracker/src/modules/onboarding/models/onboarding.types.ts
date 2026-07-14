export type UserType = 'STUDENT' | 'OFFICE_WORKER' | 'FREELANCER' | 'BUSINESS' | 'FAMILY' | null;

export type IncomeRange = 'UNDER_5M' | '5M_10M' | '10M_20M' | 'OVER_20M' | null;

export interface OnboardingData {
  userType: UserType;
  incomeRange: IncomeRange;
  selectedExpenseCategories: string[]; // categoryIds
  savingTargetPercent: number; // 10, 20, 30, 40
  isCompleted: boolean;
  completedAt: string | null;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  userType: null,
  incomeRange: null,
  selectedExpenseCategories: [],
  savingTargetPercent: 20,
  isCompleted: false,
  completedAt: null,
};

export const USER_TYPE_OPTIONS = [
  { emoji: '🎓', label: 'Sinh viên', value: 'STUDENT' as UserType },
  { emoji: '💼', label: 'Nhân viên văn phòng', value: 'OFFICE_WORKER' as UserType },
  { emoji: '💻', label: 'Freelancer', value: 'FREELANCER' as UserType },
  { emoji: '🏪', label: 'Kinh doanh', value: 'BUSINESS' as UserType },
  { emoji: '👨‍👩‍👧', label: 'Đã có gia đình', value: 'FAMILY' as UserType },
];

export const INCOME_RANGE_OPTIONS = [
  { label: 'Dưới 5 triệu', value: 'UNDER_5M' as IncomeRange },
  { label: '5 - 10 triệu', value: '5M_10M' as IncomeRange },
  { label: '10 - 20 triệu', value: '10M_20M' as IncomeRange },
  { label: 'Trên 20 triệu', value: 'OVER_20M' as IncomeRange },
];

export const SAVINGS_OPTIONS = [10, 20, 30, 40];
