"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  loadingText?: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  itemName,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  loadingText,
}: ConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          iconBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
          confirmBtn: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold",
        };
      case "info":
        return {
          iconBg: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
          confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white font-bold",
        };
      case "danger":
      default:
        return {
          iconBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
          confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white font-bold",
        };
    }
  };

  const styles = getVariantStyles();

  const activeLoadingText = loadingText || (confirmText.toLowerCase().includes("revert") ? "Reverting..." : "Deleting...");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-6"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Visual Indicator Icon */}
          <div className={`p-3 rounded-full ${styles.iconBg} ${isLoading ? "animate-spin" : "animate-bounce"}`}>
            {isLoading ? <Loader2 className="size-6 animate-spin" /> : <AlertTriangle className="size-6" />}
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="font-heading font-black text-slate-900 dark:text-white text-lg">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {description}{" "}
              {itemName && (
                <span className="block mt-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                  {itemName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 dark:border-slate-850 h-9 font-semibold text-xs disabled:opacity-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl h-9 text-xs flex items-center justify-center gap-1.5 min-w-[100px] ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{activeLoadingText}</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
