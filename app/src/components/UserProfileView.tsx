import { Clock, ExternalLink, Heart, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isQuietHoursActive } from '@/lib/utils';

export interface ProfileUser {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
  connectionGoals?: string[];
  isOnline: boolean;
  verification?: {
    email: boolean;
    photo: boolean;
    id: boolean;
    self?: boolean;
    peer?: boolean;
    admin?: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  compatibilityScore?: number;
  sharedTraits?: string[];
  sharedInterests?: string[];
}

interface UserProfileViewProps {
  user: ProfileUser;
  onLike?: () => void;
  onSuperLike?: () => void;
  onMessage?: () => void;
  onViewFullPage?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function UserProfileView({
  user,
  onLike,
  onSuperLike,
  onMessage,
  onViewFullPage,
  showActions = true,
  compact = false,
}: UserProfileViewProps) {
  const verificationBadges = [];
  if (user.verification?.self) verificationBadges.push('Self');
  if (user.verification?.peer) verificationBadges.push('Peer');
  if (user.verification?.admin) verificationBadges.push('Admin');
  if (user.verification?.photo) verificationBadges.push('Photo');
  if (user.verification?.id) verificationBadges.push('ID');

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className={compact ? 'w-16 h-16' : 'w-20 h-20'}>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className={compact ? 'text-2xl' : 'text-3xl'}>
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={compact ? 'text-lg font-bold' : 'text-xl font-bold'}>{user.name}</h2>
          {user.compatibilityScore != null && (
            <p className="text-sm text-primary font-medium">{user.compatibilityScore}% match</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {isQuietHoursActive(user.quietHours) && (
              <Badge variant="outline" className="text-[10px]">
                <Clock className="w-3 h-3 mr-1" />
                Quiet hours
              </Badge>
            )}
            {verificationBadges.map((label) => (
              <Badge key={label} variant="secondary" className="text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About</p>
          <p className="text-sm text-neutral-600 leading-relaxed">{user.bio}</p>
        </div>
      )}

      {/* Shared / Traits */}
      {(user.sharedInterests?.length || 0) > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shared Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {user.sharedInterests!.map((interest) => (
              <Badge key={interest} variant="secondary">{interest}</Badge>
            ))}
          </div>
        </div>
      )}

      {(user.sharedTraits?.length || 0) > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shared Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {user.sharedTraits!.map((trait) => (
              <Badge key={trait} variant="outline">{trait}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* All traits */}
      {user.neurodivergentTraits.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Neurodivergent Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {user.neurodivergentTraits.map((trait) => (
              <Badge key={trait} className="bg-primary/10 text-primary border-0">{trait}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* All interests */}
      {user.specialInterests.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Special Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {user.specialInterests.map((interest) => (
              <Badge key={interest} variant="secondary">{interest}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Connection goals */}
      {(user.connectionGoals?.length || 0) > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Connection Goals</p>
          <div className="flex flex-wrap gap-1.5">
            {user.connectionGoals!.map((goal) => (
              <Badge key={goal} variant="outline">{goal}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          {onLike && (
            <Button onClick={onLike} className="flex-1 bg-primary hover:bg-primary-600">
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
          )}
          {onSuperLike && (
            <Button
              variant="outline"
              className="border-amber-300 text-amber-600 hover:bg-amber-50"
              onClick={onSuperLike}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          {onMessage && (
            <Button variant="outline" onClick={onMessage}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
          )}
          {onViewFullPage && (
            <Button variant="ghost" size="sm" onClick={onViewFullPage}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Full profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
