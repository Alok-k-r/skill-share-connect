import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 xl:ml-72 pb-20 sm:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
