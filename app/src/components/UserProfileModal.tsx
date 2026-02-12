import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserProfileView, type ProfileUser } from '@/components/UserProfileView';

interface UserProfileModalProps {
  user: ProfileUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLike?: () => void;
  onSuperLike?: () => void;
  onMessage?: () => void;
  onViewFullPage?: () => void;
}

export function UserProfileModal({
  user,
  open,
  onOpenChange,
  onLike,
  onSuperLike,
  onMessage,
  onViewFullPage,
}: UserProfileModalProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{user.name}&rsquo;s Profile</DialogTitle>
          <DialogDescription>View {user.name}&rsquo;s profile details</DialogDescription>
        </DialogHeader>
        <UserProfileView
          user={user}
          onLike={onLike}
          onSuperLike={onSuperLike}
          onMessage={onMessage}
          onViewFullPage={onViewFullPage}
          compact
        />
      </DialogContent>
    </Dialog>
  );
}
