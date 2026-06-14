"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  ArrowRight,
  Plus
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { Booking, BookingItem, Equipment, Customer } from "@/lib/mock-data";

interface BookingsManagerProps {
  bookings: Booking[];
  equipment: Equipment[];
  customers: Customer[];
  onAddBooking: (booking: Omit<Booking, "id" | "status">) => void;
  onReturnBooking: (bookingId: string) => void;
  onMarkOverdue: (bookingId: string) => void;
  onUpdateBooking: (bookingId: string, data: Partial<Booking>) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  preSelectedEqId: string | null;
  setPreSelectedEqId: (id: string | null) => void;
}

export function BookingsManager({
  bookings,
  equipment,
  customers,
  onAddBooking,
  onReturnBooking,
  onMarkOverdue,
  onUpdateBooking,
  isAddModalOpen,
  setIsAddModalOpen,
  preSelectedEqId,
  setPreSelectedEqId
}: BookingsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form states (Multi-Item Cart)
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit/Extend states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editBookingItems, setEditBookingItems] = useState<BookingItem[]>([]);
  const [editSelEqId, setEditSelEqId] = useState("");
  const [editSelQty, setEditSelQty] = useState(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState<Booking["status"]>("Active");

  // Pre-fill equipment selection if triggered from Inventory screen
  useEffect(() => {
    if (preSelectedEqId) {
      const eqId = preSelectedEqId;
      const eq = equipment.find((e) => e.id === eqId);
      if (eq) {
        setTimeout(() => {
          setBookingItems([{ equipmentId: eqId, equipmentName: eq.name, quantity: 1 }]);
          setIsAddModalOpen(true);
          setPreSelectedEqId(null);
        }, 0);
      }
    }
  }, [preSelectedEqId, setPreSelectedEqId, setIsAddModalOpen, equipment]);

  // Set default dates when opening modal
  useEffect(() => {
    if (isAddModalOpen) {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];
      setTimeout(() => {
        setStartDate(today);
        setEndDate(nextWeekStr);
      }, 0);
    }
  }, [isAddModalOpen]);

  // Calculate duration and cost directly in render
  let rentalDays = 0;
  let calculatedCost = 0;

  if (startDate && endDate && bookingItems.length > 0) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      rentalDays = diffDays;
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;

      for (const item of bookingItems) {
        const eq = equipment.find((e) => e.id === item.equipmentId);
        if (eq) {
          const itemCost = weeks * eq.weeklyRate + remainingDays * eq.dailyRate;
          calculatedCost += itemCost * item.quantity;
        }
      }
    }
  }

  // Calculate cost of the edit/extension
  let editRentalDays = 0;
  let editCalculatedCost = 0;

  if (editingBooking && editStartDate && editEndDate && editBookingItems.length > 0) {
    const start = new Date(editStartDate);
    const end = new Date(editEndDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      editRentalDays = diffDays;
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;

      for (const item of editBookingItems) {
        const eq = equipment.find((e) => e.id === item.equipmentId);
        if (eq) {
          const itemCost = weeks * eq.weeklyRate + remainingDays * eq.dailyRate;
          editCalculatedCost += itemCost * item.quantity;
        }
      }
    }
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (!customer || bookingItems.length === 0) return;

    onAddBooking({
      items: bookingItems,
      customerId: selectedCustomerId,
      customerName: customer.name,
      companyName: customer.company,
      startDate,
      endDate,
      totalCost: calculatedCost,
    });

    // Reset fields
    setSelectedCustomerId("");
    setBookingItems([]);
    setSelectedEquipmentId("");
    setSelectedQuantity(1);
    setStartDate("");
    setEndDate("");
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setEditCustomerId(booking.customerId);

    // Legacy fallback mapping
    const legacyBooking = booking as unknown as Record<string, unknown>;
    let items = booking.items || [];
    if (items.length === 0 && legacyBooking.equipmentId) {
      items = [{
        equipmentId: String(legacyBooking.equipmentId),
        equipmentName: String(legacyBooking.equipmentName || "Machinery"),
        quantity: 1
      }];
    }

    setEditBookingItems(items.map(i => ({ ...i })));
    setEditStartDate(booking.startDate);
    setEditEndDate(booking.endDate);
    setEditStatus(booking.status);
    setEditSelEqId("");
    setEditSelQty(1);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const customer = customers.find((c) => c.id === editCustomerId);
    if (!customer) return;

    onUpdateBooking(editingBooking.id, {
      customerId: editCustomerId,
      customerName: customer.name,
      companyName: customer.company,
      items: editBookingItems,
      startDate: editStartDate,
      endDate: editEndDate,
      totalCost: editCalculatedCost,
      status: editStatus
    });

    setIsEditModalOpen(false);
    setEditingBooking(null);
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "Active":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Active
          </span>
        );
      case "Completed":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Completed
          </span>
        );
      case "Overdue":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse">
            Overdue
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Reserved
          </span>
        );
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.items && b.items.some(item => item.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      ((b as unknown as Record<string, unknown>).equipmentName && String((b as unknown as Record<string, unknown>).equipmentName).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rental Agreements
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Log dispatch contracts, verify return checklists, and review total billing.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-1.5 rounded-xl shadow-md shadow-amber-500/10 h-10 px-4"
        >
          <Plus className="size-4 stroke-[3]" />
          Create Rental Booking
        </Button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white dark:bg-slate-955 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850/80 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Search by contract #, customer, machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 font-heading">
          {["All", "Active", "Overdue", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-150 shrink-0 ${
                statusFilter === status
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-805"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table of bookings */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850 overflow-hidden">
        {filteredBookings.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
              <TableRow className="border-none">
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-6 py-4">Contract ID</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Client</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Equipment Items</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Dates</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Charges</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Status</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-6 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-900">
              {filteredBookings.map((b) => (
                <TableRow 
                  key={b.id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-none transition-colors duration-150"
                >
                  <TableCell className="font-bold text-xs pl-6 py-4 text-slate-900 dark:text-white uppercase">
                    #{b.id}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-850 dark:text-slate-200 text-xs">{b.customerName}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{b.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex flex-col gap-0.5">
                      {b.items && b.items.length > 0 ? (
                        b.items.map((item, idx) => (
                          <span key={idx} className="block text-[11px]">
                            {item.quantity}x {item.equipmentName}
                          </span>
                        ))
                      ) : (
                        <span className="block text-[11px] italic text-slate-400">
                          {String((b as unknown as Record<string, unknown>).equipmentName || "No items")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <span>{b.startDate}</span>
                      <ArrowRight className="size-3 text-slate-400" />
                      <span>{b.status === "Completed" && b.actualReturnDate ? b.actualReturnDate : b.endDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 font-extrabold text-xs text-slate-900 dark:text-white">
                    ₹{b.totalCost.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(b.status)}
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(b.status === "Active" || b.status === "Overdue") && (
                        <>
                          {b.status === "Active" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onMarkOverdue(b.id)}
                              className="text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[10px] font-bold"
                            >
                              Flag Overdue
                            </Button>
                          )}
                          <Button
                            size="xs"
                            onClick={() => handleOpenEditModal(b)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px]"
                          >
                            Extend / Edit
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => onReturnBooking(b.id)}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-lg text-[10px]"
                          >
                            Check In
                          </Button>
                        </>
                      )}
                      {b.status === "Completed" && (
                        <Button
                          size="xs"
                          onClick={() => handleOpenEditModal(b)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px]"
                        >
                          Edit Completed
                        </Button>
                      )}
                      {b.status === "Reserved" && (
                        <Button
                          size="xs"
                          onClick={() => handleOpenEditModal(b)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px]"
                        >
                          Edit Reserved
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16">
            <FileText className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-heading font-black text-slate-850 dark:text-white text-base">No Contracts Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              We couldn&apos;t locate any rental contracts fitting your search. Tap &quot;Create Rental Booking&quot; to log a new checkout.
            </p>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">New Rental Agreement</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Complete dispatch checkout configuration for heavy machinery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4 py-2">
            
            {/* Customer Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Customer Client</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="">Choose customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Items Builder */}
            <div className="space-y-2 border border-slate-250/80 dark:border-slate-800/80 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-xs font-bold text-slate-550 dark:text-slate-450 block mb-1">Equipment Cart</span>
              
              {/* Added items list */}
              {bookingItems.length > 0 ? (
                <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto pr-1">
                  {bookingItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {item.quantity}x {item.equipmentName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBookingItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-505 hover:text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 hover:bg-rose-500/10 rounded-md transition-all text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mb-3">No equipment selected yet. Add items below.</p>
              )}

              {/* Input row */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">Select Equipment</label>
                  <select
                    value={selectedEquipmentId}
                    onChange={(e) => setSelectedEquipmentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-900 text-[11px] h-8 px-2 text-slate-755 dark:text-slate-200 outline-none"
                  >
                    <option value="">Choose equipment...</option>
                    {equipment
                      .filter((e) => {
                        const cartQty = bookingItems.find(item => item.equipmentId === e.id)?.quantity || 0;
                        return e.rentedCount + cartQty < e.totalStock && e.maintenanceStatus !== "Under Repair";
                      })
                      .map((e) => {
                        const cartQty = bookingItems.find(item => item.equipmentId === e.id)?.quantity || 0;
                        const avail = e.totalStock - e.rentedCount - cartQty;
                        return (
                          <option key={e.id} value={e.id}>
                            {e.name} ({avail} avail) - ₹{e.dailyRate}/d
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div className="w-16 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-505 block">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] h-8 px-2 text-slate-700 dark:text-slate-200 outline-none font-semibold"
                  />
                </div>
                <button
                  type="button"
                  disabled={!selectedEquipmentId}
                  onClick={() => {
                    const eq = equipment.find(e => e.id === selectedEquipmentId);
                    if (!eq) return;
                    
                    const existingIdx = bookingItems.findIndex(item => item.equipmentId === selectedEquipmentId);
                    if (existingIdx > -1) {
                      setBookingItems(prev => prev.map((item, idx) => 
                        idx === existingIdx 
                          ? { ...item, quantity: item.quantity + selectedQuantity }
                          : item
                      ));
                    } else {
                      setBookingItems(prev => [...prev, {
                        equipmentId: selectedEquipmentId,
                        equipmentName: eq.name,
                        quantity: selectedQuantity
                      }]);
                    }
                    setSelectedEquipmentId("");
                    setSelectedQuantity(1);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-[11px] h-8 px-3 rounded-lg transition-all shrink-0"
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Rent Out Date</label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Expected Return</label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            {/* Live Pricing Preview */}
            {rentalDays > 0 && calculatedCost > 0 && (
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Agreement Duration</span>
                  <span className="text-slate-850 dark:text-slate-200 font-extrabold">{rentalDays} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Calculated Cost Terms</span>
                  <span className="text-amber-500 font-extrabold">₹{calculatedCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-505 font-medium italic mt-1 leading-snug">
                  * Pricing structures calculate weekly rates first, adding remaining daily balances. Includes full coverage dispatch insurance.
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-855 h-9"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedCustomerId || bookingItems.length === 0 || rentalDays <= 0}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9 disabled:opacity-40"
              >
                Book Dispatch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit/Extend Booking Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-955 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Edit / Extend Rental Agreement</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Modify contract details, correct entries, or extend return dates.
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              
              {/* Customer Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Customer Client</label>
                <select
                  required
                  value={editCustomerId}
                  onChange={(e) => setEditCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Items Builder */}
              <div className="space-y-2 border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Equipment Cart</span>
                
                {/* Added items list */}
                {editBookingItems.length > 0 ? (
                  <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto pr-1">
                    {editBookingItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-955 p-2 rounded-lg border border-slate-100 dark:border-slate-850 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.quantity}x {item.equipmentName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditBookingItems(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 hover:bg-rose-500/10 rounded-md transition-all text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mb-3">No equipment selected. Add items below.</p>
                )}

                {/* Input row */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">Select Equipment</label>
                    <select
                      value={editSelEqId}
                      onChange={(e) => setEditSelEqId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] h-8 px-2 text-slate-700 dark:text-slate-200 outline-none"
                    >
                      <option value="">Choose equipment...</option>
                      {equipment
                        .filter((e) => {
                          const cartQty = editBookingItems.find(item => item.equipmentId === e.id)?.quantity || 0;
                          const currentRentedInBooking = editingBooking.items?.find(item => item.equipmentId === e.id)?.quantity || 0;
                          const avail = e.totalStock - (e.rentedCount - currentRentedInBooking) - cartQty;
                          return avail > 0 && e.maintenanceStatus !== "Under Repair";
                        })
                        .map((e) => {
                          const cartQty = editBookingItems.find(item => item.equipmentId === e.id)?.quantity || 0;
                          const currentRentedInBooking = editingBooking.items?.find(item => item.equipmentId === e.id)?.quantity || 0;
                          const avail = e.totalStock - (e.rentedCount - currentRentedInBooking) - cartQty;
                          return (
                            <option key={e.id} value={e.id}>
                              {e.name} ({avail} avail) - ₹{e.dailyRate}/d
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div className="w-16 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={editSelQty}
                      onChange={(e) => setEditSelQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] h-8 px-2 text-slate-700 dark:text-slate-200 outline-none font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!editSelEqId}
                    onClick={() => {
                      const eq = equipment.find(e => e.id === editSelEqId);
                      if (!eq) return;
                      
                      const existingIdx = editBookingItems.findIndex(item => item.equipmentId === editSelEqId);
                      if (existingIdx > -1) {
                        setEditBookingItems(prev => prev.map((item, idx) => 
                          idx === existingIdx 
                            ? { ...item, quantity: item.quantity + editSelQty }
                            : item
                        ));
                      } else {
                        setEditBookingItems(prev => [...prev, {
                          equipmentId: editSelEqId,
                          equipmentName: eq.name,
                          quantity: editSelQty
                        }]);
                      }
                      setEditSelEqId("");
                      setEditSelQty(1);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-[11px] h-8 px-3 rounded-lg transition-all shrink-0"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Rent Out Date</label>
                  <Input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Expected Return</label>
                  <Input
                    type="date"
                    required
                    value={editEndDate}
                    min={editStartDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-805 text-xs h-9"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Agreement Status</label>
                <select
                  required
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Booking["status"])}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              {/* Live Cost Breakdown */}
              {editRentalDays > 0 && editCalculatedCost > 0 && (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Adjusted Duration</span>
                    <span className="text-slate-850 dark:text-slate-200 font-extrabold">{editRentalDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Original Booking Charges</span>
                    <span className="text-slate-850 dark:text-slate-200 font-medium">₹{editingBooking.totalCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>New Calculated Charges</span>
                    <span className="text-amber-500 font-extrabold">₹{editCalculatedCost.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-855 h-9"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    editRentalDays <= 0 ||
                    (editCustomerId === editingBooking.customerId &&
                      JSON.stringify(editBookingItems) === JSON.stringify(editingBooking.items || []) &&
                      editStartDate === editingBooking.startDate &&
                      editEndDate === editingBooking.endDate &&
                      editStatus === editingBooking.status)
                  }
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9 disabled:opacity-40"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
