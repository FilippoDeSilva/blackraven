import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeactivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeactivate: (transferId: string, input: string) => Promise<void>;
  transferId: string | null;
  scheduledTransfers: any[];
  setDeactivateInput: (value: string) => void;
  deactivateInput: string;
  wrongAttempts: number;
  bruteForceDetected: boolean;
  onSendNow: (transferId: string) => Promise<void>;
  onDeleteTransfer: (transferId: string) => Promise<void>;
}

export function DeactivationModal({
  open,
  onOpenChange,
  onDeactivate,
  transferId,
  scheduledTransfers,
  setDeactivateInput,
  deactivateInput,
  wrongAttempts,
  bruteForceDetected,
  onSendNow,
  onDeleteTransfer,
}: DeactivationModalProps) {
  const currentTransfer = scheduledTransfers.find((t) => t.id === transferId);

  if (!currentTransfer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Manage Scheduled Transfer</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            You are managing a scheduled transfer for <span className="font-medium text-rose-500">{currentTransfer.filename}</span>.
            You can deactivate, send now, or delete this transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deactivate-confirm-input" className="dark:text-gray-300">
              Type <span className="font-bold text-rose-500">DEACTIVATE</span> to permanently delete this file and cancel transfer:
            </Label>
            <Input
              id="deactivate-confirm-input"
              value={deactivateInput}
              onChange={(e) => setDeactivateInput(e.target.value)}
              placeholder="Type DEACTIVATE"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {wrongAttempts > 0 && (
              <p className="text-red-500 text-sm">Incorrect. Attempts: {wrongAttempts}</p>
            )}
            {bruteForceDetected && (
              <p className="text-red-700 text-sm">Too many failed attempts. Try again later.</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => onSendNow(currentTransfer.id)}
            disabled={currentTransfer.status === "sent" || currentTransfer.status === "cancelled"}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
          >
            Send Now
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDeactivate(currentTransfer.id, deactivateInput)}
            disabled={deactivateInput !== "DEACTIVATE" || bruteForceDetected || currentTransfer.status === "cancelled"}
            className="w-full sm:w-auto"
          >
            Deactivate
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDeleteTransfer(currentTransfer.id)}
            className="w-full sm:w-auto dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Delete from DB
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 