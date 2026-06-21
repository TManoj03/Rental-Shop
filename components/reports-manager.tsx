"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  IndianRupee,
  Receipt,
  Wallet,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Booking, MaintenanceLog } from "@/lib/mock-data";
import * as XLSX from "xlsx";

interface ReportsManagerProps {
  bookings: Booking[];
  maintenanceLogs: MaintenanceLog[];
}

type PeriodType = "day" | "week" | "month" | "year";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameWeek(a: Date, b: Date) {
  const { start, end } = getWeekRange(b);
  return a >= start && a <= end;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameYear(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear();
}

function formatPeriodLabel(period: PeriodType, ref: Date) {
  if (period === "day")
    return ref.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  if (period === "week") {
    const { start, end } = getWeekRange(ref);
    return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (period === "month")
    return ref.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return ref.getFullYear().toString();
}

function navigateDate(period: PeriodType, ref: Date, direction: -1 | 1): Date {
  const d = new Date(ref);
  if (period === "day") d.setDate(d.getDate() + direction);
  else if (period === "week") d.setDate(d.getDate() + direction * 7);
  else if (period === "month") d.setMonth(d.getMonth() + direction);
  else d.setFullYear(d.getFullYear() + direction);
  return d;
}

export function ReportsManager({
  bookings,
  maintenanceLogs,
}: ReportsManagerProps) {
  const [period, setPeriod] = useState<PeriodType>("month");
  const [refDate, setRefDate] = useState<Date>(new Date());

  const periods: { id: PeriodType; label: string }[] = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  // Filter bookings for the selected period
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const d = new Date(b.startDate);
      if (period === "day") return isSameDay(d, refDate);
      if (period === "week") return isSameWeek(d, refDate);
      if (period === "month") return isSameMonth(d, refDate);
      return isSameYear(d, refDate);
    });
  }, [bookings, period, refDate]);

  // Filter maintenance for the selected period
  const filteredMaintenance = useMemo(() => {
    return maintenanceLogs.filter((m) => {
      const d = new Date(m.reportedDate);
      if (period === "day") return isSameDay(d, refDate);
      if (period === "week") return isSameWeek(d, refDate);
      if (period === "month") return isSameMonth(d, refDate);
      return isSameYear(d, refDate);
    });
  }, [maintenanceLogs, period, refDate]);

  // Revenue: total cost of active/completed/overdue bookings
  const totalIncome = filteredBookings
    .filter(
      (b) =>
        b.status === "Completed" ||
        b.status === "Active" ||
        b.status === "Overdue",
    )
    .reduce((sum, b) => sum + b.totalCost, 0);

  // Expense: completed maintenance cost
  const totalExpense = filteredMaintenance
    .filter((m) => m.status === "Completed" || m.status === "In Progress")
    .reduce((sum, m) => sum + m.cost, 0);

  const totalRevenue = totalIncome - totalExpense;

  const completedBookings = filteredBookings.filter(
    (b) => b.status === "Completed",
  ).length;
  const activeBookings = filteredBookings.filter(
    (b) => b.status === "Active" || b.status === "Overdue",
  ).length;
  const pendingMaintenances = filteredMaintenance.filter(
    (m) => m.status === "Pending",
  ).length;

  // Table rows: merge bookings and maintenance into unified report rows
  const bookingRows = filteredBookings.map((b) => ({
    type: "Income" as const,
    date: b.startDate,
    description: `Booking – ${b.customerName} (${b.companyName})`,
    items: b.items.map((i) => `${i.equipmentName} ×${i.quantity}`).join(", "),
    status: b.status,
    amount: b.totalCost,
    category: "Rental Revenue",
  }));

  const maintenanceRows = filteredMaintenance.map((m) => ({
    type: "Expense" as const,
    date: m.reportedDate,
    description: `Maintenance – ${m.equipmentName}`,
    items: m.description,
    status: m.status,
    amount: m.cost,
    category: "Maintenance Cost",
  }));

  const allRows = [...bookingRows, ...maintenanceRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Pagination for the report table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(allRows.length / itemsPerPage));
  const pagedRows = allRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when period/date changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [period, refDate]);

  // Excel Export
  const handleExportExcel = () => {
    const summaryData = [
      ["REPORT SUMMARY"],
      ["Period", formatPeriodLabel(period, refDate)],
      ["Total Income (₹)", totalIncome],
      ["Total Expense (₹)", totalExpense],
      ["Net Revenue (₹)", totalRevenue],
      ["Completed Bookings", completedBookings],
      ["Active/Overdue Bookings", activeBookings],
      ["Maintenance Items", filteredMaintenance.length],
      [],
      ["DETAILED TRANSACTIONS"],
      [
        "Type",
        "Date",
        "Description",
        "Items / Details",
        "Category",
        "Status",
        "Amount (₹)",
      ],
      ...allRows.map((r) => [
        r.type,
        r.date,
        r.description,
        r.items,
        r.category,
        r.status,
        r.amount,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(summaryData);

    // Column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 40 },
      { wch: 40 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const fileName = `Vinayaga_Report_${period}_${refDate.toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const isCurrentPeriod = (() => {
    const now = new Date();
    if (period === "day") return isSameDay(refDate, now);
    if (period === "week") return isSameWeek(now, refDate);
    if (period === "month") return isSameMonth(refDate, now);
    return isSameYear(refDate, now);
  })();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-slate-900 dark:text-white text-2xl tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6 text-amber-500" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Financial overview — income, expenses, and net revenue
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
        >
          <FileSpreadsheet className="size-4" />
          Export Excel
        </button>
      </div>

      {/* Period Selector + Navigator */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-md shadow-slate-200/80 dark:shadow-none p-4 flex flex-col sm:flex-row items-center gap-4">
        {/* Period Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id);
                setRefDate(new Date());
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                period === p.id
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
          <button
            onClick={() => setRefDate(navigateDate(period, refDate, -1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Calendar className="size-4 text-amber-500" />
            <span>{formatPeriodLabel(period, refDate)}</span>
            {isCurrentPeriod && (
              <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                Current
              </span>
            )}
          </div>
          <button
            onClick={() => setRefDate(navigateDate(period, refDate, 1))}
            disabled={isCurrentPeriod}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
          {!isCurrentPeriod && (
            <button
              onClick={() => setRefDate(new Date())}
              className="text-xs text-amber-500 hover:text-amber-600 font-semibold cursor-pointer transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-md shadow-slate-200/80 dark:shadow-none p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatINR(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <IndianRupee className="size-3 text-emerald-500" />
            <span>
              {filteredBookings.filter(
                (b) =>
                  b.status === "Completed" ||
                  b.status === "Active" ||
                  b.status === "Overdue",
              ).length}{" "}
              rental bookings
            </span>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-md shadow-slate-200/80 dark:shadow-none p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Expense
            </span>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="size-4 text-red-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatINR(totalExpense)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Wallet className="size-3 text-red-500" />
            <span>
              {filteredMaintenance.filter(
                (m) =>
                  m.status === "Completed" || m.status === "In Progress",
              ).length}{" "}
              maintenance items
            </span>
          </div>
        </div>

        {/* Net Revenue */}
        <div
          className={`rounded-2xl border p-5 space-y-3 shadow-md dark:shadow-none ${
            totalRevenue >= 0
              ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 shadow-amber-100/80"
              : "bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20 shadow-red-100/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Net Revenue
            </span>
            <div
              className={`p-2 rounded-lg ${totalRevenue >= 0 ? "bg-amber-500/15" : "bg-red-500/15"}`}
            >
              <Receipt
                className={`size-4 ${totalRevenue >= 0 ? "text-amber-500" : "text-red-500"}`}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span
              className={`text-2xl font-black ${totalRevenue >= 0 ? "text-amber-500" : "text-red-500"}`}
            >
              {formatINR(totalRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <BarChart3 className="size-3 text-amber-500" />
            <span>Income – Expenses</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Bookings",
            value: filteredBookings.length,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Completed",
            value: completedBookings,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Active / Overdue",
            value: activeBookings,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Maintenance",
            value: filteredMaintenance.length,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 shadow-md shadow-slate-200/80 dark:shadow-none p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg ${s.bg}`}>
              <BarChart3 className={`size-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {s.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Transactions Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-lg shadow-slate-200/80 dark:shadow-none overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">
              Detailed Transactions
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {allRows.length} total entries for this {period}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400">
              <span className="size-2 rounded-full bg-red-500 inline-block" />
              Expense
            </span>
          </div>
        </div>

        {allRows.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900">
              <Download className="size-8 text-slate-400 dark:text-slate-600 stroke-[1.5]" />
            </div>
            <h3 className="font-heading font-black text-slate-850 dark:text-white text-base">
              No Transactions Found
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto font-medium">
              There are no bookings or maintenance records for the selected
              period. Try navigating to a different period.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
                    <th className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                      Type
                    </th>
                    <th className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                      Date
                    </th>
                    <th className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                      Description
                    </th>
                    <th className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                      Items / Details
                    </th>
                    <th className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                      Status
                    </th>
                    <th className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {pagedRows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                            row.type === "Income"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-500 dark:text-red-400"
                          }`}
                        >
                          {row.type === "Income" ? (
                            <TrendingUp className="size-3" />
                          ) : (
                            <TrendingDown className="size-3" />
                          )}
                          {row.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium max-w-[220px] whitespace-normal break-words">
                        {row.description}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] whitespace-normal break-words hidden lg:table-cell">
                        {row.items}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : row.status === "Active"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : row.status === "Overdue"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : row.status === "In Progress"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-sm font-black ${
                            row.type === "Income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {row.type === "Expense" ? "−" : "+"}
                          {formatINR(row.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination — always visible */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Page {currentPage} of {totalPages} &mdash; {allRows.length}{" "}
                {allRows.length === 1 ? "entry" : "entries"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-slate-400 text-xs"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`size-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === p
                            ? "bg-amber-500 text-slate-950"
                            : "border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Totals Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Period Totals
              </span>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Income: {formatINR(totalIncome)}
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
                <span className="text-xs font-bold text-red-500 dark:text-red-400">
                  Expense: {formatINR(totalExpense)}
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
                <span
                  className={`text-xs font-black ${totalRevenue >= 0 ? "text-amber-500" : "text-red-500"}`}
                >
                  Net: {formatINR(totalRevenue)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
