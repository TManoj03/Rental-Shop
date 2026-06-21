"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Wrench,
  Package,
  Layers,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Hash,
  Boxes,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Equipment } from "@/lib/mock-data";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface InventoryManagerProps {
  equipment: Equipment[];
  onAddEquipment: (
    eq: Omit<Equipment, "id" | "rentedCount" | "status">,
  ) => void;
  onUpdateEquipment: (eq: Equipment) => void;
  onDeleteEquipment: (id: string) => Promise<void>;
  onSendToMaintenance: (eqId: string, description: string) => void;
  onOpenRentModalWithEq: (eqId: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export function InventoryManager({
  equipment,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onSendToMaintenance,
  onOpenRentModalWithEq,
  isAddModalOpen,
  setIsAddModalOpen,
}: InventoryManagerProps) {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // View toggle
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit modal state
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete confirm modal state
  const [eqToDelete, setEqToDelete] = useState<Equipment | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Send to maintenance sub-modal state
  const [maintEqId, setMaintEqId] = useState<string | null>(null);
  const [maintDescription, setMaintDescription] = useState("");
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);

  // Form states for adding equipment
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Heavy Machinery");
  const [newDailyRate, setNewDailyRate] = useState(100);
  const [newWeeklyRate, setNewWeeklyRate] = useState(450);
  const [newTotalStock, setNewTotalStock] = useState(5);
  const [newModel, setNewModel] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newMaintenanceStatus, setNewMaintenanceStatus] = useState<
    "Good" | "Requires Service" | "Under Repair"
  >("Good");
  const [newDescription, setNewDescription] = useState("");

  const categories = [
    "All",
    "Heavy Machinery",
    "Concrete & Masonry",
    "Power Tools",
    "Access & Scaffolding",
    "Generators & Lighting",
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Heavy Machinery":
        return "bg-amber-500";
      case "Concrete & Masonry":
        return "bg-orange-500";
      case "Access & Scaffolding":
        return "bg-blue-500";
      case "Power Tools":
        return "bg-emerald-500";
      default:
        return "bg-purple-500";
    }
  };

  const getStatusBadge = (eq: Equipment) => {
    if (eq.rentedCount >= eq.totalStock) {
      return (
        <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Rented Out
        </span>
      );
    }
    switch (eq.maintenanceStatus) {
      case "Under Repair":
        return (
          <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            In Shop
          </span>
        );
      case "Requires Service":
        return (
          <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse">
            Service Due
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            Available
          </span>
        );
    }
  };

  // Filtering logic
  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.serial.toLowerCase().includes(searchQuery.toLowerCase());

    // Normalize category mapping
    let normalizedEqCat = eq.category;
    if (eq.category === "Generators & Light")
      normalizedEqCat = "Generators & Lighting";

    const matchesCategory =
      selectedCategory === "All" || normalizedEqCat === selectedCategory;

    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Available" &&
        eq.rentedCount < eq.totalStock &&
        eq.maintenanceStatus !== "Under Repair") ||
      (selectedStatus === "Rented" && eq.rentedCount > 0) ||
      (selectedStatus === "Maintenance" &&
        (eq.maintenanceStatus === "Under Repair" ||
          eq.maintenanceStatus === "Requires Service"));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredEquipment.length / itemsPerPage));
  const pagedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const resetAddForm = () => {
    setNewName("");
    setNewCategory("Heavy Machinery");
    setNewDailyRate(100);
    setNewWeeklyRate(450);
    setNewTotalStock(5);
    setNewModel("");
    setNewSerial("");
    setNewMaintenanceStatus("Good");
    setNewDescription("");
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEq(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEquipment({
      name: newName,
      category:
        newCategory === "Generators & Lighting"
          ? "Generators & Light"
          : newCategory,
      dailyRate: Number(newDailyRate),
      weeklyRate: Number(newWeeklyRate),
      totalStock: Number(newTotalStock),
      model: newModel,
      serial: newSerial,
      maintenanceStatus: newMaintenanceStatus,
      description: newDescription,
    });
    closeAddModal();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEq) {
      onUpdateEquipment(editingEq);
      closeEditModal();
    }
  };

  const closeMaintModal = () => {
    setIsMaintModalOpen(false);
    setMaintEqId(null);
    setMaintDescription("");
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (maintEqId && maintDescription) {
      onSendToMaintenance(maintEqId, maintDescription);
      closeMaintModal();
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Equipment Inventory
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage your rental fleet assets, inspect rates, and dispatch service
            routines.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-1.5 rounded-xl shadow-md shadow-amber-500/10 h-10 px-4"
        >
          <Plus className="size-4 stroke-[3]" />
          Add Equipment Item
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="text"
              placeholder="Search by name, model, serial #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Rented">Active Rentals</option>
              <option value="Maintenance">In Maintenance</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Table view"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Table2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <Layers className="size-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold mr-1 shrink-0 uppercase tracking-wider">
            Category:
          </span>
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-150 shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && (
        filteredEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEquipment.map((eq) => {
              const rentedCount = eq.rentedCount || 0;
              const available = Math.max(0, eq.totalStock - rentedCount);
              const utilizationPercent = Math.min(100, Math.round((rentedCount / eq.totalStock) * 100));
              const catColor = getCategoryColor(eq.category);

              return (
                <div
                  key={eq.id}
                  className="group relative bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-slate-900/60 ring-1 ring-slate-200/60 dark:ring-slate-800/60 hover:ring-amber-300/60 dark:hover:ring-amber-500/20 transition-all duration-300 flex flex-col"
                >
                  {/* Category gradient top banner */}
                  <div className={`relative h-24 flex items-end px-5 pb-4 overflow-hidden ${catColor} bg-opacity-90`}>
                    {/* Decorative background circles */}
                    <div className="absolute -top-4 -right-4 size-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 size-32 rounded-full bg-white/10" />

                    <div className="relative flex items-end justify-between w-full gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 block">
                          {eq.category}
                        </span>
                        <h3 className="font-heading font-black text-base text-white leading-tight group-hover:text-white/90 transition-colors">
                          {eq.name}
                        </h3>
                      </div>
                      {/* Availability ring */}
                      <div className="shrink-0 relative size-14 flex items-center justify-center">
                        <svg className="size-14 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="14" fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeDasharray={`${utilizationPercent * 0.879} 87.9`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-black text-white leading-none">{available}</span>
                          <span className="text-[8px] text-white/70 font-bold leading-none">avail</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 space-y-4">
                    {/* Meta row */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        <Tag className="size-3" />
                        <span>{eq.model || "No Model"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        <Hash className="size-3" />
                        <span>{eq.serial || "No Serial"}</span>
                      </div>
                      <div className="ml-auto">{getStatusBadge(eq)}</div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {eq.description}
                    </p>

                    {/* Pricing grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-850 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Daily</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">₹{eq.dailyRate.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-850 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Weekly</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">₹{eq.weeklyRate.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-850 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Stock</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{available}<span className="text-slate-400 font-semibold">/{eq.totalStock}</span></span>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                        <span>Fleet Utilization</span>
                        <span>{utilizationPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${utilizationPercent >= 100 ? "bg-rose-500" : utilizationPercent > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${utilizationPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditingEq(eq); setIsEditModalOpen(true); }}
                        title="Edit"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:bg-slate-950 transition-all cursor-pointer"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        disabled={eq.rentedCount > 0}
                        onClick={() => { setEqToDelete(eq); setIsDeleteConfirmOpen(true); }}
                        title="Delete"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:bg-slate-950 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      {eq.maintenanceStatus !== "Under Repair" && (
                        <button
                          onClick={() => { setMaintEqId(eq.id); setMaintDescription(""); setIsMaintModalOpen(true); }}
                          title="Send to maintenance"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:bg-slate-950 transition-all cursor-pointer"
                        >
                          <Wrench className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      disabled={eq.rentedCount >= eq.totalStock || eq.maintenanceStatus === "Under Repair"}
                      onClick={() => onOpenRentModalWithEq(eq.id)}
                      className="bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-amber-500 dark:hover:bg-amber-400 text-xs font-bold rounded-lg px-3.5 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Rent Out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center py-16">
            <Package className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-heading font-black text-slate-800 dark:text-white text-base">No Equipment Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              Try adjusting your search query, selecting a different filter category, or add a new equipment item.
            </p>
          </div>
        )
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm dark:shadow-none ring-1 ring-slate-200/60 dark:ring-slate-800/60 overflow-hidden">
          {filteredEquipment.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
                      {["Equipment", "Category", "Rates", "Stock", "Status", "Actions"].map((h) => (
                        <th key={h} className={`text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3.5 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {pagedEquipment.map((eq) => {
                      const available = Math.max(0, eq.totalStock - (eq.rentedCount || 0));
                      const utilizationPercent = Math.min(100, Math.round(((eq.rentedCount || 0) / eq.totalStock) * 100));
                      return (
                        <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                          {/* Equipment Name + meta */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`size-2 rounded-full shrink-0 ${getCategoryColor(eq.category)}`} />
                              <div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-500 transition-colors">{eq.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                  {eq.model || "—"} · #{eq.serial || "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Category */}
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{eq.category}</span>
                          </td>
                          {/* Rates */}
                          <td className="px-5 py-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100">₹{eq.dailyRate.toLocaleString("en-IN")}<span className="font-semibold text-slate-400">/day</span></p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">₹{eq.weeklyRate.toLocaleString("en-IN")}/wk</p>
                            </div>
                          </td>
                          {/* Stock + bar */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Boxes className="size-3 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{available}<span className="text-slate-400 font-medium">/{eq.totalStock}</span></span>
                              </div>
                              <div className="w-20 bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${utilizationPercent >= 100 ? "bg-rose-500" : utilizationPercent > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${utilizationPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4">{getStatusBadge(eq)}</td>
                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setEditingEq(eq); setIsEditModalOpen(true); }}
                                title="Edit"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:bg-slate-950 transition-all cursor-pointer"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              <button
                                disabled={eq.rentedCount > 0}
                                onClick={() => { setEqToDelete(eq); setIsDeleteConfirmOpen(true); }}
                                title="Delete"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:bg-slate-950 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                              {eq.maintenanceStatus !== "Under Repair" && (
                                <button
                                  onClick={() => { setMaintEqId(eq.id); setMaintDescription(""); setIsMaintModalOpen(true); }}
                                  title="Send to maintenance"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:bg-slate-950 transition-all cursor-pointer"
                                >
                                  <Wrench className="size-3.5" />
                                </button>
                              )}
                              <button
                                disabled={eq.rentedCount >= eq.totalStock || eq.maintenanceStatus === "Under Repair"}
                                onClick={() => onOpenRentModalWithEq(eq.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-amber-500 dark:hover:bg-amber-400 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Rent Out
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Page {currentPage} of {totalPages} &mdash; {filteredEquipment.length} items
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">…</span>
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
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-heading font-black text-slate-800 dark:text-white text-base">No Equipment Found</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
                Try adjusting your search query or filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAddModal();
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">
              Add New Equipment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Input the fleet details to catalog a new operational asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g., Cat 259D3 Compact Track Loader"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Model Number
                </label>
                <Input
                  placeholder="e.g., CAT-259D"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Daily Rate (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={newDailyRate}
                  onChange={(e) => setNewDailyRate(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Weekly Rate (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={newWeeklyRate}
                  onChange={(e) => setNewWeeklyRate(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Serial Number
                </label>
                <Input
                  placeholder="e.g., EXC-1283"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Fleet Stock <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={newTotalStock}
                  onChange={(e) => setNewTotalStock(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Safety & Inspection Status{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={newMaintenanceStatus}
                onChange={(e) =>
                  setNewMaintenanceStatus(
                    e.target.value as Equipment["maintenanceStatus"],
                  )
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="Good">BIS Certified (Good)</option>
                <option value="Requires Service">Service Recommended</option>
                <option value="Under Repair">Under Maintenance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Asset Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                placeholder="Description of power levels, load limits, or general guidelines."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                className="rounded-xl border border-slate-200 dark:border-slate-850 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl h-9"
              >
                Save Equipment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) closeEditModal();
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">
              Edit Equipment Asset
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Update rate terms, serial metadata, or inspect levels.
            </DialogDescription>
          </DialogHeader>
          {editingEq && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Equipment Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={editingEq.name}
                  onChange={(e) =>
                    setEditingEq({ ...editingEq, name: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      editingEq.category === "Generators & Light"
                        ? "Generators & Lighting"
                        : editingEq.category
                    }
                    onChange={(e) =>
                      setEditingEq({
                        ...editingEq,
                        category:
                          e.target.value === "Generators & Lighting"
                            ? "Generators & Light"
                            : e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Model Number
                  </label>
                  <Input
                    value={editingEq.model}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, model: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Daily Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    value={editingEq.dailyRate}
                    onChange={(e) =>
                      setEditingEq({
                        ...editingEq,
                        dailyRate: Number(e.target.value),
                      })
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Weekly Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    value={editingEq.weeklyRate}
                    onChange={(e) =>
                      setEditingEq({
                        ...editingEq,
                        weeklyRate: Number(e.target.value),
                      })
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Serial Number
                  </label>
                  <Input
                    value={editingEq.serial}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, serial: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Total Fleet Stock <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min={editingEq.rentedCount}
                    value={editingEq.totalStock}
                    onChange={(e) =>
                      setEditingEq({
                        ...editingEq,
                        totalStock: Number(e.target.value),
                      })
                    }
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Safety & Inspection Status{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingEq.maintenanceStatus}
                  onChange={(e) =>
                    setEditingEq({
                      ...editingEq,
                      maintenanceStatus: e.target
                        .value as Equipment["maintenanceStatus"],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Good">BIS Certified (Good)</option>
                  <option value="Requires Service">Service Recommended</option>
                  <option value="Under Repair">Under Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Asset Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={editingEq.description}
                  onChange={(e) =>
                    setEditingEq({ ...editingEq, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl h-9"
                >
                  Update Asset
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Send to Maintenance Report Dialog */}
      <Dialog
        open={isMaintModalOpen}
        onOpenChange={(open) => {
          if (!open) closeMaintModal();
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">
              Flag for Maintenance Service
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Report issues or request tuneups for this fleet asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMaintSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">
                Issue / Servicing Details
              </label>
              <textarea
                required
                placeholder="Detail the mechanical, hydraulic, engine, safety issues, or general oil services required."
                value={maintDescription}
                onChange={(e) => setMaintDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-medium"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeMaintModal}
                className="rounded-xl border border-slate-200 dark:border-slate-850 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl h-9"
              >
                File Maintenance Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEqToDelete(null);
        }}
        onConfirm={async () => {
          if (eqToDelete) {
            setIsDeleting(true);
            try {
              await onDeleteEquipment(eqToDelete.id);
            } catch (err) {
              console.error(err);
            } finally {
              setIsDeleting(false);
              setIsDeleteConfirmOpen(false);
              setEqToDelete(null);
            }
          }
        }}
        isLoading={isDeleting}
        title="Delete Equipment Asset"
        description="Are you sure you want to delete this equipment item? This action cannot be undone."
        itemName={eqToDelete?.name || ""}
        confirmText="Delete Asset"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
