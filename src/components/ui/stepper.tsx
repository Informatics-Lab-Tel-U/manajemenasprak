'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepDefinition = {
  id: string;
  title?: string;
  description?: string;
  icon?: React.ReactElement;
};

type StepStatus = 'completed' | 'active' | 'inactive' | 'blocked';

interface StepperContextValue {
  steps: StepDefinition[];
  activeStep: string;
  completedSteps: string[];
  goTo: (id: string) => void;
  next: () => void;
  prev: () => void;
  isFirst: boolean;
  isLast: boolean;
  markCompleted: (id: string) => void;
  isStepCompleted: (id: string) => boolean;
  canNavigateTo: (id: string) => boolean;
}

const StepperContext = createContext<StepperContextValue | undefined>(undefined);

export function useStepper() {
  const context = useContext(StepperContext);
  if (!context) throw new Error('useStepper must be used within <Stepper>');
  return { stepper: context, steps: context.steps };
}

export function Stepper({
  steps,
  defaultValue,
  activeStep: controlledActiveStep,
  completedSteps: externalCompletedSteps,
  onStepChange,
  className,
  children,
}: {
  steps: StepDefinition[];
  defaultValue?: string;
  activeStep?: string;
  completedSteps?: string[];
  onStepChange?: (stepId: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalActiveStep, setInternalActiveStep] = useState(defaultValue || steps[0]?.id);
  const [internalCompletedSteps, setInternalCompletedSteps] = useState<string[]>([]);
  
  const activeStep = controlledActiveStep !== undefined ? controlledActiveStep : internalActiveStep;

  const setActiveStep = (id: string) => {
    if (controlledActiveStep === undefined) {
      setInternalActiveStep(id);
    }
    onStepChange?.(id);
  };
  
  // Use external completed steps if provided, otherwise use internal state
  const completedSteps = externalCompletedSteps ?? internalCompletedSteps;

  const activeIndex = steps.findIndex((s) => s.id === activeStep);
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === steps.length - 1;

  const goTo = (id: string) => {
    const targetIndex = steps.findIndex((s) => s.id === id);
    const currentStepIndex = steps.findIndex((s) => s.id === activeStep);
    
    // Can navigate to completed steps or next step
    if (completedSteps.includes(id) || targetIndex <= currentStepIndex + 1) {
      setActiveStep(id);
    }
  };
  
  const next = () => {
    if (!isLast) setActiveStep(steps[activeIndex + 1].id);
  };
  
  const prev = () => {
    if (!isFirst) setActiveStep(steps[activeIndex - 1].id);
  };

  const markCompleted = (id: string) => {
    if (!completedSteps.includes(id)) {
      const newCompleted = [...completedSteps, id];
      setInternalCompletedSteps(newCompleted);
    }
  };

  const isStepCompleted = (id: string) => completedSteps.includes(id);

  const canNavigateTo = (id: string) => {
    const targetIndex = steps.findIndex((s) => s.id === id);
    // Can always go to first step
    if (targetIndex === 0) return true;
    // Can go to step if all previous steps are completed
    for (let i = 0; i < targetIndex; i++) {
      if (!completedSteps.includes(steps[i].id)) return false;
    }
    return true;
  };

  const contextValue = useMemo(
    () => ({ 
      steps, 
      activeStep, 
      completedSteps, 
      goTo, 
      next, 
      prev, 
      isFirst, 
      isLast,
      markCompleted,
      isStepCompleted,
      canNavigateTo,
    }),
    [steps, activeStep, completedSteps]
  );

  return (
    <StepperContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>{children}</div>
    </StepperContext.Provider>
  );
}

// --------------------------------------------------------------------------------
// ITEM CONTEXT
// --------------------------------------------------------------------------------

const StepItemContext = createContext<{ 
  step: StepDefinition; 
  status: StepStatus; 
  index: number;
  isCompleted: boolean;
} | undefined>(undefined);

export function useStepItem() {
  const context = useContext(StepItemContext);
  if (!context) throw new Error('useStepItem must be used within <StepperItem>');
  return context;
}

export function StepperItem({
  stepId,
  className,
  children,
}: {
  stepId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { steps, activeStep, completedSteps } = useContext(StepperContext)!;
  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const currentIndex = steps.findIndex((s) => s.id === activeStep);
  const step = steps[stepIndex];

  const isCompleted = completedSteps.includes(stepId);
  
  let status: StepStatus = 'inactive';
  if (isCompleted) status = 'completed';
  else if (stepIndex === currentIndex) status = 'active';
  else if (stepIndex > currentIndex) {
    // Check if blocked (previous steps not completed)
    const isBlocked = !completedSteps.includes(steps[currentIndex].id);
    status = isBlocked ? 'blocked' : 'inactive';
  }

  return (
    <StepItemContext.Provider value={{ step, status, index: stepIndex, isCompleted }}>
      <div 
        className={cn('group/step flex items-center justify-center not-last:flex-1', className)} 
        data-state={status}
        data-completed={isCompleted}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

export function StepperTrigger({ 
  className, 
  children,
  disabled,
}: { 
  className?: string; 
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { step, status, isCompleted } = useStepItem();
  const { goTo, canNavigateTo } = useContext(StepperContext)!;

  const isDisabled = disabled || status === 'blocked';
  const canClick = isCompleted || canNavigateTo(step.id);

  return (
    <button
      type="button"
      onClick={() => canClick && goTo(step.id)}
      disabled={isDisabled || !canClick}
      className={cn(
        'inline-flex cursor-pointer items-center outline-none gap-2.5 rounded-full transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      data-state={status}
      data-clickable={canClick}
    >
      {children}
    </button>
  );
}

export function StepperIndicator({ 
  className, 
  children,
  showCheckmark = true,
}: { 
  className?: string; 
  children?: React.ReactNode;
  showCheckmark?: boolean;
}) {
  const { status: state, step, index, isCompleted } = useStepItem();
  
  return (
    <div
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-all duration-300',
        'border-2',
        // Inactive state
        'data-[state=inactive]:border-muted data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground',
        // Active state
        'data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        'data-[state=active]:ring-4 data-[state=active]:ring-primary/20',
        // Completed state
        'data-[state=completed]:border-primary data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground',
        // Blocked state
        'data-[state=blocked]:border-muted data-[state=blocked]:bg-muted data-[state=blocked]:text-muted-foreground data-[state=blocked]:opacity-50',
        className
      )}
      data-state={state}
      data-completed={isCompleted}
    >
      {isCompleted && showCheckmark ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : step.icon ? (
        <span className="[&>svg]:size-4">{step.icon}</span>
      ) : (
        children || index + 1
      )}
    </div>
  );
}

export function StepperTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { status: state, isCompleted } = useStepItem();
  return (
    <h3 
      className={cn(
        'text-sm font-medium transition-colors',
        'data-[state=active]:text-foreground',
        'data-[state=completed]:text-foreground',
        'data-[state=inactive]:text-foreground',
        'data-[state=blocked]:text-muted-foreground',
        className
      )} 
      data-state={state}
      data-completed={isCompleted}
    >
      {children}
    </h3>
  );
}

export function StepperDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  const { status: state } = useStepItem();
  return (
    <div 
      className={cn(
        'text-muted-foreground text-xs font-medium transition-colors',
        className
      )} 
      data-state={state}
    >
      {children}
    </div>
  );
}

export function StepperSeparator({ className }: { className?: string }) {
  const { status: state, isCompleted } = useStepItem();
  
  return (
    <div
      className={cn(
        'h-0.5 flex-1 mx-2 rounded-sm transition-all duration-500',
        'bg-muted',
        'group-data-[state=completed]/step:bg-primary',
        'group-data-[state=active]/step:bg-primary/50',
        isCompleted && 'bg-primary',
        className
      )}
      data-state={state}
    />
  );
}

export function StepperNav({ className, children }: { className?: string; children: React.ReactNode }) {
  return <nav className={cn('flex w-full flex-row', className)}>{children}</nav>;
}

export function StepperContent({ 
  value, 
  className, 
  children 
}: { 
  value: string; 
  className?: string; 
  children: React.ReactNode 
}) {
  const { activeStep } = useContext(StepperContext)!;
  if (activeStep !== value) return null;
  return (
    <div 
      className={cn('w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300', className)}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------------
// PROGRESS BAR COMPONENT
// --------------------------------------------------------------------------------

export function StepperProgress({ className }: { className?: string }) {
  const { steps, completedSteps } = useContext(StepperContext)!;
  
  // Exclude 'selesai' from progress calculation
  const totalSteps = steps.filter(s => s.id !== 'selesai').length;
  const completedCount = completedSteps.filter(id => id !== 'selesai').length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span className="text-sm font-bold text-primary">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
