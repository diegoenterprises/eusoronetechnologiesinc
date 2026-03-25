import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, ShieldCheck, CheckCircle, CreditCard, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import useLocale from '@/hooks/useLocale';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms'>('totp');
  const [mfaMessage, setMfaMessage] = useState('');
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();

  const loginMutation = (trpc as any).auth.login.useMutation({
    onSuccess: (data: any) => {
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setMfaMethod(data.method || 'totp');
        setMfaMessage(data.message || 'Enter your verification code.');
        setError('');
        return;
      }
      toast.success(`Welcome back, ${data.user.name}!`);
      setTimeout(() => { window.location.href = '/'; }, 300);
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid credentials');
      if (!requiresTwoFactor) {
        toast.error('Login failed. Please check your credentials.');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    if (requiresTwoFactor && !twoFactorCode) {
      setError('Please enter the verification code');
      return;
    }
    loginMutation.mutate({
      email,
      password,
      ...(requiresTwoFactor && twoFactorCode ? { twoFactorCode } : {}),
    });
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setTwoFactorCode('');
    setMfaMessage('');
    setError('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
    }`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${theme === 'dark' ? 'bg-[#1473FF]/15' : 'bg-[#1473FF]/10'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${theme === 'dark' ? 'bg-[#BE01FF]/15' : 'bg-[#BE01FF]/10'}`} />
        <div className={`absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl ${theme === 'dark' ? 'bg-[#1473FF]/10' : 'bg-[#1473FF]/5'}`} />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 p-2.5 rounded-full backdrop-blur transition-colors ${
          theme === 'dark'
            ? 'bg-white/10 border border-white/20 hover:bg-white/20'
            : 'bg-slate-900/10 border border-slate-300 hover:bg-slate-900/20'
        }`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-600" />
        )}
      </button>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <img
            src="/eusotrip-logo.png"
            alt="EusoTrip Logo"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            EusoTrip
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Freight & Energy Logistics Platform</p>
        </div>

        <Card className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-800/10 border-white/20' : 'bg-white/80 border-slate-200 shadow-xl'}`}>
          <CardHeader className="text-center">
            <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('auth.welcomeBack', 'Welcome Back')}</CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
              {t('auth.signInSubtitle', 'Sign in to access your dashboard')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className={`flex items-center gap-2 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              {!requiresTwoFactor ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                    <Input
                      type="email"
                      placeholder={t('auth.email', 'Email address')}
                      aria-label={t('auth.email', 'Email address')}
                      autoComplete="email"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      className={`pl-10 h-12 ${theme === 'dark' ? 'bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                      disabled={loginMutation.isPending}
                    />
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                    <Input
                      type="password"
                      placeholder={t('auth.password', 'Password')}
                      aria-label={t('auth.password', 'Password')}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      className={`pl-10 h-12 ${theme === 'dark' ? 'bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                      disabled={loginMutation.isPending}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                    <Shield className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      {mfaMessage || (mfaMethod === 'totp'
                        ? 'Enter the 6-digit code from your authenticator app.'
                        : 'A verification code was sent to your phone and email.')}
                    </p>
                  </div>
                  <div className="relative">
                    <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9A-Za-z\-]*"
                      maxLength={10}
                      placeholder={mfaMethod === 'totp' ? '6-digit code or backup code' : 'Verification code'}
                      aria-label="Verification code"
                      autoComplete="one-time-code"
                      value={twoFactorCode}
                      onChange={(e: any) => setTwoFactorCode(e.target.value)}
                      className={`pl-10 h-12 text-center text-lg tracking-widest font-mono ${theme === 'dark' ? 'bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                      disabled={loginMutation.isPending}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className={`text-sm ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
                  >
                    &larr; Back to login
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-12 text-lg"
              >
                {loginMutation.isPending
                  ? (requiresTwoFactor ? t('auth.verifying', 'Verifying...') : t('auth.signingIn', 'Signing in...'))
                  : (requiresTwoFactor ? t('auth.verifyCode', 'Verify Code') : t('auth.login', 'Sign In'))}
                {!requiresTwoFactor && <ArrowRight className="w-5 h-5 ml-2" />}
                {requiresTwoFactor && <ShieldCheck className="w-5 h-5 ml-2" />}
              </Button>
            </form>

            {!requiresTwoFactor && (
              <div className="text-center space-y-2">
                <a href="/forgot-password" className={`text-sm ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition-colors`}>
                  {t('auth.forgotPassword', 'Forgot your password?')}
                </a>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('auth.noAccount', "Don't have an account?")}{' '}
                  <a href="/register" className={`underline ${theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'}`}>
                    {t('auth.register', 'Register here')}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-xs sm:text-xs font-medium text-green-400">TLS 1.3</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs sm:text-xs font-medium text-blue-400">AES-256</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span className="text-xs sm:text-xs font-medium text-purple-400">RBAC</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <CheckCircle className="w-3 h-3 text-cyan-400" />
              <span className="text-xs sm:text-xs font-medium text-cyan-400">SOC 2</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <CreditCard className="w-3 h-3 text-amber-400" />
              <span className="text-xs sm:text-xs font-medium text-amber-400">PCI-DSS</span>
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <LanguageSwitcher />
          </div>
          <p className={`text-center text-xs sm:text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            © 2026 EusoTrip - Eusorone Technologies, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
