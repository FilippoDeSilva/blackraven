import React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SecuritySettingsProps {
  passphrase: string;
  setPassphrase: (value: string) => void;
  showPassphrase: boolean;
  setShowPassphrase: (value: boolean) => void;
  passphraseError: string | null;
  validatePassphrase: (value: string) => string | null;
}

export function SecuritySettings({
  passphrase,
  setPassphrase,
  showPassphrase,
  setShowPassphrase,
  passphraseError,
  validatePassphrase,
}: SecuritySettingsProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Lock className="h-5 w-5 text-rose-500" />
          Security Settings
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Set an optional passphrase to protect your files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="passphrase" className="dark:text-gray-300">Deactivation Passphrase (Optional)</Label>
          <div className="relative">
            <Input
              id="passphrase"
              type={showPassphrase ? "text" : "password"}
              placeholder="Enter a passphrase"
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value);
                // Clear error on change if it was due to initial empty state
                if (passphraseError && e.target.value.length > 0) {
                  validatePassphrase(e.target.value);
                }
              }}
              onBlur={(e) => validatePassphrase(e.target.value)} // Validate on blur
              className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassphrase(!showPassphrase)}
            >
              {showPassphrase ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          {passphraseError && <p className="text-xs text-red-500 mt-1">{passphraseError}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 