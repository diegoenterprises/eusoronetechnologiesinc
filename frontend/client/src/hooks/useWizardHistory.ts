/**
 * useWizardHistory — Syncs wizard step state with browser history.
 *
 * When user presses browser back button, the wizard goes to the previous step
 * instead of leaving the page entirely (which would lose all form inputs).
 *
 * Also adds a beforeunload guard so closing the tab warns about unsaved data.
 *
 * Usage:
 *   const [step, setStep] = useWizardHistory<MyStep>("mode", "/agreements");
 *   // setStep("financial") — pushes to history
 *   // Browser back → goes to previous step
 *   // If on first step and user presses back → navigates to parentPath
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

export function useWizardHistory<T extends string>(
  initialStep: T,
  parentPath: string,
  hasUnsavedData = true
): [T, (next: T) => void] {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<T>(initialStep);
  const stepHistoryRef = useRef<T[]>([initialStep]);
  const isPopRef = useRef(false);

  // Warn on tab close / refresh when there's unsaved data
  useEffect(() => {
    if (!hasUnsavedData) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedData]);

  // Push initial history state on mount
  useEffect(() => {
    window.history.replaceState({ wizardStep: initialStep, idx: 0 }, "");
  }, [initialStep]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.wizardStep) {
        isPopRef.current = true;
        const step = e.state.wizardStep as T;
        stepHistoryRef.current = stepHistoryRef.current.slice(0, (e.state.idx ?? 0) + 1);
        setCurrentStep(step);
      } else {
        // No wizard state — went past first step, go to parent
        navigate(parentPath);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [parentPath, navigate]);

  const setStep = useCallback(
    (next: T) => {
      if (isPopRef.current) {
        isPopRef.current = false;
        return;
      }
      const history = stepHistoryRef.current;
      const idx = history.length;
      stepHistoryRef.current = [...history, next];
      setCurrentStep(next);
      window.history.pushState({ wizardStep: next, idx }, "");
    },
    []
  );

  return [currentStep, setStep];
}
