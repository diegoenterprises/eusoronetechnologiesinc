/**
 * CONFIRMATION DIALOG - EusoTrip Brand Design
 * Matches brand guidelines with gradient styling
 * Used for destructive actions, changes, and important confirmations
 */

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const getConfirmButtonStyle = () => {
    switch (variant) {
      case "destructive":
        return "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-0";
      case "warning":
        return "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white border-0";
      default:
        return "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1060DD] hover:to-[#A801DD] text-white border-0";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30 max-w-md">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-white text-lg font-semibold text-center">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-slate-400 text-center">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-3 sm:justify-center mt-4">
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all",
              getConfirmButtonStyle()
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={handleCancel}
            className="px-6 py-2 rounded-lg font-medium bg-slate-700/80 hover:bg-slate-600 text-white border-slate-600 transition-all"
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Pre-configured dialog variants for common use cases
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName = "this item",
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Are you sure you want to delete ${itemName}?`}
      description="This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
      isLoading={isLoading}
    />
  );
}

export function ChangeConfirmationDialog({
  open,
  onOpenChange,
  actionName = "make this change",
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Are you sure you want to ${actionName}?`}
      confirmText="Change"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="default"
      isLoading={isLoading}
    />
  );
}

export function SaveConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save changes before leaving?"
      description="You have unsaved changes that will be lost."
      confirmText="Save"
      cancelText="Discard"
      onConfirm={onConfirm}
      variant="default"
      isLoading={isLoading}
    />
  );
}

export function CancelConfirmationDialog({
  open,
  onOpenChange,
  actionName = "this action",
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Are you sure you want to cancel ${actionName}?`}
      description="Any progress will be lost."
      confirmText="Yes, Cancel"
      cancelText="Go Back"
      onConfirm={onConfirm}
      variant="warning"
      isLoading={isLoading}
    />
  );
}

export default ConfirmationDialog;
