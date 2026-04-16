export const sanitizeMoneyInput = (value: string) => value.replace(/[^0-9]/g, '');

export const formatMoneyInput = (value: string | number) => {
  const numericValue = typeof value === 'number' ? String(value) : sanitizeMoneyInput(value);
  if (!numericValue) {
    return '';
  }
  return Number(numericValue).toLocaleString('vi-VN');
};

export const parseMoneyInput = (value: string) => {
  const numericValue = sanitizeMoneyInput(value);
  return numericValue ? Number(numericValue) : 0;
};

export const formatVndAmount = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;