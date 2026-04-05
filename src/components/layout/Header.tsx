import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, MessageCircle, PlusSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { data: notifications } = useNotifications();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-xl">S</span>
              </div>
              <span className="hidden sm:block font-bold text-xl gradient-text">SkillSwap</span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search skills, people..." className="pl-10 bg-secondary border-0 focus-visible:ring-primary/20" />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <Button variant="icon" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                    <Search className="h-5 w-5" />
                  </Button>

                  <Button variant="icon" size="icon" onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex">
                    <PlusSquare className="h-5 w-5" />
                  </Button>

                  <Link to="/messages">
                    <Button variant="icon" size="icon">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </Link>

                  <div className="relative">
                    <Button variant="icon" size="icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                    <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
                  </div>

                  <Link to="/profile">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                      <AvatarFallback>{profile?.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <Button variant="icon" size="icon" onClick={signOut} title="Sign out">
                    <LogOut className="h-5 w-5" />
                  </Button>

                  <Button variant="icon" size="icon" className="sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="gradient" size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>

          {isSearchOpen && (
            <div className="md:hidden pb-4 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search skills, people..." className="pl-10 bg-secondary border-0" autoFocus />
              </div>
            </div>
          )}
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm sm:hidden animate-fade-in">
          <div className="pt-20 px-6">
            <nav className="space-y-2">
              <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</MobileNavLink>
              <MobileNavLink to="/explore" onClick={() => setIsMobileMenuOpen(false)}>Explore</MobileNavLink>
              <MobileNavLink to="/messages" onClick={() => setIsMobileMenuOpen(false)}>Messages</MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>Profile</MobileNavLink>
              <Button variant="gradient" size="lg" className="w-full mt-6" onClick={() => { setIsMobileMenuOpen(false); setIsCreateModalOpen(true); }}>
                <PlusSquare className="h-5 w-5 mr-2" />
                Create Post
              </Button>
            </nav>
          </div>
        </div>
      )}

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}

function MobileNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "block px-4 py-3 rounded-xl text-lg font-medium transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      {children}
    </Link>
  );
}
