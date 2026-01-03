import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { notifications } from '@/data/mockData';
import { Heart, MessageCircle, UserPlus, Mail, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: Mail,
};

export default function Notifications() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Button variant="ghost" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2 animate-slide-up">
          {notifications.map((notification, index) => {
            const Icon = iconMap[notification.type];
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer card-hover",
                  !notification.isRead && "bg-primary/5 border border-primary/10"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.user.avatar} alt={notification.user.displayName} />
                    <AvatarFallback>{notification.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
                    notification.type === 'like' && "bg-accent",
                    notification.type === 'comment' && "bg-blue-500",
                    notification.type === 'follow' && "bg-green-500",
                    notification.type === 'message' && "bg-purple-500"
                  )}>
                    <Icon className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notification.user.displayName}</span>{' '}
                    {notification.message}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.createdAt}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 animate-pulse-soft" />
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              When someone interacts with your posts, you'll see it here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
