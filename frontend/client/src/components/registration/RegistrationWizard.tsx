/**
 * MULTI-STEP REGISTRATION WIZARD
 * Reusable wizard component for all role registration flows
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center mx-auto mb-4`}>
            {roleIcon}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400">{subtitle}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
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
                  isCurrent && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                  isComplete && !isCurrent && "bg-green-500/20 text-green-400 border border-green-500/30",
                  !isCurrent && !isComplete && "bg-slate-800/50 text-slate-500 border border-slate-700",
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

        {/* Step Content */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>{steps[currentStep].component}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep || isValidating || isSubmitting}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
