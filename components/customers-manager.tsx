"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Briefcase, 
  History,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Customer, Booking } from "@/lib/mock-data";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface CustomersManagerProps {
  customers: Customer[];
  bookings: Booking[];
  onAddCustomer: (customer: Omit<Customer, "id" | "activeRentalsCount" | "totalSpend">) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export function CustomersManager({
  customers,
  bookings,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}: CustomersManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // History Pagination state
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyItemsPerPage = 5;

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Drill-down customer history modal state
  const [selectedCustHistory, setSelectedCustHistory] = useState<Customer | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Reset history pagination when active history customer changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [selectedCustHistory]);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addTouched, setAddTouched] = useState<Record<string, boolean>>({});

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  // ── Validation helpers ──────────────────────────────────────────
  /** Strip and check for consecutive spaces */
  const hasConsecutiveSpaces = (v: string) => /  /.test(v);
  /** Check minimum 3 real (non-space) characters */
  const hasMinChars = (v: string) => v.replace(/\s/g, "").length >= 3;
  /** Exactly 10 digits */
  const isValidPhone = (v: string) => /^\d{10}$/.test(v.trim());

  /** Block consecutive spaces on any input */
  const blockDoubleSpace = (value: string, setter: (v: string) => void) => {
    if (!hasConsecutiveSpaces(value)) setter(value);
  };

  /** Validate Add form; returns error map */
  const validateAdd = () => {
    const errs: Record<string, string> = {};
    if (!hasMinChars(newName)) errs.name = "Name must have at least 3 characters.";
    if (newCompany && !hasMinChars(newCompany)) errs.company = "Company name must have at least 3 characters.";
    if (!isValidPhone(newPhone)) errs.phone = "Phone must be exactly 10 digits (numbers only).";
    return errs;
  };

  /** Validate Edit form; returns error map */
  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!hasMinChars(editName)) errs.name = "Name must have at least 3 characters.";
    if (editCompany && !hasMinChars(editCompany)) errs.company = "Company name must have at least 3 characters.";
    if (!isValidPhone(editPhone)) errs.phone = "Phone must be exactly 10 digits (numbers only).";
    return errs;
  };

  const addIsValid = Object.keys(validateAdd()).length === 0;
  const editIsValid = Object.keys(validateEdit()).length === 0;
  // ────────────────────────────────────────────────────────────────

  // Delete confirm modal state
  const [custToDelete, setCustToDelete] = useState<Customer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerDeleteConfirm = (customer: Customer) => {
    setCustToDelete(customer);
    setIsDeleteConfirmOpen(true);
  };

  const resetAddForm = () => {
    setNewName("");
    setNewCompany("");
    setNewEmail("");
    setNewPhone("");
    setAddErrors({});
    setAddTouched({});
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedCustHistory(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setEditName("");
    setEditCompany("");
    setEditEmail("");
    setEditPhone("");
    setEditErrors({});
    setEditTouched({});
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditCompany(customer.company || "");
    setEditEmail(customer.email || "");
    setEditPhone(customer.phone);
    setEditErrors({});
    setEditTouched({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields touched so errors show
    setEditTouched({ name: true, company: true, phone: true });
    const errs = validateEdit();
    setEditErrors(errs);
    if (Object.keys(errs).length > 0 || !editingCustomer) return;
    onUpdateCustomer({
      ...editingCustomer,
      name: editName.trim(),
      company: editCompany.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    });
    closeEditModal();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddTouched({ name: true, company: true, phone: true });
    const errs = validateAdd();
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onAddCustomer({
      name: newName.trim(),
      company: newCompany.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
    });
    closeAddModal();
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter list
  const filteredCustomers = customers.filter((c) => {
    if (!c || typeof c.name !== "string") return false;
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").includes(searchQuery);
    return matchesSearch;
  });

  // Get selected customer bookings
  const selectedCustomerBookings = selectedCustHistory 
    ? bookings.filter((b) => b.customerId === selectedCustHistory.id)
    : [];

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer Directory
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Maintain dispatcher client records, track total spends, and audit rental logs.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-1.5 rounded-xl shadow-md shadow-amber-500/10 h-10 px-4"
        >
          <Plus className="size-4 stroke-[3]" />
          Register New Client
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Search by customer name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* Table of Customers */}
      {filteredCustomers.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
                <TableRow className="border-none">
                  <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-6 py-4">Client Name</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Contact Details</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Active Rentals</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Lifetime Spend</TableHead>
                  <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-6 py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-900">
                {filteredCustomers
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((c) => (
                    <TableRow 
                      key={c.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-none transition-colors duration-150"
                    >
                      {/* Client Name Column */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-500 font-black flex items-center justify-center text-xs shrink-0 border border-amber-500/10">
                            {getCustomerInitials(c.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">{c.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <Briefcase className="size-2.5 text-slate-400" />
                              {c.company || "Individual"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Details Column */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {c.email ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Mail className="size-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                              <Mail className="size-3 shrink-0" />
                              <span>No Email</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Active Rentals Column */}
                      <TableCell className="py-4">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {c.activeRentalsCount} active
                        </span>
                      </TableCell>

                      {/* Lifetime Spend Column */}
                      <TableCell className="py-4">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          ₹{c.totalSpend.toLocaleString("en-IN")}
                        </span>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="pr-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEditModal(c)}
                            className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedCustHistory(c);
                              setIsHistoryModalOpen(true);
                            }}
                            className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-[10px] font-bold gap-1 text-slate-600 dark:text-slate-400 h-7 px-2.5"
                          >
                            <History className="size-2.5" />
                            Audit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={c.activeRentalsCount > 0}
                            onClick={() => triggerDeleteConfirm(c)}
                            className="border-slate-200/80 dark:border-slate-800/60 hover:bg-rose-500/10 hover:text-rose-500 dark:bg-slate-950 rounded-xl text-slate-400 size-7 shrink-0 disabled:opacity-30"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 bg-transparent text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} clients
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl disabled:opacity-30"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: Math.ceil(filteredCustomers.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl text-[10px] font-extrabold ${
                      currentPage === page
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500"
                        : "border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === Math.ceil(filteredCustomers.length / itemsPerPage)}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredCustomers.length / itemsPerPage)))}
                  className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl disabled:opacity-30"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center py-16">
          <Users className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
          <h3 className="font-heading font-black text-slate-800 dark:text-white text-base">No Customers Found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
            No dispatcher client database matched your query. Add a new customer to continue checking out machinery.
          </p>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={(open) => { if (!open) closeAddModal(); }}>
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Register New Client</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Input general company coordinates to register a dispatcher account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2" noValidate>
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Primary Contact Name <span className="text-red-500">*</span></label>
              <Input
                required
                placeholder="e.g., John Miller"
                value={newName}
                onChange={(e) => {
                  blockDoubleSpace(e.target.value, setNewName);
                  if (addTouched.name) setAddErrors((prev) => ({ ...prev, name: !hasMinChars(e.target.value) ? "Name must have at least 3 characters." : "" }));
                }}
                onBlur={() => {
                  setAddTouched((p) => ({ ...p, name: true }));
                  setAddErrors((p) => ({ ...p, name: !hasMinChars(newName) ? "Name must have at least 3 characters." : "" }));
                }}
                className={`rounded-xl border text-xs h-9 ${
                  addTouched.name && addErrors.name
                    ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {addTouched.name && addErrors.name && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{addErrors.name}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Company Name</label>
              <Input
                placeholder="e.g., Apex Builders Inc. (Optional)"
                value={newCompany}
                onChange={(e) => {
                  blockDoubleSpace(e.target.value, setNewCompany);
                  if (addTouched.company && e.target.value)
                    setAddErrors((prev) => ({ ...prev, company: !hasMinChars(e.target.value) ? "Company name must have at least 3 characters." : "" }));
                }}
                onBlur={() => {
                  if (newCompany) {
                    setAddTouched((p) => ({ ...p, company: true }));
                    setAddErrors((p) => ({ ...p, company: !hasMinChars(newCompany) ? "Company name must have at least 3 characters." : "" }));
                  }
                }}
                className={`rounded-xl border text-xs h-9 ${
                  addTouched.company && addErrors.company
                    ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {addTouched.company && addErrors.company && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{addErrors.company}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Email Address</label>
              <Input
                type="email"
                placeholder="e.g., john@apexbuilders.com (Optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Phone Number <span className="text-red-500">*</span></label>
              <Input
                required
                placeholder="10-digit number e.g., 9876543210"
                value={newPhone}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => {
                  // Only allow digits
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setNewPhone(digits);
                  if (addTouched.phone)
                    setAddErrors((prev) => ({ ...prev, phone: !isValidPhone(digits) ? "Phone must be exactly 10 digits." : "" }));
                }}
                onBlur={() => {
                  setAddTouched((p) => ({ ...p, phone: true }));
                  setAddErrors((p) => ({ ...p, phone: !isValidPhone(newPhone) ? "Phone must be exactly 10 digits (numbers only)." : "" }));
                }}
                className={`rounded-xl border text-xs h-9 ${
                  addTouched.phone && addErrors.phone
                    ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {addTouched.phone && addErrors.phone && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{addErrors.phone}</p>
              )}
              {newPhone.length > 0 && (
                <p className="text-[10px] text-slate-400 font-medium">{newPhone.length}/10 digits</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                className="rounded-xl border border-slate-200 dark:border-slate-800 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!addIsValid && Object.values(addTouched).some(Boolean)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9 disabled:opacity-50"
              >
                Register Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Audit History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={(open) => { if (!open) closeHistoryModal(); }}>
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-2xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="size-5 text-amber-500" />
              <span>Rental History Audit</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Review active and historical equipment dispatch agreements for <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustHistory?.name}{selectedCustHistory?.company ? ` (${selectedCustHistory.company})` : ""}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {selectedCustomerBookings.length > 0 ? (
              <div className="space-y-4">
                <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                      <TableRow className="border-none">
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-3 pl-4">Contract</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-3">Equipment</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-3">Duration</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-3">Cost</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-400 py-3 pr-4 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {selectedCustomerBookings
                        .slice((historyCurrentPage - 1) * historyItemsPerPage, historyCurrentPage * historyItemsPerPage)
                        .map((b) => (
                          <TableRow key={b.id} className="border-none text-xs">
                            <TableCell className="font-bold py-3 pl-4 text-slate-850 dark:text-slate-200">#{b.id.toUpperCase()}</TableCell>
                            <TableCell className="font-bold py-3 text-slate-900 dark:text-white">
                              <div className="flex flex-col gap-0.5">
                                {b.items && b.items.length > 0 ? (
                                  b.items.map((item, idx) => (
                                    <span key={idx} className="block text-[10px]">
                                      {item.quantity}x {item.equipmentName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="block text-[10px] italic text-slate-400">
                                    {String((b as unknown as Record<string, unknown>).equipmentName || "No items")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-slate-555 dark:text-slate-400 font-medium">
                              {b.startDate} to {b.status === "Completed" && b.actualReturnDate ? b.actualReturnDate : b.endDate}
                            </TableCell>
                            <TableCell className="font-extrabold py-3 text-slate-855 dark:text-slate-200">₹{b.totalCost.toLocaleString("en-IN")}</TableCell>
                            <TableCell className="py-3 pr-4 text-right">
                              <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                b.status === "Completed" 
                                  ? "bg-emerald-500/10 text-emerald-600" 
                                  : b.status === "Overdue"
                                  ? "bg-rose-500/10 text-rose-600 animate-pulse"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}>
                                {b.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {selectedCustomerBookings.length > 0 && (
                  <div className="flex items-center justify-between px-1 bg-transparent text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      Showing {(historyCurrentPage - 1) * historyItemsPerPage + 1} to {Math.min(historyCurrentPage * historyItemsPerPage, selectedCustomerBookings.length)} of {selectedCustomerBookings.length} bookings
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={historyCurrentPage === 1}
                        onClick={() => setHistoryCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl disabled:opacity-30 size-7 p-0"
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      {Array.from({ length: Math.ceil(selectedCustomerBookings.length / historyItemsPerPage) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={historyCurrentPage === page ? "default" : "outline"}
                          size="icon-sm"
                          onClick={() => setHistoryCurrentPage(page)}
                          className={`rounded-xl text-[9px] font-extrabold size-7 p-0 ${
                            historyCurrentPage === page
                              ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500"
                              : "border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={historyCurrentPage === Math.ceil(selectedCustomerBookings.length / historyItemsPerPage)}
                        onClick={() => setHistoryCurrentPage((prev) => Math.min(prev + 1, Math.ceil(selectedCustomerBookings.length / historyItemsPerPage)))}
                        className="border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl disabled:opacity-30 size-7 p-0"
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 italic">
                No contracts registered under this client yet.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={closeHistoryModal}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl h-9"
            >
              Close Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Edit Client Coordinates</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Update company records or contact information for this client account.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2" noValidate>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Client Full Name <span className="text-red-500">*</span></label>
                <Input
                  required
                  placeholder="e.g., Rajesh Mehta"
                  value={editName}
                  onChange={(e) => {
                    blockDoubleSpace(e.target.value, setEditName);
                    if (editTouched.name) setEditErrors((p) => ({ ...p, name: !hasMinChars(e.target.value) ? "Name must have at least 3 characters." : "" }));
                  }}
                  onBlur={() => {
                    setEditTouched((p) => ({ ...p, name: true }));
                    setEditErrors((p) => ({ ...p, name: !hasMinChars(editName) ? "Name must have at least 3 characters." : "" }));
                  }}
                  className={`rounded-xl border text-xs h-9 ${
                    editTouched.name && editErrors.name
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {editTouched.name && editErrors.name && (
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">{editErrors.name}</p>
                )}
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Company Name</label>
                <Input
                  placeholder="e.g., Apex Infrastructure Pvt Ltd (Optional)"
                  value={editCompany}
                  onChange={(e) => {
                    blockDoubleSpace(e.target.value, setEditCompany);
                    if (editTouched.company && e.target.value)
                      setEditErrors((p) => ({ ...p, company: !hasMinChars(e.target.value) ? "Company name must have at least 3 characters." : "" }));
                  }}
                  onBlur={() => {
                    if (editCompany) {
                      setEditTouched((p) => ({ ...p, company: true }));
                      setEditErrors((p) => ({ ...p, company: !hasMinChars(editCompany) ? "Company name must have at least 3 characters." : "" }));
                    }
                  }}
                  className={`rounded-xl border text-xs h-9 ${
                    editTouched.company && editErrors.company
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {editTouched.company && editErrors.company && (
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">{editErrors.company}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g., info@company.in (Optional)"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Phone Number <span className="text-red-500">*</span></label>
                <Input
                  required
                  placeholder="10-digit number e.g., 9876543210"
                  value={editPhone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEditPhone(digits);
                    if (editTouched.phone)
                      setEditErrors((p) => ({ ...p, phone: !isValidPhone(digits) ? "Phone must be exactly 10 digits." : "" }));
                  }}
                  onBlur={() => {
                    setEditTouched((p) => ({ ...p, phone: true }));
                    setEditErrors((p) => ({ ...p, phone: !isValidPhone(editPhone) ? "Phone must be exactly 10 digits (numbers only)." : "" }));
                  }}
                  className={`rounded-xl border text-xs h-9 ${
                    editTouched.phone && editErrors.phone
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {editTouched.phone && editErrors.phone && (
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">{editErrors.phone}</p>
                )}
                {editPhone.length > 0 && (
                  <p className="text-[10px] text-slate-400 font-medium">{editPhone.length}/10 digits</p>
                )}
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
                  disabled={!editIsValid && Object.values(editTouched).some(Boolean)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9 disabled:opacity-50"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setCustToDelete(null);
        }}
        onConfirm={async () => {
          if (custToDelete) {
            setIsDeleting(true);
            try {
              await onDeleteCustomer(custToDelete.id);
            } catch (err) {
              console.error(err);
            } finally {
              setIsDeleting(false);
              setIsDeleteConfirmOpen(false);
              setCustToDelete(null);
            }
          }
        }}
        isLoading={isDeleting}
        title="Delete Customer Profile"
        description="Are you sure you want to delete this customer profile? This action cannot be undone."
        itemName={custToDelete ? `${custToDelete.name}${custToDelete.company ? ` (${custToDelete.company})` : ""}` : ""}
        confirmText="Delete Client"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
