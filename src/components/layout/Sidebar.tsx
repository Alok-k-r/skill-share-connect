import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, Bell, User, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CreatePostModal } from '@/components/posts/CreatePostModal';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { profile } = useAuth();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 xl:w-72 border-r bg-card p-4">
        <Link to="/home" className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-bold text-2xl">S</span>
          </div>
          <span className="font-bold text-2xl gradient-text">SkillSwap</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            const showBadge = item.label === 'Notifications' && unreadCount > 0;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}

          <Button variant="gradient" size="lg" className="w-full mt-4" onClick={() => setIsCreateModalOpen(true)}>
            <PlusSquare className="h-5 w-5" />
            <span>Create Post</span>
          </Button>
        </nav>

        {profile && (
          <div className="border-t pt-4 mt-4">
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile.display_name}</p>
                <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
