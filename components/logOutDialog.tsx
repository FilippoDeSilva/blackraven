import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LogOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogout: () => void
}

export function LogOutDialog({ open, onOpenChange, onLogout }: LogOutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Confirm Logout</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onLogout}
            className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 