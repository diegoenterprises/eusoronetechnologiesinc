/**
 * MULTI-STEP REGISTRATION WIZARD
 * Reusable wizard component for all role registration flows
 */

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Loader2, ChevronLeft, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
  validate?: () => Promise<boolean> | boolean;
}

interface RegistrationWizardProps {
  steps: WizardStep[];
  onComplete: () => Promise<void>;
  title: string;
  subtitle: string;
  roleIcon: React.ReactNode;
  roleColor: string;
}

export function RegistrationWizard({
  steps,
  onComplete,
  title,
  subtitle,
  roleIcon,
  roleColor,
}: RegistrationWizardProps) {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    const step = steps[currentStep];
    
    if (step.validate) {
      setIsValidating(true);
      try {
        const isValid = await step.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error("Validation error:", error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (isLastStep) {
      setIsSubmitting(true);
      try {
        await onComplete();
      } catch (error) {
        console.error("Submit error:", error);
      }
      setIsSubmitting(false);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (completedSteps.has(index) || index === currentStep) {
      setCurrentStep(index);
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${isLight ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-2.5 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-110 ${isLight ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-white/[0.06]'}`}
        title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      >
        {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Back to role selection + Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate("/register")}
            className={`flex items-center gap-1 text-sm transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to role selection
          </button>
        </div>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
            isLight
              ? 'bg-white shadow-lg shadow-slate-200 border border-slate-100'
              : 'bg-gradient-to-br from-[#1473FF] to-[#BE01FF]'
          }`}>
            {isLight ? (
              <>
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="wizard-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1473FF" />
                      <stop offset="100%" stopColor="#BE01FF" />
                    </linearGradient>
                  </defs>
                </svg>
                {React.cloneElement(roleIcon as React.ReactElement<any>, {
                  className: 'w-8 h-8',
                  style: { stroke: 'url(#wizard-icon-grad)' },
                })}
              </>
            ) : roleIcon}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h1>
          <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>{subtitle}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className={`h-2 ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`} />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {steps.map((step, index) => {
            const isComplete = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isClickable = isComplete || isCurrent;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  isCurrent && (isLight ? "bg-blue-50 text-blue-600 border border-blue-300" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"),
                  isComplete && !isCurrent && (isLight ? "bg-green-50 text-green-600 border border-green-300" : "bg-green-500/20 text-green-400 border border-green-500/30"),
                  !isCurrent && !isComplete && (isLight ? "bg-slate-100 text-slate-400 border border-slate-200" : "bg-white/[0.02] text-slate-500 border border-slate-700"),
                  isClickable && "cursor-pointer hover:opacity-80"
                )}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content with tile animation */}
        <div
          key={`step-${currentStep}`}
          className="animate-tile-in"
          style={{
            animation: "tileIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <Card className={`mb-6 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-slate-700'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {steps[currentStep].icon}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{steps[currentStep].component}</CardContent>
          </Card>
        </div>
        <style>{`
          @keyframes tileIn {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.97);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep || isValidating || isSubmitting}
            className={isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-slate-600 text-slate-300 hover:bg-white/[0.06]'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isValidating || isSubmitting}
            className={cn(
              "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD]",
              isLastStep && "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            )}
          >
            {isValidating || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSubmitting ? "Submitting..." : "Validating..."}
              </>
            ) : isLastStep ? (
              <>
                Complete Registration
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RegistrationWizard;
