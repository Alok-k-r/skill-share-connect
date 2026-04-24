import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Sparkles, Users, Zap } from 'lucide-react';

export default function Welcome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md animate-pulse">
          <span className="text-primary-foreground font-bold text-xl">S</span>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-10 text-center">
          {/* Logo */}
          <div className="inline-flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl mb-5">
              <ArrowRightLeft className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold gradient-text tracking-tight">SkillSwap</h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-sm">
              Trade what you know. Learn what you love.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="bg-card/60 backdrop-blur rounded-2xl border p-4">
              <Users className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-medium leading-tight">Connect with learners</p>
            </div>
            <div className="bg-card/60 backdrop-blur rounded-2xl border p-4">
              <Sparkles className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-medium leading-tight">Share your expertise</p>
            </div>
            <div className="bg-card/60 backdrop-blur rounded-2xl border p-4">
              <Zap className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-medium leading-tight">Grow together</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link to="/auth?mode=signup" className="block">
              <Button size="lg" className="w-full gradient-primary text-primary-foreground h-12 text-base font-semibold shadow-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/auth?mode=login" className="block">
              <Button size="lg" variant="outline" className="w-full h-12 text-base font-semibold">
                Sign In
              </Button>
            </Link>
            <Link to="/home" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                Continue without an account
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
