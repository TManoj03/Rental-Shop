"use client";

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Wrench, 
  Package, 
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Equipment } from "@/lib/mock-data";

interface InventoryManagerProps {
  equipment: Equipment[];
  onAddEquipment: (eq: Omit<Equipment, "id" | "rentedCount" | "status">) => void;
  onUpdateEquipment: (eq: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
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
  setIsAddModalOpen
}: InventoryManagerProps) {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Edit modal state
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  const [newMaintenanceStatus, setNewMaintenanceStatus] = useState<"Good" | "Requires Service" | "Under Repair">("Good");
  const [newDescription, setNewDescription] = useState("");

  const categories = [
    "All",
    "Heavy Machinery",
    "Concrete & Masonry",
    "Power Tools",
    "Access & Scaffolding",
    "Generators & Lighting"
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Heavy Machinery": return "bg-amber-500";
      case "Concrete & Masonry": return "bg-orange-500";
      case "Access & Scaffolding": return "bg-blue-500";
      case "Power Tools": return "bg-emerald-500";
      default: return "bg-purple-500";
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
    if (eq.category === "Generators & Light") normalizedEqCat = "Generators & Lighting";
    
    const matchesCategory = selectedCategory === "All" || normalizedEqCat === selectedCategory;

    const matchesStatus = 
      selectedStatus === "All" ||
      (selectedStatus === "Available" && eq.rentedCount < eq.totalStock && eq.maintenanceStatus !== "Under Repair") ||
      (selectedStatus === "Rented" && eq.rentedCount > 0) ||
      (selectedStatus === "Maintenance" && (eq.maintenanceStatus === "Under Repair" || eq.maintenanceStatus === "Requires Service"));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEquipment({
      name: newName,
      category: newCategory === "Generators & Lighting" ? "Generators & Light" : newCategory,
      dailyRate: Number(newDailyRate),
      weeklyRate: Number(newWeeklyRate),
      totalStock: Number(newTotalStock),
      model: newModel,
      serial: newSerial,
      maintenanceStatus: newMaintenanceStatus,
      description: newDescription,
    });
    // Reset forms
    setNewName("");
    setNewCategory("Heavy Machinery");
    setNewDailyRate(100);
    setNewWeeklyRate(450);
    setNewTotalStock(5);
    setNewModel("");
    setNewSerial("");
    setNewMaintenanceStatus("Good");
    setNewDescription("");
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEq) {
      onUpdateEquipment(editingEq);
      setIsEditModalOpen(false);
      setEditingEq(null);
    }
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (maintEqId && maintDescription) {
      onSendToMaintenance(maintEqId, maintDescription);
      setMaintEqId(null);
      setMaintDescription("");
      setIsMaintModalOpen(false);
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
            Manage your rental fleet assets, inspect rates, and dispatch service routines.
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
          <div className="flex gap-2">
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

      {/* Grid of Equipment */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => {
            const utilizationPercent = Math.round((eq.rentedCount / eq.totalStock) * 100);
            return (
              <Card 
                key={eq.id} 
                className="group rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60 overflow-hidden flex flex-col justify-between hover:shadow-md hover:ring-slate-300 dark:hover:ring-slate-700 transition-all duration-200"
              >
                {/* Visual Header Strip based on Category */}
                <div className={`h-1.5 w-full ${getCategoryColor(eq.category)}`} />
                
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {eq.category}
                    </span>
                    {getStatusBadge(eq)}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-[15px] text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {eq.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      Model: <span className="font-bold text-slate-600 dark:text-slate-400">{eq.model}</span> | Serial: <span className="font-bold text-slate-600 dark:text-slate-400">{eq.serial}</span>
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-5 py-0 space-y-4 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {eq.description}
                  </p>

                  {/* Pricing Info */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Daily rate</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">₹{eq.dailyRate.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Weekly rate</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">₹{eq.weeklyRate.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                      <span>Rented Stock Utilization</span>
                      <span>{eq.rentedCount} / {eq.totalStock} units</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${utilizationPercent > 80 ? "bg-rose-500" : "bg-amber-500"}`}
                        style={{ width: `${utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900 flex justify-between gap-2.5">
                  <div className="flex gap-1.5">
                    <Button 
                      variant="outline" 
                      size="icon-sm"
                      onClick={() => {
                        setEditingEq(eq);
                        setIsEditModalOpen(true);
                      }}
                      className="border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 dark:bg-slate-950 rounded-lg size-7.5"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon-sm"
                      disabled={eq.rentedCount > 0}
                      onClick={() => {
                        if (confirm(`Remove ${eq.name} from inventory?`)) {
                          onDeleteEquipment(eq.id);
                        }
                      }}
                      className="border-slate-200 dark:border-slate-850 hover:bg-rose-500/10 hover:text-rose-500 dark:bg-slate-950 rounded-lg text-slate-400 size-7.5 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    {eq.maintenanceStatus !== "Under Repair" && (
                      <Button 
                        variant="outline" 
                        size="icon-sm"
                        onClick={() => {
                          setMaintEqId(eq.id);
                          setMaintDescription("");
                          setIsMaintModalOpen(true);
                        }}
                        className="border-slate-200 dark:border-slate-850 hover:bg-amber-500/10 hover:text-amber-500 dark:bg-slate-950 rounded-lg text-slate-400 size-7.5"
                      >
                        <Wrench className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <Button
                    disabled={eq.rentedCount >= eq.totalStock || eq.maintenanceStatus === "Under Repair"}
                    onClick={() => onOpenRentModalWithEq(eq.id)}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold rounded-lg h-7.5 px-3 disabled:opacity-40"
                  >
                    Rent Out
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center py-16">
          <Package className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
          <h3 className="font-heading font-black text-slate-800 dark:text-white text-base">No Equipment Found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
            Try adjusting your search query, selecting a different filter category, or add a new equipment item to your inventory.
          </p>
        </div>
      )}

      {/* Add Equipment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Add New Equipment</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Input the fleet details to catalog a new operational asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Equipment Name</label>
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  {categories.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Model Number</label>
                <Input 
                  required 
                  placeholder="e.g., CAT-259D" 
                  value={newModel} 
                  onChange={(e) => setNewModel(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Daily Rate (₹)</label>
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Weekly Rate (₹)</label>
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Serial Number</label>
                <Input 
                  required 
                  placeholder="e.g., EXC-1283" 
                  value={newSerial} 
                  onChange={(e) => setNewSerial(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Fleet Stock</label>
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
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Safety & Inspection Status</label>
              <select 
                value={newMaintenanceStatus} 
                onChange={(e) => setNewMaintenanceStatus(e.target.value as Equipment["maintenanceStatus"])}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="Good">BIS Certified (Good)</option>
                <option value="Requires Service">Service Recommended</option>
                <option value="Under Repair">Under Maintenance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Asset Description</label>
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
                onClick={() => setIsAddModalOpen(false)}
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
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Edit Equipment Asset</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Update rate terms, serial metadata, or inspect levels.
            </DialogDescription>
          </DialogHeader>
          {editingEq && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Equipment Name</label>
                <Input 
                  required 
                  value={editingEq.name} 
                  onChange={(e) => setEditingEq({ ...editingEq, name: e.target.value })} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
                  <select 
                    value={editingEq.category === "Generators & Light" ? "Generators & Lighting" : editingEq.category} 
                    onChange={(e) => setEditingEq({ ...editingEq, category: e.target.value === "Generators & Lighting" ? "Generators & Light" : e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Model Number</label>
                  <Input 
                    required 
                    value={editingEq.model} 
                    onChange={(e) => setEditingEq({ ...editingEq, model: e.target.value })} 
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Daily Rate (₹)</label>
                  <Input 
                    type="number" 
                    required 
                    min="0" 
                    value={editingEq.dailyRate} 
                    onChange={(e) => setEditingEq({ ...editingEq, dailyRate: Number(e.target.value) })} 
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Weekly Rate (₹)</label>
                  <Input 
                    type="number" 
                    required 
                    min="0" 
                    value={editingEq.weeklyRate} 
                    onChange={(e) => setEditingEq({ ...editingEq, weeklyRate: Number(e.target.value) })} 
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Serial Number</label>
                  <Input 
                    required 
                    value={editingEq.serial} 
                    onChange={(e) => setEditingEq({ ...editingEq, serial: e.target.value })} 
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Fleet Stock</label>
                  <Input 
                    type="number" 
                    required 
                    min={editingEq.rentedCount} 
                    value={editingEq.totalStock} 
                    onChange={(e) => setEditingEq({ ...editingEq, totalStock: Number(e.target.value) })} 
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Safety & Inspection Status</label>
                <select 
                  value={editingEq.maintenanceStatus} 
                  onChange={(e) => setEditingEq({ ...editingEq, maintenanceStatus: e.target.value as Equipment["maintenanceStatus"] })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Good">BIS Certified (Good)</option>
                  <option value="Requires Service">Service Recommended</option>
                  <option value="Under Repair">Under Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Asset Description</label>
                <textarea 
                  required 
                  value={editingEq.description} 
                  onChange={(e) => setEditingEq({ ...editingEq, description: e.target.value })} 
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEq(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-855 h-9"
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
      <Dialog open={isMaintModalOpen} onOpenChange={setIsMaintModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Flag for Maintenance Service</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Report issues or request tuneups for this fleet asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMaintSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Issue / Servicing Details</label>
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
                onClick={() => setIsMaintModalOpen(false)}
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
    </div>
  );
}
