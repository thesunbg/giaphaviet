"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPopupProps {
  selectedDay: number | null;
  selectedMonth: number | null;
  selectedYear: number | null;
  onSelect: (day: number, month: number, year: number) => void;
  onClose: () => void;
}

const WEEKDAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/** Get day of week for first day of month (0=Monday, 6=Sunday) */
function getFirstDayOfWeek(month: number, year: number): number {
  const d = new Date(year, month - 1, 1).getDay(); // 0=Sunday
  return d === 0 ? 6 : d - 1; // Convert to Monday-first
}

export function CalendarPopup({
  selectedDay,
  selectedMonth,
  selectedYear,
  onSelect,
  onClose,
}: CalendarPopupProps) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(selectedMonth || now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(selectedYear || now.getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDayOfWeek = getFirstDayOfWeek(viewMonth, viewYear);

  // Previous month days
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevMonthYear = viewMonth === 1 ? viewYear - 1 : viewYear;
  const daysInPrevMonth = getDaysInMonth(prevMonth, prevMonthYear);

  // Build calendar grid cells
  const cells: Array<{ day: number; currentMonth: boolean }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, currentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }

  // Next month leading days
  const remaining = 42 - cells.length; // 6 rows * 7 cols
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false });
  }

  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();
  const isToday = (day: number) =>
    day === todayDay && viewMonth === todayMonth && viewYear === todayYear;

  const isSelected = (day: number) =>
    day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  function prevMonthNav() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonthNav() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-50 w-[280px]"
    >
      {/* Header navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonthNav}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-800">
          {MONTH_NAMES[viewMonth - 1]}, {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonthNav}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            disabled={!cell.currentMonth}
            onClick={() => {
              if (cell.currentMonth) {
                onSelect(cell.day, viewMonth, viewYear);
              }
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm mx-auto cursor-pointer transition-colors",
              !cell.currentMonth && "text-gray-300 cursor-default",
              cell.currentMonth && !isSelected(cell.day) && !isToday(cell.day) && "text-gray-700 hover:bg-[#8b4513]/10",
              cell.currentMonth && isToday(cell.day) && !isSelected(cell.day) && "border border-[#8b4513] font-semibold text-[#8b4513]",
              cell.currentMonth && isSelected(cell.day) && "bg-[#8b4513] text-white font-semibold"
            )}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </div>
  );
}
