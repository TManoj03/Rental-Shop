"use client";

import React, { useState } from "react";
import { 
  Wrench, 
  Search, 
  Plus, 
  User
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
import { MaintenanceLog, Equipment } from "@/lib/mock-data";

interface MaintenanceManagerProps {
  maintenanceLogs: MaintenanceLog[];
  equipment: Equipment[];
  onAddMaintenanceLog: (log: Omit<MaintenanceLog, "id" | "status">) => void;
  onUpdateMaintenanceStatus: (logId: string, status: MaintenanceLog["status"], cost?: number) => void;
}

export function MaintenanceManager({
  maintenanceLogs,
  equipment,
  onAddMaintenanceLog,
  onUpdateMaintenanceStatus
}: MaintenanceManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Status update cost prompt modal state
  const [completingLogId, setCompletingLogId] = useState<string | null>(null);
  const [finalCost, setFinalCost] = useState(150);
  const [isCompletePromptOpen, setIsCompletePromptOpen] = useState(false);

  // Form states
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(100);
  const [technician, setTechnician] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipment.find(item => item.id === selectedEquipmentId);
    if (!eq) return;

    onAddMaintenanceLog({
      equipmentId: selectedEquipmentId,
      equipmentName: eq.name,
      description: issueDescription,
      cost: Number(estimatedCost),
      reportedDate: new Date().toISOString().split("T")[0],
      technician: technician || "On-Duty Mechanic"
    });

    // Reset forms
    setSelectedEquipmentId("");
    setIssueDescription("");
    setEstimatedCost(100);
    setTechnician("");
    setIsAddModalOpen(false);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completingLogId) {
      onUpdateMaintenanceStatus(completingLogId, "Completed", Number(finalCost));
      setCompletingLogId(null);
      setIsCompletePromptOpen(false);
    }
  };

  const getStatusBadge = (status: MaintenanceLog["status"]) => {
    switch (status) {
      case "Pending":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Pending
          </span>
        );
      case "In Progress":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            In Shop
          </span>
        );
      case "Completed":
        return (
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Serviced
          </span>
        );
    }
  };

  // Filter logs
  const filteredLogs = maintenanceLogs.filter((log) => {
    const matchesSearch = 
      log.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.technician.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Maintenance & Compliance Console
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Log machinery mechanical failures, coordinate service technicians, and manage repair logs.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-1.5 rounded-xl shadow-md shadow-amber-500/10 h-10 px-4"
        >
          <Plus className="size-4 stroke-[3]" />
          Log Maintenance Issue
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Search by equipment, mechanic, issue details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Pending", "In Progress", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-150 shrink-0 ${
                statusFilter === status
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tables of Repairs */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850 overflow-hidden">
        {filteredLogs.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
              <TableRow className="border-none">
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-6 py-4">Asset Name</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Issue Description</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Assigned Mechanic</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Reported Date</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Service Cost</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Status</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-6 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-900">
              {filteredLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-none transition-colors duration-150"
                >
                  <TableCell className="font-bold text-xs pl-6 py-4 text-slate-900 dark:text-white">
                    {log.equipmentName}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium text-slate-600 dark:text-slate-350 max-w-[220px]">
                    {log.description}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-slate-400" />
                      <span>{log.technician}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {log.reportedDate}
                  </TableCell>
                  <TableCell className="py-4 font-extrabold text-xs text-slate-900 dark:text-white">
                    ₹{log.cost.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    {log.status === "Pending" && (
                      <Button
                        size="xs"
                        onClick={() => onUpdateMaintenanceStatus(log.id, "In Progress")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px]"
                      >
                        Start Repair
                      </Button>
                    )}
                    {log.status === "In Progress" && (
                      <Button
                        size="xs"
                        onClick={() => {
                          setCompletingLogId(log.id);
                          setFinalCost(log.cost);
                          setIsCompletePromptOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-lg text-[10px]"
                      >
                        Complete Service
                      </Button>
                    )}
                    {log.status === "Completed" && (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic pr-3">
                        Finished {log.completedDate}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16">
            <Wrench className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-heading font-black text-slate-800 dark:text-white text-base">No Maintenance Records</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              Every equipment piece is operating cleanly. Create a ticket if a machine undergoes operational failure.
            </p>
          </div>
        )}
      </div>

      {/* Log Issue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Flag Mechanical Defect</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Submit defection profiles to queue equipment for mechanical inspection.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            
            {/* Equipment Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Flagged Asset</label>
              <select
                required
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs h-9 px-3 text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="">Choose equipment...</option>
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.serial})
                  </option>
                ))}
              </select>
            </div>

            {/* Mechanic name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Assigned Service Mechanic</label>
              <Input 
                required 
                placeholder="e.g., Alex Rivera" 
                value={technician} 
                onChange={(e) => setTechnician(e.target.value)} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>

            {/* Estimated Repair Cost */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Estimated Servicing Cost (₹)</label>
              <Input 
                type="number"
                required 
                min="0"
                value={estimatedCost} 
                onChange={(e) => setEstimatedCost(Number(e.target.value))} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>

            {/* Issue Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Defection Description</label>
              <textarea 
                required 
                placeholder="Detail engine starter, hydraulic leakages, scaffolding structure crack, etc." 
                value={issueDescription} 
                onChange={(e) => setIssueDescription(e.target.value)} 
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs p-3 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-medium"
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
                disabled={!selectedEquipmentId}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9 disabled:opacity-40"
              >
                Flag Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Maintenance Status Prompt Cost Dialog */}
      <Dialog open={isCompletePromptOpen} onOpenChange={setIsCompletePromptOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white">Confirm Service Completion</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Update the final maintenance invoice ledger to mark the fleet asset operational.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-505 dark:text-slate-400">Final Servicing Cost (₹)</label>
              <Input 
                type="number"
                required 
                min="0"
                value={finalCost} 
                onChange={(e) => setFinalCost(Number(e.target.value))} 
                className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCompletePromptOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-855 h-9"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl h-9"
              >
                Approve Return to Fleet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
