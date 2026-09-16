import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function WizardProgress({ currentStep }: { currentStep: number }): JSX.Element {
  return (
    <ol className="flex w-full items-center">
      {WIZARD_STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-caption font-semibold transition-colors',
                  isComplete && 'bg-brand text-white',
                  isCurrent && 'border-2 border-brand text-brand',
                  !isComplete && !isCurrent && 'border border-border text-muted',
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-caption',
                  isCurrent ? 'font-medium text-ink' : 'text-muted',
                )}
              >
                {step}
              </span>
            </div>
            {stepNum !== WIZARD_STEPS.length && (
              <div className={cn('mx-2 mb-5 h-px flex-1 transition-colors', isComplete ? 'bg-brand' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
