export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const weekday = weekdays[date.getDay()];

  return `${weekday}, ${day} thg ${month}, ${year}`;
}

export function formatCurrency(amount: number): string {
  return `đ${Math.abs(amount).toLocaleString("vi-VN")}`;
}

export function calculateDateRange(
  timeFilter: string,
  selectedDate: Date,
  customFromDate?: Date | null,
  customToDate?: Date | null,
): { fromDate: string; toDate: string } {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const day = selectedDate.getDate();
  const weekDay = selectedDate.getDay();

  let fromDate: string, toDate: string;

  if (timeFilter === "Ngày") {
    fromDate = selectedDate.toISOString().split("T")[0];
    toDate = fromDate;
  } else if (timeFilter === "Tuần") {
    const first = new Date(selectedDate);
    first.setDate(day - weekDay + (weekDay === 0 ? -6 : 1));
    const last = new Date(first);
    last.setDate(first.getDate() + 6);
    fromDate = first.toISOString().split("T")[0];
    toDate = last.toISOString().split("T")[0];
  } else if (timeFilter === "Tháng") {
    fromDate = new Date(year, month, 1).toISOString().split("T")[0];
    toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
  } else if (timeFilter === "Năm") {
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;
  } else if (timeFilter === "Phạm vi tùy chỉnh") {
    fromDate = customFromDate?.toISOString().split("T")[0] || "";
    toDate = customToDate?.toISOString().split("T")[0] || "";
  } else {
    // Mọi thời gian
    fromDate = "";
    toDate = "";
  }

  return { fromDate, toDate };
}
