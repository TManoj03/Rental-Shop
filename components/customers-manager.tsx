"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Briefcase, 
  History
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

interface CustomersManagerProps {
  customers: Customer[];
  bookings: Booking[];
  onAddCustomer: (customer: Omit<Customer, "id" | "activeRentalsCount" | "totalSpend">) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export function CustomersManager({
  customers,
  bookings,
  onAddCustomer,
  onUpdateCustomer
}: CustomersManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Drill-down customer history modal state
  const [selectedCustHistory, setSelectedCustHistory] = useState<Customer | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditCompany(customer.company);
    setEditEmail(customer.email);
    setEditPhone(customer.phone);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onUpdateCustomer({
      ...editingCustomer,
      name: editName,
      company: editCompany,
      email: editEmail,
      phone: editPhone,
    });
    setIsEditModalOpen(false);
    setEditingCustomer(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer({
      name: newName,
      company: newCompany,
      email: newEmail,
      phone: newPhone,
    });
    // Reset fields
    setNewName("");
    setNewCompany("");
    setNewEmail("");
    setNewPhone("");
    setIsAddModalOpen(false);
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
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
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

      {/* Grid of Customers */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((c) => (
            <Card 
              key={c.id} 
              className="rounded-2xl border-none shadow-sm dark:bg-slate-950 bg-white ring-1 ring-slate-200/50 dark:ring-slate-800/60 overflow-hidden hover:shadow-md hover:ring-slate-300 dark:hover:ring-slate-700 transition-all duration-200 flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3 border-b border-slate-50 dark:border-slate-900/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-500 font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {getCustomerInitials(c.name)}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-[14px] text-slate-900 dark:text-white leading-tight">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        <Briefcase className="size-3 text-slate-400" />
                        <span>{c.company}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEditModal(c)}
                      className="border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 px-2.5"
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
                      className="border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-[10px] font-bold gap-1 text-slate-600 dark:text-slate-400"
                    >
                      <History className="size-3" />
                      Audit Logs
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-450 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                </div>

                {/* Performance stats row */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Active Contracts</span>
                    <span className="text-sm font-extrabold text-slate-850 dark:text-slate-100">{c.activeRentalsCount} dispatch</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Lifetime Volume</span>
                    <span className="text-sm font-extrabold text-slate-850 dark:text-slate-100">₹{c.totalSpend.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

      {/* Register Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-855">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Register New Client</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Input general company coordinates to register a dispatcher account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Primary Contact Name</label>
              <Input 
                required 
                placeholder="e.g., John Miller" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Company Name</label>
              <Input 
                required 
                placeholder="e.g., Apex Builders Inc." 
                value={newCompany} 
                onChange={(e) => setNewCompany(e.target.value)} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Email Address</label>
              <Input 
                type="email"
                required 
                placeholder="e.g., john@apexbuilders.com" 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Phone Number</label>
              <Input 
                required 
                placeholder="e.g., (555) 123-4567" 
                value={newPhone} 
                onChange={(e) => setNewPhone(e.target.value)} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
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
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9"
              >
                Register Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Audit History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="size-5 text-amber-500" />
              <span>Rental History Audit</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Review active and historical equipment dispatch agreements for <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustHistory?.name} ({selectedCustHistory?.company})</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {selectedCustomerBookings.length > 0 ? (
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
                    {selectedCustomerBookings.map((b) => (
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
                        <TableCell className="py-3 text-slate-550 dark:text-slate-400 font-medium">
                          {b.startDate} to {b.status === "Completed" && b.actualReturnDate ? b.actualReturnDate : b.endDate}
                        </TableCell>
                        <TableCell className="font-extrabold py-3 text-slate-850 dark:text-slate-200">₹{b.totalCost.toLocaleString("en-IN")}</TableCell>
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
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 italic">
                No contracts registered under this client yet.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsHistoryModalOpen(false)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl h-9"
            >
              Close Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-855">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Edit Client Coordinates</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Update company records or contact information for this client account.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Client Full Name</label>
                <Input 
                  required 
                  placeholder="e.g., Rajesh Mehta" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Company Name</label>
                <Input 
                  required 
                  placeholder="e.g., Apex Infrastructure Pvt Ltd" 
                  value={editCompany} 
                  onChange={(e) => setEditCompany(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Email Address</label>
                <Input 
                  type="email" 
                  required 
                  placeholder="e.g., info@company.in" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Phone Number</label>
                <Input 
                  required 
                  placeholder="e.g., +91 98765 43210" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
                />
              </div>
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
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9"
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
