import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Lock, Mail, ArrowRight, Package, Users, Briefcase, Car, Zap, Shield, Building, FileCheck, AlertTriangle, Settings } from 'lucide-react';

const ALL_ROLES = [
  { name: 'Shipper', role: 'SHIPPER', icon: Package, color: 'from-blue-500 to-blue-600' },
  { name: 'Carrier', role: 'CARRIER', icon: Truck, color: 'from-green-500 to-green-600' },
  { name: 'Broker', role: 'BROKER', icon: Briefcase, color: 'from-purple-500 to-purple-600' },
  { name: 'Driver', role: 'DRIVER', icon: Car, color: 'from-orange-500 to-orange-600' },
  { name: 'Catalyst', role: 'CATALYST', icon: Zap, color: 'from-yellow-500 to-yellow-600' },
  { name: 'Escort', role: 'ESCORT', icon: Shield, color: 'from-red-500 to-red-600' },
  { name: 'Terminal Mgr', role: 'TERMINAL_MANAGER', icon: Building, color: 'from-cyan-500 to-cyan-600' },
  { name: 'Compliance', role: 'COMPLIANCE_OFFICER', icon: FileCheck, color: 'from-indigo-500 to-indigo-600' },
  { name: 'Safety Mgr', role: 'SAFETY_MANAGER', icon: AlertTriangle, color: 'from-pink-500 to-pink-600' },
  { name: 'Admin', role: 'ADMIN', icon: Settings, color: 'from-gray-500 to-gray-600' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async (role: string) => {
    setIsLoading(true);
    const testUser = {
      id: 1,
      email: `test@${role.toLowerCase().replace('_', '')}.com`,
      name: `Test ${role.replace('_', ' ')}`,
      role: role,
      companyId: 1,
    };
    localStorage.setItem('eusotrip-user-info', JSON.stringify(testUser));
    
    setTimeout(() => {
      setLocation('/');
      window.location.reload();
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await handleTestLogin('SHIPPER');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4 shadow-2xl shadow-purple-500/30">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            EusoTrip
          </h1>
          <p className="text-gray-400 mt-2">Hazardous Materials Transportation Platform</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 h-12 text-lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">Quick Access - Select Your Role</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {ALL_ROLES.map((r) => (
                <Button
                  key={r.role}
                  variant="outline"
                  onClick={() => handleTestLogin(r.role)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all hover:scale-105"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${r.color}`}>
                    <r.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs">{r.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 EusoTrip - Eusoro Technologies Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
