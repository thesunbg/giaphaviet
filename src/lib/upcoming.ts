import { lunarToSolar, lunarYearOf } from "@/lib/lunar";

/**
 * Dữ liệu ngày tháng trong gia phả là chữ tự do ("Mùng 10 tháng 3 âm lịch",
 * "15/03/1990", "1920"...). Các hàm dưới đây cố gắng đọc ra ngày/tháng rồi
 * tính lần kế tiếp (ngày giỗ âm lịch được quy đổi sang dương lịch).
 */

export interface DayMonth {
  day: number;
  month: number;
}

/** Đọc ngày/tháng từ chuỗi tự do; trả null nếu chỉ có năm hoặc không đọc được */
export function parseDayMonth(input: string | null | undefined): DayMonth | null {
  if (!input) return null;
  const text = input.toLowerCase().trim();

  // "15/03/1990", "15-03", "15.3"
  const slash = text.match(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { day, month };
  }

  // "mùng 10 tháng 3", "mồng 5 tháng 7", "ngày 20 tháng 12"
  const vn = text.match(/(?:mùng|mồng|ngày)?\s*(\d{1,2})\s*tháng\s*(\d{1,2})/);
  if (vn) {
    const day = Number(vn[1]);
    const month = Number(vn[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { day, month };
  }

  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isRealSolarDate(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1;
}

/**
 * Lần kế tiếp của một ngày kỷ niệm (ngày giỗ, sinh nhật, sự kiện hằng năm).
 * Với âm lịch, thử năm âm lịch hiện tại rồi năm sau, quy đổi ra dương lịch.
 */
export function nextOccurrence(
  dayMonth: DayMonth,
  calendarType: string | null | undefined,
  from: Date = new Date()
): Date | null {
  const today = startOfDay(from);
  const { day, month } = dayMonth;

  if (calendarType === "lunar") {
    const baseYear = lunarYearOf(today);
    for (const lunarYear of [baseYear, baseYear + 1]) {
      const [dd, mm, yy] = lunarToSolar(day, month, lunarYear);
      if (!dd) continue;
      const candidate = new Date(yy, mm - 1, dd);
      if (candidate >= today) return candidate;
    }
    return null;
  }

  for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
    if (!isRealSolarDate(day, month, year)) continue;
    const candidate = new Date(year, month - 1, day);
    if (candidate >= today) return candidate;
  }
  return null;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export interface UpcomingItem {
  type: "anniversary" | "birthday" | "event";
  memberId: string;
  memberName: string;
  generation: number;
  label: string;
  /** chuỗi gốc trong dữ liệu, ví dụ "Mùng 10 tháng 3 âm lịch" */
  rawDate: string;
  calendarType: string;
  /** ngày dương lịch của lần kế tiếp, dạng ISO yyyy-mm-dd */
  solarDate: string;
  daysUntil: number;
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Mô tả thân thiện: "Hôm nay", "Ngày mai", "Còn 5 ngày" */
export function describeDaysUntil(days: number): string {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  return `Còn ${days} ngày`;
}
