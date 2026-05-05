"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  className?: string;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function toDisplay(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${y}/${m}/${d}`;
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days: (number | null)[] = Array(first).fill(null);
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function DatePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const initYear = value ? parseInt(value.slice(0, 4)) : today.getFullYear();
  const initMonth = value ? parseInt(value.slice(5, 7)) - 1 : today.getMonth();
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [pending, setPending] = useState(value); // 未確定の選択
  const ref = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const y = value ? parseInt(value.slice(0, 4)) : today.getFullYear();
    const m = value ? parseInt(value.slice(5, 7)) - 1 : today.getMonth();
    setViewYear(y);
    setViewMonth(m);
    setPending(value);
    setOpen(true);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    setPending(`${viewYear}-${mm}-${dd}`);
  };

  const confirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(pending);
    setOpen(false);
  };

  const cancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPending("");
    onChange("");
    setOpen(false);
  };

  const days = buildCalendar(viewYear, viewMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div ref={ref} className="relative">
      {/* 表示フィールド */}
      <div
        onClick={openCalendar}
        className={`${className} cursor-pointer flex items-center justify-between select-none`}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value ? toDisplay(value) : "日付を選択"}
        </span>
        <span className="text-gray-400 text-base">📅</span>
      </div>

      {/* カレンダーポップオーバー */}
      {open && (
        <div
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* 月ナビゲーション */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-lg">
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {viewYear}年 {viewMonth + 1}月
            </span>
            <button type="button" onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-lg">
              ›
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
                {w}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, i) => {
              if (!day) return <div key={i} />;
              const mm = String(viewMonth + 1).padStart(2, "0");
              const dd = String(day).padStart(2, "0");
              const dateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = dateStr === pending;
              const isToday = dateStr === todayStr;
              const isSun = i % 7 === 0;
              const isSat = i % 7 === 6;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => selectDay(e, day)}
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors
                    ${isSelected ? "bg-blue-600 text-white font-bold" : "hover:bg-gray-100"}
                    ${isToday && !isSelected ? "border border-blue-400 text-blue-600 font-semibold" : ""}
                    ${!isSelected && isSun ? "text-red-400" : ""}
                    ${!isSelected && isSat ? "text-blue-400" : ""}
                    ${!isSelected && !isSun && !isSat ? "text-gray-700" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* ボタン */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={clear}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              クリア
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={cancel}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
              <button type="button" onClick={confirm}
                className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
