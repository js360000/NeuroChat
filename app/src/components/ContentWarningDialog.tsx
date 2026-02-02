import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ContentWarningDialogProps {
  open: boolean;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmLabel?: string;
}

export function ContentWarningDialog({
  open,
  warnings,
  onConfirm,
  onCancel,
  title = 'Sensitive content detected',
  confirmLabel = 'Send anyway'
}: ContentWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => (!isOpen ? onCancel() : null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            We noticed content that might include personal or sensitive info.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 text-sm text-neutral-600">
          {warnings.map((warning, index) => (
            <div key={`${warning}-${index}`} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Review</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
