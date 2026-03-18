/**
 * ONBOARDING GUIDE — Role-specific first-login walkthrough
 * Shows 4-5 steps to get new users productive immediately.
 * Dismissed by completing steps or clicking "Skip".
 * Persists via localStorage so it only shows once.
 */
import React, { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import { X, ChevronRight, CheckCircle, Package, Wallet, Truck, GraduationCap, Building2, Users, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  icon: any;
  title: string;
  description: string;
  link: string;
  cta: string;
}

const ROLE_STEPS: Record<string, OnboardingStep[]> = {
  DRIVER: [
    { icon: Wallet, title: 'Set Up Payments', description: 'Connect your bank account to receive earnings via direct deposit.', link: '/wallet', cta: 'Set Up Wallet' },
    { icon: Package, title: 'Browse Available Loads', description: 'Find loads that match your equipment and route preferences.', link: '/marketplace', cta: 'View Load Board' },
    { icon: Truck, title: 'Add Your Vehicle', description: 'Register your truck for dispatching and compliance tracking.', link: '/vehicle', cta: 'Add Vehicle' },
    { icon: GraduationCap, title: 'Complete Training', description: 'Finish required safety courses and certifications.', link: '/training-lms', cta: 'Start Training' },
  ],
  SHIPPER: [
    { icon: Package, title: 'Create Your First Load', description: 'Post a shipment and start receiving carrier bids.', link: '/loads/create', cta: 'Create Load' },
    { icon: Wallet, title: 'Review Platform Fees', description: 'Understand pricing — 5-8% platform fee on completed loads.', link: '/wallet', cta: 'View Fees' },
    { icon: Building2, title: 'Add Your Terminals', description: 'Register your pickup/delivery terminals for faster scheduling.', link: '/my-terminals', cta: 'Add Terminal' },
    { icon: Users, title: 'Invite Your Team', description: 'Add staff members who can manage loads and approvals.', link: '/staff', cta: 'Add Staff' },
  ],
  CATALYST: [
    { icon: Wallet, title: 'Set Up Payments', description: 'Connect Stripe to receive load payouts automatically.', link: '/wallet', cta: 'Set Up Wallet' },
    { icon: Package, title: 'Find Your First Load', description: 'Browse the marketplace and submit your first bid.', link: '/marketplace', cta: 'Find Loads' },
    { icon: Truck, title: 'Register Your Fleet', description: 'Add your vehicles and drivers to start dispatching.', link: '/carrier/fleet-hub', cta: 'Add Fleet' },
    { icon: Shield, title: 'Upload Compliance Docs', description: 'Upload insurance, authority, and safety documents.', link: '/authority', cta: 'Upload Docs' },
  ],
  BROKER: [
    { icon: Package, title: 'Post Your First Load', description: 'Create a load posting to attract carrier bids.', link: '/loads/create', cta: 'Post Load' },
    { icon: Users, title: 'Build Your Network', description: 'Connect with carriers and shippers on the platform.', link: '/catalysts', cta: 'Find Carriers' },
    { icon: FileText, title: 'Set Up Contracts', description: 'Create rate agreements with your key partners.', link: '/partners', cta: 'Manage Partners' },
    { icon: Wallet, title: 'Configure Billing', description: 'Set up your commission structure and payment preferences.', link: '/wallet', cta: 'Set Up Billing' },
  ],
};

// Default steps for roles not explicitly mapped
const DEFAULT_STEPS: OnboardingStep[] = [
  { icon: Wallet, title: 'Set Up Your Account', description: 'Configure your wallet and payment preferences.', link: '/wallet', cta: 'Get Started' },
  { icon: FileText, title: 'Upload Documents', description: 'Add required compliance and certification documents.', link: '/documents', cta: 'Upload Docs' },
  { icon: GraduationCap, title: 'Complete Training', description: 'Finish any required training or orientation.', link: '/training-lms', cta: 'Start Training' },
];

export default function OnboardingGuide({ onDismiss }: { onDismiss: () => void }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const role = user?.role || 'SHIPPER';
  const steps = ROLE_STEPS[role] || DEFAULT_STEPS;
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markComplete = (idx: number) => {
    const next = new Set(completedSteps);
    next.add(idx);
    setCompletedSteps(next);
    if (next.size === steps.length) {
      setTimeout(onDismiss, 1000);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border p-6 mb-6 relative",
      isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
    )}>
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/10">
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <h2 className={cn("text-lg font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>
        Welcome to EusoTrip!
      </h2>
      <p className={cn("text-sm mb-4", isLight ? "text-slate-500" : "text-slate-400")}>
        Complete these steps to get started:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const done = completedSteps.has(idx);
          return (
            <div key={idx} className={cn(
              "rounded-xl border p-4 transition-all",
              done ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")
                : (isLight ? "bg-white border-slate-200 hover:border-blue-300" : "bg-slate-800/60 border-slate-700 hover:border-blue-500/30")
            )}>
              <div className="flex items-center gap-2 mb-2">
                {done ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Icon className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-blue-400")} />}
                <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{step.title}</span>
              </div>
              <p className={cn("text-xs mb-3", isLight ? "text-slate-500" : "text-slate-400")}>{step.description}</p>
              <Link href={step.link}>
                <Button size="sm" variant={done ? "outline" : "default"} className="w-full text-xs" onClick={() => markComplete(idx)}>
                  {done ? 'Done' : step.cta} {!done && <ChevronRight className="w-3 h-3 ml-1" />}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
