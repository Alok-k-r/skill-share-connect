import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Heart, MessageCircle, UserPlus, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
};

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { data: notifications } = useNotifications();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-2xl shadow-lg border overflow-hidden z-50 animate-scale-in origin-top-right">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <Link to="/notifications" onClick={onClose}>
            <Button variant="ghost" size="sm">See all</Button>
          </Link>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const Icon = iconMap[notification.type] || Heart;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.actor.avatar_url || ''} alt={notification.actor.display_name} />
                      <AvatarFallback>{notification.actor.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                      notification.type === 'like' && "bg-accent",
                      notification.type === 'comment' && "bg-blue-500",
                      notification.type === 'follow' && "bg-green-500",
                      notification.type === 'message' && "bg-purple-500"
                    )}>
                      <Icon className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.actor.display_name}</span>{' '}
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
