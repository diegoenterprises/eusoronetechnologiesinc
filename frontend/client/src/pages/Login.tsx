import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, ShieldCheck, CheckCircle, CreditCard } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1473FF]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BE01FF]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#1473FF]/10 rounded-full blur-3xl" />
      </div>

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
          <p className="text-slate-400 mt-2">Hazardous Materials Transportation Platform</p>
        </div>

        <Card className="bg-slate-800/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400 h-12"
                    disabled={loginMutation.isPending}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400 h-12"
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
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <a href="/register" className="text-purple-400 hover:text-purple-300 underline">
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
          <p className="text-center text-[10px] sm:text-xs text-slate-500">
            © 2026 EusoTrip - Eusorone Technologies, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
