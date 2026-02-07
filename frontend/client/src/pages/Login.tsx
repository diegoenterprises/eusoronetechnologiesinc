import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, ShieldCheck, CheckCircle, CreditCard, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const loginMutation = (trpc as any).auth.login.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Welcome back, ${data.user.name}!`);
      setLocation('/');
      window.location.reload();
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid credentials');
      toast.error('Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    loginMutation.mutate({ email, password });
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
            <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome Back</CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                  <Input
                    type="email"
                    placeholder="Email address"
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
                    placeholder="Password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    className={`pl-10 h-12 ${theme === 'dark' ? 'bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-12 text-lg"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Don't have an account?{' '}
                <a href="/register" className={`underline ${theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'}`}>
                  Register here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-[10px] sm:text-xs font-medium text-green-400">TLS 1.3</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] sm:text-xs font-medium text-blue-400">AES-256</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] sm:text-xs font-medium text-purple-400">RBAC</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <CheckCircle className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] sm:text-xs font-medium text-cyan-400">SOC 2</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <CreditCard className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-medium text-amber-400">PCI-DSS</span>
            </div>
          </div>
          <p className={`text-center text-[10px] sm:text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            © 2026 EusoTrip - Eusorone Technologies, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
