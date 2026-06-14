"use client";

import React from "react";
import {
  LayoutDashboard,
  Boxes,
  FileText,
  Users,
  Wrench,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
  X,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  stats: {
    totalRevenue: number;
    activeRentals: number;
    maintenanceRequired: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  stats,
  isOpen,
  onClose,
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Boxes, badge: null },
    {
      id: "bookings",
      label: "Bookings",
      icon: FileText,
      badge: stats.activeRentals > 0 ? stats.activeRentals : null,
    },
    { id: "customers", label: "Customers", icon: Users, badge: null },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      badge: stats.maintenanceRequired > 0 ? stats.maintenanceRequired : null,
      badgeColor:
        "bg-amber-500 text-slate-950 dark:bg-amber-500 dark:text-slate-950 font-bold animate-pulse",
    },
    { id: "audit", label: "Audit Logs", icon: History, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col h-screen transition-all duration-300 ease-in-out z-50 shrink-0",
          "lg:sticky lg:top-0 lg:flex",
          "fixed inset-y-0 left-0 lg:translate-x-0 lg:shadow-none shadow-2xl",
          isOpen ? "translate-x-0 flex" : "-translate-x-full lg:flex hidden",
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vinayaga_logo.png"
                alt="Vinayaga logo"
                className="size-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-heading text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                VINAYAGA
              </h1>
              <p className="text-[10px] font-bold text-amber-500 tracking-wider uppercase mt-1 leading-none">
                Rental Shop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="px-2 mb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Main Console
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center cursor-pointer justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group duration-150 outline-none",
                  isActive
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/10"
                    : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform duration-150 group-hover:scale-110",
                      isActive
                        ? "text-slate-950"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      item.badgeColor ||
                        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      isActive && "bg-slate-950 text-amber-500 shadow-sm",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini Stats Card */}
        <div className="px-4 py-2">
          <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="size-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                Monthly Volume
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate">
                ₹
                {stats.totalRevenue.toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer / Profile & Themes */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setDarkMode(false)}
              className={cn(
                "flex-1 flex cursor-pointer items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                !darkMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              <Sun className="size-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={cn(
                "flex-1 flex items-center cursor-pointer justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                darkMode
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <Moon className="size-3.5" />
              <span>Dark</span>
            </button>
          </div>

          {/* User Profile info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center shadow-sm">
                RG
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Raja Guru
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Owner
                </p>
              </div>
            </div>
            {/* <ChevronRight className="size-4 text-slate-400 dark:text-slate-500" /> */}
          </div>
        </div>
      </aside>
    </>
  );
}
