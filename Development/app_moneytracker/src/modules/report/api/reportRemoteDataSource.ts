import {
  ReportByCategoryItem,
  ReportByTimeItem,
  ReportByWalletItem,
  ReportFilters,
  ReportSummary,
} from '@/modules/report/models/report.types';

export interface ReportRemoteDataSource {
  getSummary(filters: ReportFilters): Promise<ReportSummary>;
  getByTime(filters: ReportFilters): Promise<ReportByTimeItem[]>;
  getByCategory(filters: ReportFilters): Promise<ReportByCategoryItem[]>;
  getByWallet(filters: ReportFilters): Promise<ReportByWalletItem[]>;
}
