"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Clock,
  Wrench,
  TrendingUp,
  TrendingDown,
  Plus,
  CheckCircle,
  AlertTriangle,
  HardHat,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Equipment, Booking } from "@/lib/mock-data";

interface DashboardOverviewProps {
  equipment: Equipment[];
  bookings: Booking[];
  onOpenRentModal: () => void;
  onOpenAddEquipmentModal: () => void;
}

export function DashboardOverview({
  equipment,
  bookings,
  onOpenRentModal,
  onOpenAddEquipmentModal,
}: DashboardOverviewProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );

  // Compute stats
  const activeRentals = bookings.filter(
    (b) => b.status === "Active" || b.status === "Overdue",
  );
  const activeRentalsCount = activeRentals.length;

  const topAssets = equipment
    .slice()
    .sort((a, b) => b.rentedCount - a.rentedCount)
    .slice(0, 4);

  // Dynamic revenue change calculation vs last month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let lastMonthYear = now.getFullYear();
  let lastMonthVal = now.getMonth();
  if (lastMonthVal === 0) {
    lastMonthVal = 12;
    lastMonthYear -= 1;
  }
  const lastMonthStr = `${lastMonthYear}-${String(lastMonthVal).padStart(2, "0")}`;

  const currentMonthRevenue = bookings
    .filter(
      (b) =>
        b.startDate.startsWith(currentMonthStr) &&
        (b.status === "Completed" ||
          b.status === "Active" ||
          b.status === "Overdue"),
    )
    .reduce((sum, b) => sum + b.totalCost, 0);

  const lastMonthRevenue = bookings
    .filter(
      (b) =>
        b.startDate.startsWith(lastMonthStr) &&
        (b.status === "Completed" ||
          b.status === "Active" ||
          b.status === "Overdue"),
    )
    .reduce((sum, b) => sum + b.totalCost, 0);

  let revenueDiff = 0;
  if (lastMonthRevenue === 0) {
    revenueDiff = currentMonthRevenue > 0 ? 100 : 0;
  } else {
    revenueDiff =
      ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }

  const totalRevenue = bookings.reduce(
    (sum, b) =>
      sum +
      (b.status === "Completed" ||
      b.status === "Active" ||
      b.status === "Overdue"
        ? b.totalCost
        : 0),
    0,
  );

  const overdueCount = bookings.filter((b) => b.status === "Overdue").length;
  const maintenanceCount = equipment.filter(
    (e) =>
      e.maintenanceStatus === "Under Repair" ||
      e.maintenanceStatus === "Requires Service",
  ).length;

  const totalStock = equipment.reduce((sum, e) => sum + e.totalStock, 0);
  const rentedStock = equipment.reduce((sum, e) => sum + e.rentedCount, 0);
  const utilizationRate =
    totalStock > 0 ? Math.round((rentedStock / totalStock) * 100) : 0;

  const goodStock = equipment
    .filter((e) => e.maintenanceStatus === "Good")
    .reduce((sum, e) => sum + e.totalStock, 0);
  const requiresServiceStock = equipment
    .filter((e) => e.maintenanceStatus === "Requires Service")
    .reduce((sum, e) => sum + e.totalStock, 0);
  const underRepairStock = equipment
    .filter((e) => e.maintenanceStatus === "Under Repair")
    .reduce((sum, e) => sum + e.totalStock, 0);
  const safetyScore =
    totalStock > 0 ? Math.round((goodStock / totalStock) * 100) : 100;

  // Utilization calculations completed

  const getItemsDesc = (booking: Booking) => {
    if (booking.items && booking.items.length > 0) {
      return booking.items
        .map((item) => `${item.quantity}x ${item.equipmentName}`)
        .join(", ");
    }
    const legacyBooking = booking as unknown as Record<string, unknown>;
    return String(legacyBooking.equipmentName || "Machinery");
  };

  // Generate activities based on actual bookings
  const activities = bookings
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 5)
    .map((b) => {
      if (b.status === "Completed") {
        return {
          id: `act-${b.id}`,
          type: "return",
          message: `${b.companyName} returned "${getItemsDesc(b)}"`,
          date: b.actualReturnDate || b.endDate,
          badgeColor:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      } else if (b.status === "Overdue") {
        return {
          id: `act-${b.id}`,
          type: "overdue",
          message: `"${getItemsDesc(b)}" is OVERDUE for ${b.companyName}`,
          date: b.endDate,
          badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        };
      } else {
        return {
          id: `act-${b.id}`,
          type: "rental",
          message: `"${getItemsDesc(b)}" rented to ${b.companyName}`,
          date: b.startDate,
          badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
        };
      }
    });

  // Generate last 6 months trends dynamically
  const revenueTrends = React.useMemo(() => {
    const trends = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1; // 1-indexed
      const monthStr = `${year}-${String(monthNum).padStart(2, "0")}`;
      const monthLabel = monthNames[d.getMonth()];

      const monthBookings = bookings.filter(
        (b) =>
          b.startDate.startsWith(monthStr) &&
          (b.status === "Completed" ||
            b.status === "Active" ||
            b.status === "Overdue"),
      );

      const revenue = monthBookings.reduce((sum, b) => sum + b.totalCost, 0);
      const rentals = monthBookings.length;

      trends.push({
        month: monthLabel,
        revenue,
        rentals,
        monthStr,
      });
    }
    return trends;
  }, [bookings]);

  // SVG Line Chart coordinates helper
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const maxRevenueVal = Math.max(...revenueTrends.map((t) => t.revenue));
  const maxRevenue =
    maxRevenueVal > 0 ? Math.ceil((maxRevenueVal * 1.2) / 1000) * 1000 : 10000;
  const minRevenue = 0;
  const revenueRange = maxRevenue - minRevenue;

  const points = revenueTrends.map((item, idx) => {
    const x = paddingX + (idx / (revenueTrends.length - 1)) * usableWidth;
    const y =
      chartHeight -
      paddingY -
      ((item.revenue - minRevenue) / revenueRange) * usableHeight;
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Area path (closed at the bottom)
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time shop utilization, revenue tracking, and dispatch console.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 sm:shrink-0">
          <Button
            onClick={onOpenRentModal}
            className="bg-amber-500 cursor-pointer hover:bg-amber-600 text-slate-950 font-semibold gap-1.5 rounded-xl shadow-md shadow-amber-500/10 h-10 px-4"
          >
            <Plus className="size-4 stroke-[3]" />
            New Rental Agreement
          </Button>
          <Button
            variant="outline"
            onClick={onOpenAddEquipmentModal}
            className="border-slate-200 cursor-pointer dark:border-slate-800 text-slate-800 dark:text-slate-200 gap-1.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 h-10 px-4"
          >
            <Plus className="size-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Revenue (YTD)
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div
              className={`flex items-center gap-1 mt-1 text-xs font-semibold ${revenueDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}
            >
              {revenueDiff >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              <span>
                {revenueDiff >= 0 ? "+" : ""}
                {revenueDiff.toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Active Rentals
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              <span>{activeRentalsCount}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                / {totalStock} machines out
              </span>
            </div>
            {/* Utilization Bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                <span>Fleet Utilization</span>
                <span>{utilizationRate}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Overdue Returns
            </CardTitle>
            <div
              className={`p-2 rounded-xl ${overdueCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
            >
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-black ${overdueCount > 0 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}
            >
              {overdueCount}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {overdueCount > 0
                ? "Requires immediate follow-up"
                : "All returns are on schedule"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Fleet Maintenance
            </CardTitle>
            <div
              className={`p-2 rounded-xl ${maintenanceCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
            >
              <Wrench className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {maintenanceCount}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {maintenanceCount > 0
                ? "Items currently out of service"
                : "Fleet 100% operational"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Trend SVG Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Rental Volume & Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Total rental revenue generated monthly in USD.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
                  <span className="size-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                  Monthly Earnings
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* SVG Plot */}
            <div className="relative mt-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible"
              >
                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = paddingY + ratio * usableHeight;
                  const value = Math.round(maxRevenue - ratio * revenueRange);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        className="stroke-slate-100 dark:stroke-slate-900"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 dark:fill-slate-500 text-[9px] font-bold"
                      >
                        {value >= 100000
                          ? `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`
                          : value >= 1000
                            ? `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
                            : `₹${value}`}
                      </text>
                    </g>
                  );
                })}

                {/* Fill Gradient Area */}
                <path d={areaD} fill="url(#chartGrad)" />

                {/* Trend line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Grid vertical dots and month labels */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <line
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={chartHeight - paddingY}
                      className="stroke-slate-100 dark:stroke-slate-900/40"
                      strokeDasharray="2,2"
                    />
                    {/* Circle Dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      className="fill-amber-500 stroke-white dark:stroke-slate-950 hover:r-6 cursor-pointer transition-all"
                      onMouseEnter={() => setSelectedMonthIndex(idx)}
                      onMouseLeave={() => setSelectedMonthIndex(null)}
                    />
                    {/* Label */}
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold"
                    >
                      {p.month}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip display */}
              <div className="absolute top-2 right-4 h-6 flex items-center gap-3">
                {selectedMonthIndex !== null ? (
                  <div className="bg-slate-900/95 dark:bg-white text-white dark:text-slate-950 text-[11px] px-2.5 py-1 rounded-lg font-bold shadow-lg border border-slate-700/50 dark:border-slate-200">
                    {revenueTrends[selectedMonthIndex].month}:{" "}
                    <span className="text-amber-400 dark:text-amber-600 font-extrabold">
                      ₹
                      {revenueTrends[selectedMonthIndex].revenue.toLocaleString(
                        "en-IN",
                      )}
                    </span>{" "}
                    ({revenueTrends[selectedMonthIndex].rentals} contracts)
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
                    Hover points to view monthly revenue
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Top Performing Assets Card */}
        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Top Performing Assets
            </CardTitle>
            <CardDescription className="text-xs text-slate-550">
              Fleet items currently experiencing highest checkout demands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4.5 flex-1 font-heading">
            {topAssets.length > 0 ? (
              <div className="space-y-4">
                {topAssets.map((e) => {
                  const assetUtilRate =
                    e.totalStock > 0
                      ? Math.round((e.rentedCount / e.totalStock) * 100)
                      : 0;
                  return (
                    <div key={e.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="overflow-hidden pr-2">
                          <span className="font-bold text-slate-850 dark:text-slate-200 block truncate">
                            {e.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            {e.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {e.rentedCount} / {e.totalStock}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              assetUtilRate >= 75
                                ? "bg-amber-500"
                                : assetUtilRate >= 40
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                            }`}
                            style={{ width: `${assetUtilRate}%` }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold shrink-0 w-8 text-right ${
                            assetUtilRate >= 75
                              ? "text-amber-500"
                              : assetUtilRate >= 40
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-500"
                          }`}
                        >
                          {assetUtilRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-450 italic">
                No fleet inventory recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Activities & Quick Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Feed */}
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center justify-between">
              <span>Recent Activity Log</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Live Feed
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit trail of recent shop checkouts, returns, and notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${act.badgeColor}`}
                      >
                        {act.type}
                      </span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {act.message}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {act.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 italic">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Health & Safety Status Card */}
        <Card className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60 p-6 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl">
                <CheckCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-sm">
                  Fleet Safety Score
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 font-bold uppercase">
                  BIS Certified Operational
                </p>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {safetyScore}%
              </span>
              <span className="text-[11px] font-bold text-slate-500 text-right">
                Operational Fleet
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Progress items */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Operational (Good)</span>
                  <span>
                    {goodStock} / {totalStock}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${totalStock > 0 ? (goodStock / totalStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Requires Service</span>
                  <span>
                    {requiresServiceStock} / {totalStock}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${totalStock > 0 ? (requiresServiceStock / totalStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Under Repair</span>
                  <span>
                    {underRepairStock} / {totalStock}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{
                      width: `${totalStock > 0 ? (underRepairStock / totalStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 p-3 rounded-xl flex items-center gap-3">
            <HardHat className="text-amber-500 size-5 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">
                Safety Audit Standby
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                30-point BIS Inspection OK
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
