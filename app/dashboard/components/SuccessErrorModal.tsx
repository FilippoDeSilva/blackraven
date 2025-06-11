import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuccess: boolean;
  message: string;
  modalKey: number;
}

export function SuccessErrorModal({
  open,
  onOpenChange,
  isSuccess,
  message,
  modalKey,
}: SuccessErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={modalKey}>
      <DialogContent className="w-[90vw] max-w-md sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {isSuccess ? "Transfer Scheduled!" : "Upload Error"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-fit bg-gradient-to-r from-rose-500 to-purple-500 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 