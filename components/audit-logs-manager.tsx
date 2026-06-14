"use client";

import React, { useState } from "react";
import { History, Search, ClipboardList, User } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AuditLog } from "@/lib/mock-data";

interface AuditLogsManagerProps {
  auditLogs: AuditLog[];
}

export function AuditLogsManager({ auditLogs }: AuditLogsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEntity = entityFilter === "All" || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("created")) {
      return (
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
          Created
        </span>
      );
    } else if (act.includes("checked") || act.includes("returned")) {
      return (
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
          Checked In
        </span>
      );
    } else if (act.includes("overdue")) {
      return (
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 animate-pulse">
          Overdue
        </span>
      );
    } else if (act.includes("updated") || act.includes("edited")) {
      return (
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/10">
          Updated
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        {action}
      </span>
    );
  };

  const getEntityTypeBadge = (type: string) => {
    switch (type) {
      case "Booking":
        return <span className="font-semibold text-slate-850 dark:text-slate-355">Booking</span>;
      case "Customer":
        return <span className="font-semibold text-amber-600 dark:text-amber-400">Customer</span>;
      case "Equipment":
        return <span className="font-semibold text-cyan-600 dark:text-cyan-400">Equipment</span>;
      default:
        return <span className="font-semibold text-slate-505">{type}</span>;
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="size-6 text-amber-500" />
            System Audit Trail
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor real-time logs of contract checkouts, equipment inventory edits, customer revisions, and status adjustments.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-955 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850/80 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Search by log description, action, operator, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 font-heading">
          {["All", "Booking", "Customer", "Equipment"].map((type) => (
            <button
              key={type}
              onClick={() => setEntityFilter(type)}
              className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition-all duration-150 shrink-0 ${
                entityFilter === type
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {type === "All" ? "All Logs" : `${type} Logs`}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-850 overflow-hidden">
        {filteredLogs.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-900">
              <TableRow className="border-none">
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-6 py-4">Timestamp</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Action</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Target Entity</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-4">Description</TableHead>
                <TableHead className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-6 py-4 text-right">Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-900">
              {filteredLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-none transition-colors duration-150"
                >
                  <TableCell className="font-semibold text-xs pl-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    }) : "N/A"}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-xs uppercase">{log.entityId}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{getEntityTypeBadge(log.entityType)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium text-slate-750 dark:text-slate-300 max-w-md">
                    {log.description}
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      <User className="size-3 text-slate-400 dark:text-slate-550" />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{log.operator}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16">
            <ClipboardList className="size-12 text-slate-350 dark:text-slate-700 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-heading font-black text-slate-850 dark:text-white text-base">No Logs Recorded</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              We couldn&apos;t find any matching audit logs on file. Create, edit, or checkout dispatch assets to populate this console.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
