import { RFQStatus } from "@/data/mockRFQData";
import { Check, Circle, Clock } from "lucide-react";

interface WorkflowTimelineProps {
  currentStatus: RFQStatus;
}

const workflowSteps = [
  { status: 'submitted', label: 'Submitted', shortLabel: 'Submit' },
  { status: 'model_uploaded', label: 'Model Uploaded', shortLabel: 'Upload' },
  { status: 'design_confirmed', label: 'Design Confirmed', shortLabel: 'Confirm' },
  { status: 'printing', label: '3D Printing', shortLabel: 'Print' },
  { status: 'sample_review', label: 'Sample Review', shortLabel: 'Review' },
  { status: 'production', label: 'Production', shortLabel: 'Produce' },
];

const statusOrder: RFQStatus[] = [
  'submitted',
  'model_uploaded', 
  'design_confirmed',
  'ready_for_printing',
  'printing',
  'shipped',
  'sample_review',
  'production',
  'closed'
];

const WorkflowTimeline = ({ currentStatus }: WorkflowTimelineProps) => {
  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStepState = (stepStatus: string): 'completed' | 'current' | 'upcoming' => {
    const stepIndex = statusOrder.indexOf(stepStatus as RFQStatus);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ 
            width: `${Math.min(100, (currentIndex / (workflowSteps.length - 1)) * 100)}%` 
          }}
        />

        {workflowSteps.map((step, index) => {
          const state = getStepState(step.status);
          
          return (
            <div 
              key={step.status}
              className="relative flex flex-col items-center z-10"
            >
              {/* Step Circle */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state === 'completed' 
                    ? 'bg-primary text-primary-foreground'
                    : state === 'current'
                    ? 'bg-primary/20 border-2 border-primary text-primary'
                    : 'bg-muted border-2 border-border text-muted-foreground'
                }`}
              >
                {state === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : state === 'current' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`mt-2 text-xs md:text-sm text-center transition-colors duration-300 ${
                  state === 'completed' || state === 'current'
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <span className="hidden md:inline">{step.label}</span>
                <span className="md:hidden">{step.shortLabel}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowTimeline;
