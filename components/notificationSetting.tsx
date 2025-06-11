import React from "react";
import { Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationSettingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlatforms: string[];
  onTogglePlatform: (platformId: string) => void;
  onSavePreferences: () => void;
}

const notificationPlatforms = [
  { id: "email", name: "Email", icon: Bell, default: true },
  { id: "push", name: "Push Notifications", icon: Bell },
];

export function NotificationSetting({
  open,
  onOpenChange,
  selectedPlatforms,
  onTogglePlatform,
  onSavePreferences,
}: NotificationSettingProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Notification Preferences</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Choose how you'd like to receive notifications from BlackRaven.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              You'll receive notifications about file transfers, security alerts, and account updates.
            </p>
          </div>
          <div className="grid gap-4">
            {notificationPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between"
              >
                <Label htmlFor={`platform-${platform.id}`}>
                  {platform.name}
                </Label>
                <Checkbox
                  id={`platform-${platform.id}`}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => onTogglePlatform(platform.id)}
                  className="dark:border-gray-500"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onSavePreferences}
            className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 