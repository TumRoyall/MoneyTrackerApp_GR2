import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';

export interface TransactionForExport {
  date: string;
  categoryName: string;
  type: string;
  amount: number;
  note?: string | null;
  walletName?: string;
}

const formatCSVLine = (values: (string | number | boolean | null | undefined)[]): string => {
  return values
    .map((val) => {
      const str = val === null || val === undefined ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
};

const generateCSVContent = (transactions: TransactionForExport[]): string => {
  const headers = ['Ngày', 'Danh mục', 'Loại', 'Số tiền (VND)', 'Ghi chú', 'Ví'];
  const headerLine = formatCSVLine(headers);

  const dataLines = transactions.map((tx) =>
    formatCSVLine([
      tx.date,
      tx.categoryName,
      tx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu',
      tx.amount,
      tx.note || '',
      tx.walletName || '',
    ])
  );

  return [headerLine, ...dataLines].join('\n');
};

// Group transactions by month for CSV export
export const groupTransactionsByMonth = (
  transactions: TransactionForExport[]
): Map<string, TransactionForExport[]> => {
  const grouped = new Map<string, TransactionForExport[]>();

  transactions.forEach((tx) => {
    const monthKey = tx.date.substring(0, 7);
    const existing = grouped.get(monthKey) || [];
    existing.push(tx);
    grouped.set(monthKey, existing);
  });

  const sortedMap = new Map(
    [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  );

  return sortedMap;
};

export const exportTransactionsByMonthToCSV = async (
  transactions: TransactionForExport[]
): Promise<void> => {
  const grouped = groupTransactionsByMonth(transactions);
  const lines: string[] = [];

  grouped.forEach((txs, month) => {
    lines.push(`\n=== ${month} ===`);
    lines.push(formatCSVLine(['Ngày', 'Danh mục', 'Loại', 'Số tiền (VND)', 'Ghi chú', 'Ví']));

    txs.forEach((tx) => {
      lines.push(
        formatCSVLine([
          tx.date,
          tx.categoryName,
          tx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu',
          tx.amount,
          tx.note || '',
          tx.walletName || '',
        ])
      );
    });

    const monthIncome = txs
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthExpense = txs
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    lines.push(formatCSVLine(['', '', 'Tổng thu:', monthIncome, '', '']));
    lines.push(formatCSVLine(['', '', 'Tổng chi:', monthExpense, '', '']));
    lines.push(formatCSVLine(['', '', 'Chênh lệch:', monthIncome - monthExpense, '', '']));
  });

  const totalIncome = transactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);

  lines.push('\n=== TỔNG CỘNG ===');
  lines.push(formatCSVLine(['', '', 'Tổng thu:', totalIncome, '', '']));
  lines.push(formatCSVLine(['', '', 'Tổng chi:', totalExpense, '', '']));
  lines.push(formatCSVLine(['', '', 'Chênh lệch:', totalIncome - totalExpense, '', '']));

  const csvContent = lines.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `MoneyTracker_BaoCao_${timestamp}.csv`;

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent);

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Thiết bị không hỗ trợ chia sẻ file');
  }

  // Share the file - this will open system share dialog
  // On Android, user can choose "Save to Downloads" or any app
  // On iOS, user can choose "Save to Files" or any app
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Xuất báo cáo MoneyTracker',
    UTI: 'public.comma-separated-values-text',
  });
};
