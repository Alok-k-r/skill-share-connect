import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRightLeft, ArrowLeft, MailCheck } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState<null | 'verify' | 'reset'>(null);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup') setMode('signup');
    else if (m === 'forgot') setMode('forgot');
    else setMode('login');
  }, [searchParams]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Welcome back', description: 'Signed in successfully.' });
    } catch (error: any) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast({ title: 'Missing fields', description: 'Please complete every field.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: 'Please re-enter your password.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: { username: username.trim(), display_name: displayName.trim() },
        },
      });
      if (error) throw error;
      setEmailSent('verify');
      toast({ title: 'Verification email sent', description: `Check ${email} to confirm your account.` });
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: 'Please re-enter your new password.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Stash the new password locally; ResetPassword page will apply it after the user verifies.
      sessionStorage.setItem('pending_new_password', password);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent('reset');
      toast({ title: 'Reset link sent', description: `Check ${email} to confirm the password change.` });
    } catch (error: any) {
      toast({ title: 'Could not send reset', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle =
    emailSent === 'verify'
      ? 'Verify your email to finish signing up'
      : emailSent === 'reset'
      ? 'Confirm via email to apply your new password'
      : mode === 'login'
      ? 'Sign in to your account'
      : mode === 'signup'
      ? 'Create your account'
      : 'Reset your password';

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
            <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            {emailSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MailCheck className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-semibold">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a {emailSent === 'verify' ? 'verification' : 'confirmation'} link to{' '}
                    <span className="font-medium text-foreground">{email}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEmailSent(null); setMode('login'); }}
                  className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </div>
            ) : mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
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
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? 'Please wait...' : 'Sign In'}
                </Button>
              </form>
            ) : mode === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create Account'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll email you a verification link to activate your account.
                </p>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
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
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? 'Sending link...' : 'Send Verification Link'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll email you a link. Once verified, your password will be updated.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </form>
            )}

            {!emailSent && mode !== 'forgot' && (
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            )}
          </div>

          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            ← Back to welcome
          </Link>
        </div>
      </div>
    </div>
  );
}
