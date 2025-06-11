import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduledTransfersProps {
  loading: boolean;
  scheduledTransfers: any[];
  transferTimers: { [id: string]: string };
  onCreateNew: () => void;
}

export function ScheduledTransfers({
  loading,
  scheduledTransfers,
  transferTimers,
  onCreateNew,
}: ScheduledTransfersProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Clock className="h-5 w-5 text-rose-500" />
          Scheduled Transfers
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Manage your pending file transfers</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        ) : scheduledTransfers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-gray-300">
              No scheduled transfers
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-md mx-auto">
              You don't have any pending file transfers. Create a new transfer to get started.
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
              onClick={onCreateNew}
            >
              Create New Transfer
            </Button>
          </div>
        ) : (
          <div>
            {scheduledTransfers.map((transfer) => (
              <div key={transfer.id} className="space-y-2 mb-4">
                <h3 className="font-medium dark:text-white">{transfer.filename}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scheduled: {new Date(transfer.created_at).toLocaleDateString()}<br />
                  Time remaining: {transferTimers[transfer.id] || "-"}
                </p>
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                  {transfer.platforms && transfer.platforms.length > 0
                    ? transfer.platforms.map((platform: string) => (
                        <div key={platform} className="flex items-center text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          <span className="font-medium dark:text-gray-200">{platform}:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-300">{transfer.recipients?.[platform]}</span>
                        </div>
                      ))
                    : Object.entries(transfer.recipients || {}).map(([platform, email]) => (
                        <div key={platform} className="flex items-center text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          <span className="font-medium dark:text-gray-200">{platform}:</span>
                          <span className="ml-1 text-gray-600 dark:text-gray-300">{String(email)}</span>
                        </div>
                      ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 