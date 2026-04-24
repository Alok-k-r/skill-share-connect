import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowRightLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // When the user clicks the recovery link, Supabase establishes a session
    // and fires PASSWORD_RECOVERY. Try to auto-apply a stashed password.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        const stashed = sessionStorage.getItem('pending_new_password');
        if (stashed && event === 'PASSWORD_RECOVERY') {
          const { error } = await supabase.auth.updateUser({ password: stashed });
          sessionStorage.removeItem('pending_new_password');
          if (!error) {
            setDone(true);
            toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
            await supabase.auth.signOut();
          }
        }
      }
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast({ title: 'Password updated', description: 'You can now sign in.' });
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-y-auto relative">
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative min-h-screen flex items-start sm:items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md space-y-5 my-auto">
          <div className="text-center">
            <Link to="/" className="inline-flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mx-auto mb-3">
                <ArrowRightLeft className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">SkillSwap</h1>
            </Link>
            <p className="text-muted-foreground mt-1 text-sm">Reset your password</p>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            {checking ? (
              <p className="text-sm text-center text-muted-foreground py-6">Verifying your link…</p>
            ) : done ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-semibold">Password updated</h2>
                  <p className="text-sm text-muted-foreground">Sign in with your new password.</p>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full gradient-primary text-primary-foreground">
                  Go to Sign In
                </Button>
              </div>
            ) : !hasSession ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired. Please request a new one.
                </p>
                <Button onClick={() => navigate('/auth?mode=forgot')} className="w-full gradient-primary text-primary-foreground">
                  Request new link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleManualUpdate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
