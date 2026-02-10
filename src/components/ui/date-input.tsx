"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarPopup } from "./calendar-popup";

type DatePrecision = "full" | "month_year" | "year_only";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  calendarType: "solar" | "lunar";
  placeholder?: string;
  id?: string;
}

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: "full", label: "Ngày đầy đủ" },
  { value: "month_year", label: "Tháng & năm" },
  { value: "year_only", label: "Chỉ năm" },
];

/** Parse existing value string to extract date parts and detect precision */
function parseValue(value: string): {
  day: number | null;
  month: number | null;
  year: number | null;
  precision: DatePrecision;
  isRawText: boolean;
} {
  if (!value || !value.trim()) {
    return { day: null, month: null, year: null, precision: "full", isRawText: false };
  }

  const trimmed = value.trim();

  // Match DD/MM/YYYY
  const fullMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fullMatch) {
    return {
      day: parseInt(fullMatch[1]),
      month: parseInt(fullMatch[2]),
      year: parseInt(fullMatch[3]),
      precision: "full",
      isRawText: false,
    };
  }

  // Match MM/YYYY
  const monthYearMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    return {
      day: null,
      month: parseInt(monthYearMatch[1]),
      year: parseInt(monthYearMatch[2]),
      precision: "month_year",
      isRawText: false,
    };
  }

  // Match YYYY (4-digit year)
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      day: null,
      month: null,
      year: parseInt(yearMatch[1]),
      precision: "year_only",
      isRawText: false,
    };
  }

  // Cannot parse — treat as raw text
  return { day: null, month: null, year: null, precision: "full", isRawText: true };
}

/** Format date parts to string */
function formatDate(
  day: number | null,
  month: number | null,
  year: number | null,
  precision: DatePrecision
): string {
  if (precision === "year_only") {
    return year ? String(year) : "";
  }
  if (precision === "month_year") {
    if (!month || !year) return "";
    return `${String(month).padStart(2, "0")}/${year}`;
  }
  // full
  if (!day || !month || !year) return "";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** Generate year options from current year down to 1800 */
function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1800; y--) {
    years.push(y);
  }
  return years;
}

export function DateInput({ value, onChange, calendarType, placeholder, id }: DateInputProps) {
  const parsed = useMemo(() => parseValue(value), [value]);

  const [precision, setPrecision] = useState<DatePrecision>(parsed.precision);
  const [day, setDay] = useState<number | null>(parsed.day);
  const [month, setMonth] = useState<number | null>(parsed.month);
  const [year, setYear] = useState<number | null>(parsed.year);
  const [rawText, setRawText] = useState(parsed.isRawText ? value : "");
  const [isRawMode, setIsRawMode] = useState(parsed.isRawText);
  const [showCalendar, setShowCalendar] = useState(false);

  const yearOptions = useMemo(() => getYearOptions(), []);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseValue(value);
    setDay(p.day);
    setMonth(p.month);
    setYear(p.year);
    setPrecision(p.precision);
    if (p.isRawText) {
      setRawText(value);
      setIsRawMode(true);
    } else {
      setIsRawMode(false);
    }
  }, [value]);

  const emitChange = useCallback(
    (d: number | null, m: number | null, y: number | null, prec: DatePrecision) => {
      const formatted = formatDate(d, m, y, prec);
      onChange(formatted);
    },
    [onChange]
  );

  function handlePrecisionChange(newPrecision: DatePrecision) {
    setPrecision(newPrecision);
    setIsRawMode(false);
    // Re-emit with new precision
    emitChange(day, month, year, newPrecision);
  }

  function handleDayChange(val: string) {
    const d = val ? parseInt(val) : null;
    setDay(d);
    emitChange(d, month, year, precision);
  }

  function handleMonthChange(val: string) {
    const m = val ? parseInt(val) : null;
    setMonth(m);
    emitChange(day, m, year, precision);
  }

  function handleYearChange(val: string) {
    const y = val ? parseInt(val) : null;
    setYear(y);
    emitChange(day, month, y, precision);
  }

  function handleCalendarSelect(d: number, m: number, y: number) {
    setDay(d);
    setMonth(m);
    setYear(y);
    setShowCalendar(false);
    emitChange(d, m, y, "full");
  }

  function handleRawTextChange(val: string) {
    setRawText(val);
    onChange(val);
  }

  function switchToSelectorMode() {
    setIsRawMode(false);
    setRawText("");
    setDay(null);
    setMonth(null);
    setYear(null);
    onChange("");
  }

  // Should show calendar popup? Only for solar + full precision
  const showCalendarButton = calendarType === "solar" && precision === "full" && !isRawMode;
  // Should show dropdown selectors? For lunar, or partial precision, or non-raw mode
  const showDropdowns = !isRawMode;

  const selectClass =
    "rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] bg-white";

  return (
    <div className="space-y-2">
      {/* Precision toggle */}
      <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit">
        {PRECISION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePrecisionChange(opt.value)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap",
              precision === opt.value && !isRawMode
                ? "bg-[#8b4513] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Raw text mode (unparseable existing value) */}
      {isRawMode ? (
        <div className="flex gap-2">
          <input
            id={id}
            type="text"
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
          />
          <button
            type="button"
            onClick={switchToSelectorMode}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          >
            Chọn ngày
          </button>
        </div>
      ) : showDropdowns ? (
        <div className="relative flex gap-2 items-center">
          {/* Solar full date: text input + calendar icon */}
          {showCalendarButton ? (
            <>
              <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                }}
                placeholder={placeholder || "DD/MM/YYYY"}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              />
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
              </button>
              {showCalendar && (
                <CalendarPopup
                  selectedDay={day}
                  selectedMonth={month}
                  selectedYear={year}
                  onSelect={handleCalendarSelect}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </>
          ) : (
            <>
              {/* Dropdown selectors for lunar or partial modes */}
              {precision === "full" && (
                <select
                  value={day || ""}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={cn(selectClass, "w-[80px]")}
                >
                  <option value="">Ngày</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {(precision === "full" || precision === "month_year") && (
                <select
                  value={month || ""}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className={cn(selectClass, "w-[100px]")}
                >
                  <option value="">Tháng</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={year || ""}
                onChange={(e) => handleYearChange(e.target.value)}
                className={cn(selectClass, "w-[100px]")}
              >
                <option value="">Năm</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
