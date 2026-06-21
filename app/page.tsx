"use client";

import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardOverview } from "@/components/dashboard-overview";
import { InventoryManager } from "@/components/inventory-manager";
import { BookingsManager } from "@/components/bookings-manager";
import { CustomersManager } from "@/components/customers-manager";
import { MaintenanceManager } from "@/components/maintenance-manager";
import { AuditLogsManager } from "@/components/audit-logs-manager";
import { ReportsManager } from "@/components/reports-manager";
import {
  Equipment,
  Customer,
  Booking,
  MaintenanceLog,
  AuditLog,
  INITIAL_EQUIPMENT,
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
  INITIAL_MAINTENANCE,
  getStoredData,
  setStoredData,
} from "@/lib/mock-data";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core States
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal control shortcuts
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isAddEqModalOpen, setIsAddEqModalOpen] = useState(false);
  const [preSelectedEqId, setPreSelectedEqId] = useState<string | null>(null);

  const refreshAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error refreshing audit logs:", error);
    }
  };

  // Initialize and load from MongoDB Atlas APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [eqRes, custRes, bkRes, maintRes, auditRes] = await Promise.all([
          fetch("/api/equipment"),
          fetch("/api/customers"),
          fetch("/api/bookings"),
          fetch("/api/maintenance"),
          fetch("/api/audit-logs"),
        ]);

        const eqData = await eqRes.json();
        const custData = await custRes.json();
        const bkData = await bkRes.json();
        const maintData = await maintRes.json();
        const auditData = await auditRes.json();

        setEquipment(Array.isArray(eqData) ? eqData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
        setBookings(Array.isArray(bkData) ? bkData : []);
        setMaintenanceLogs(Array.isArray(maintData) ? maintData : []);
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
        setDarkMode(getStoredData<boolean>("ironclad_darkmode", true));
        setIsMounted(true);
      } catch (error) {
        console.error("Failed to load backend data:", error);
        // Fallback to local storage or mock data if API fails
        setEquipment(
          getStoredData<Equipment[]>("ironclad_equipment", INITIAL_EQUIPMENT),
        );
        setCustomers(
          getStoredData<Customer[]>("ironclad_customers", INITIAL_CUSTOMERS),
        );
        setBookings(
          getStoredData<Booking[]>("ironclad_bookings", INITIAL_BOOKINGS),
        );
        setMaintenanceLogs(
          getStoredData<MaintenanceLog[]>(
            "ironclad_maintenance",
            INITIAL_MAINTENANCE,
          ),
        );
        setAuditLogs([]);
        setDarkMode(getStoredData<boolean>("ironclad_darkmode", true));
        setIsMounted(true);
      }
    };

    setTimeout(() => {
      loadData();
    }, 0);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setStoredData("ironclad_darkmode", darkMode);

    // Toggle dark mode class on document
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, isMounted]);

  // Calculations for sidebar stats
  const activeRentalsCount = bookings.filter(
    (b) => b.status === "Active" || b.status === "Overdue",
  ).length;
  const maintenanceAlertCount = equipment.filter(
    (e) =>
      e.maintenanceStatus === "Under Repair" ||
      e.maintenanceStatus === "Requires Service",
  ).length;
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

  // Core Actions handlers

  // 1. Add Equipment Asset
  const handleAddEquipment = async (
    eqData: Omit<Equipment, "id" | "rentedCount" | "status">,
  ) => {
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eqData),
      });
      const newEq = await response.json();
      setEquipment((prev) => [newEq, ...prev]);
    } catch (error) {
      console.error("Error adding equipment:", error);
    }
  };

  // 2. Update Equipment Asset
  const handleUpdateEquipment = async (updatedEq: Equipment) => {
    try {
      const response = await fetch(`/api/equipment/${updatedEq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEq),
      });
      const data = await response.json();
      setEquipment((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      refreshAuditLogs();
    } catch (error) {
      console.error("Error updating equipment:", error);
    }
  };

  // 3. Delete Equipment Asset
  const handleDeleteEquipment = async (id: string) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEquipment((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
    }
  };

  // 4. Create Agreement / Booking
  const handleAddBooking = async (
    bookingData: Omit<Booking, "id" | "status">,
  ) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const newBooking = await response.json();
      setBookings((prev) => [newBooking, ...prev]);

      // Refresh equipment & customers list from database to sync balances
      const [eqRes, custRes] = await Promise.all([
        fetch("/api/equipment"),
        fetch("/api/customers"),
      ]);
      const eqData = await eqRes.json();
      const custData = await custRes.json();
      setEquipment(eqData);
      setCustomers(custData);
      refreshAuditLogs();
    } catch (error) {
      console.error("Error adding booking:", error);
    }
  };

  // 5. Return Equipment / Return Check-In
  const handleReturnBooking = async (bookingId: string, balancePaid: number = 0) => {
    try {
      // Find the booking to compute updated payment fields
      const booking = bookings.find((b) => b.id === bookingId);
      const newPaidAmount = (booking?.paidAmount || 0) + balancePaid;
      const newBalanceDue = Math.max(0, (booking?.totalCost || 0) - newPaidAmount);

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
        }),
      });
      const updatedBooking = await response.json();

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
      );

      // Sync updated data from backend
      const [eqRes, custRes] = await Promise.all([
        fetch("/api/equipment"),
        fetch("/api/customers"),
      ]);
      const eqData = await eqRes.json();
      const custData = await custRes.json();
      setEquipment(eqData);
      setCustomers(custData);
      refreshAuditLogs();
    } catch (error) {
      console.error("Error returning booking:", error);
    }
  };


  // 6. Mark booking overdue
  const handleMarkOverdue = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Overdue" }),
      });
      const updatedBooking = await response.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
      );
      refreshAuditLogs();
    } catch (error) {
      console.error("Error marking booking overdue:", error);
    }
  };

  const handleUpdateBooking = async (
    bookingId: string,
    updateData: Record<string, unknown>,
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const updatedBooking = await response.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
      );

      // Refresh equipment & customers list from database to sync balances
      const [eqRes, custRes] = await Promise.all([
        fetch("/api/equipment"),
        fetch("/api/customers"),
      ]);
      const eqData = await eqRes.json();
      const custData = await custRes.json();
      setEquipment(eqData);
      setCustomers(custData);
      refreshAuditLogs();
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  // 7. Add customer to database
  const handleAddCustomer = async (
    cData: Omit<Customer, "id" | "activeRentalsCount" | "totalSpend">,
  ) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cData),
      });
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers((prev) => [...prev, newCustomer]);
      } else {
        const errorData = await response.json();
        alert(
          errorData.error ||
            "Failed to add customer. If you just updated database models, please restart your development server to apply Mongoose schema changes.",
        );
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleUpdateCustomer = async (updatedCust: Customer) => {
    try {
      const response = await fetch(`/api/customers/${updatedCust.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCust),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers((prev) => prev.map((c) => (c.id === data.id ? data : c)));

        // Refresh bookings to reflect new customer name/company
        const bkRes = await fetch("/api/bookings");
        const bkData = await bkRes.json();
        setBookings(bkData);
        refreshAuditLogs();
      } else {
        const errorData = await response.json();
        alert(
          errorData.error ||
            "Failed to update customer. If you just updated database models, please restart your development server to apply Mongoose schema changes.",
        );
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        refreshAuditLogs();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  // 8. Report Mechanical defect
  const handleAddMaintenanceLog = async (
    logData: Omit<MaintenanceLog, "id" | "status">,
  ) => {
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      const newLog = await response.json();
      setMaintenanceLogs((prev) => [newLog, ...prev]);

      // Set the machine status to Requires Service mode locally
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === logData.equipmentId
            ? { ...e, maintenanceStatus: "Requires Service" }
            : e,
        ),
      );
    } catch (error) {
      console.error("Error adding maintenance log:", error);
    }
  };

  const handleSendToMaintenance = (eqId: string, description: string) => {
    const eq = equipment.find((e) => e.id === eqId);
    if (!eq) return;
    handleAddMaintenanceLog({
      equipmentId: eqId,
      equipmentName: eq.name,
      description,
      cost: 150, // default estimation
      reportedDate: new Date().toISOString().split("T")[0],
      technician: "On-Duty Mechanic",
    });
  };

  // 9. Update repairs status (Pending -> In Progress -> Completed)
  const handleUpdateMaintenanceStatus = async (
    logId: string,
    status: MaintenanceLog["status"],
    cost?: number,
  ) => {
    try {
      const response = await fetch(`/api/maintenance/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cost }),
      });
      const updatedLog = await response.json();

      setMaintenanceLogs((prev) =>
        prev.map((log) => (log.id === logId ? updatedLog : log)),
      );

      // Sync equipment states from backend
      const eqRes = await fetch("/api/equipment");
      const eqData = await eqRes.json();
      setEquipment(eqData);
    } catch (error) {
      console.error("Error updating maintenance status:", error);
    }
  };

  // Shortcut for Quick booking from Inventory Cards
  const handleOpenRentModalWithEq = (eqId: string) => {
    setPreSelectedEqId(eqId);
    setActiveTab("bookings");
    setIsRentModalOpen(true);
  };

  // Rendering routing control
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            equipment={equipment}
            bookings={bookings}
            onOpenRentModal={() => {
              setActiveTab("bookings");
              setIsRentModalOpen(true);
            }}
            onOpenAddEquipmentModal={() => {
              setActiveTab("inventory");
              setIsAddEqModalOpen(true);
            }}
          />
        );
      case "inventory":
        return (
          <InventoryManager
            equipment={equipment}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onSendToMaintenance={handleSendToMaintenance}
            onOpenRentModalWithEq={handleOpenRentModalWithEq}
            isAddModalOpen={isAddEqModalOpen}
            setIsAddModalOpen={setIsAddEqModalOpen}
          />
        );
      case "bookings":
        return (
          <BookingsManager
            bookings={bookings}
            equipment={equipment}
            customers={customers}
            onAddBooking={handleAddBooking}
            onReturnBooking={handleReturnBooking}
            onMarkOverdue={handleMarkOverdue}
            onUpdateBooking={handleUpdateBooking}
            isAddModalOpen={isRentModalOpen}
            setIsAddModalOpen={setIsRentModalOpen}
            preSelectedEqId={preSelectedEqId}
            setPreSelectedEqId={setPreSelectedEqId}
          />
        );
      case "customers":
        return (
          <CustomersManager
            customers={customers}
            bookings={bookings}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case "maintenance":
        return (
          <MaintenanceManager
            maintenanceLogs={maintenanceLogs}
            equipment={equipment}
            onAddMaintenanceLog={handleAddMaintenanceLog}
            onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus}
          />
        );
      case "audit":
        return <AuditLogsManager auditLogs={auditLogs} />;
      case "reports":
        return (
          <ReportsManager
            bookings={bookings}
            maintenanceLogs={maintenanceLogs}
          />
        );
      default:
        return <div>Dashboard console out of bounds.</div>;
    }
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-400 font-medium">
        <span>Starting Vinayaga Heavy Dispatch Console...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar Console Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        stats={{
          totalRevenue,
          activeRentals: activeRentalsCount,
          maintenanceRequired: maintenanceAlertCount,
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Primary Tab Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between px-6 shrink-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-355"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative size-7 overflow-hidden rounded-lg bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/vinayaga_logo.png"
                  alt="Vinayaga logo"
                  className="size-full object-cover"
                />
              </div>
              <span className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                VINAYAGA RENTAL WORK
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-500 capitalize bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10">
            {activeTab}
          </span>
        </header>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
