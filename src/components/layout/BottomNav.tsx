import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CreatePostModal } from '@/components/posts/CreatePostModal';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '#create', icon: PlusSquare, label: 'Create', isAction: true },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden glass border-t">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex flex-col items-center justify-center p-2"
                >
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center p-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
