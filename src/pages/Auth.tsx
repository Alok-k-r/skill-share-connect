import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRightLeft, ArrowLeft } from 'lucide-react';

type Step = 'form' | 'otp';

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast({ title: 'Missing fields', description: 'Please complete every field.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { username: username.trim(), display_name: displayName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({ title: 'Code sent', description: `We emailed a 6-digit code to ${email}.` });
      setStep('otp');
    } catch (error: any) {
      toast({ title: 'Could not send code', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      toast({ title: 'Account verified', description: 'You are all set.' });
    } catch (error: any) {
      toast({ title: 'Invalid code', description: error.message, variant: 'destructive' });
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
            <p className="text-muted-foreground mt-1 text-sm">
              {step === 'otp'
                ? 'Enter the 6-digit code we just sent you'
                : isLogin
                ? 'Sign in to your account'
                : 'Create your account'}
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            {step === 'otp' ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtp(''); }}
                  className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
                </button>
              </form>
            ) : isLogin ? (
              <form onSubmit={handleLogin} className="space-y-3">
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
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-3">
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
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? 'Sending code...' : 'Send Verification Code'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll email you a 6-digit code to verify your account.
                </p>
              </form>
            )}

            {step === 'form' && (
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
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
