export const AppRoutes = {
  auth: {
    login: 'login',
    register: 'register',
  },
  tabs: {
    wallets: 'wallets',
    transactions: 'transactions',
    budgets: 'budgets',
    reports: 'reports',
  },
} as const;

export type AppRoute =
  | typeof AppRoutes.auth[keyof typeof AppRoutes.auth]
  | typeof AppRoutes.tabs[keyof typeof AppRoutes.tabs];
