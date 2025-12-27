'use client';

import React from 'react';
import { FileSearch, BookOpen, Pen, Sparkles, CheckCircle2 } from 'lucide-react';

export type JobStatus =
    | 'pending'
    | 'extracting'
    | 'researching'
    | 'writing'
    | 'humanizing'
    | 'formatting'
    | 'completed'
    | 'failed';

interface ProgressStepperProps {
    currentStatus: JobStatus;
    progress?: number;
}

interface Step {
    id: string;
    status: JobStatus[];
    label: string;
    icon: React.ReactNode;
}

const steps: Step[] = [
    {
        id: 'extracting',
        status: ['extracting'],
        label: 'Extract',
        icon: <FileSearch className="w-5 h-5" />,
    },
    {
        id: 'researching',
        status: ['researching'],
        label: 'Research',
        icon: <BookOpen className="w-5 h-5" />,
    },
    {
        id: 'writing',
        status: ['writing'],
        label: 'Write',
        icon: <Pen className="w-5 h-5" />,
    },
    {
        id: 'humanizing',
        status: ['humanizing', 'formatting'],
        label: 'Humanize',
        icon: <Sparkles className="w-5 h-5" />,
    },
    {
        id: 'completed',
        status: ['completed'],
        label: 'Done',
        icon: <CheckCircle2 className="w-5 h-5" />,
    },
];

const statusOrder: JobStatus[] = [
    'pending',
    'extracting',
    'researching',
    'writing',
    'humanizing',
    'formatting',
    'completed',
];

function getStepState(step: Step, currentStatus: JobStatus): 'pending' | 'active' | 'completed' {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepStatuses = step.status.map(s => statusOrder.indexOf(s));
    const maxStepIndex = Math.max(...stepStatuses);

    if (currentIndex > maxStepIndex) {
        return 'completed';
    }

    if (step.status.includes(currentStatus)) {
        return 'active';
    }

    return 'pending';
}

export function ProgressStepper({ currentStatus, progress = 0 }: ProgressStepperProps) {
    const currentStepIndex = steps.findIndex(step => step.status.includes(currentStatus));

    const calculateProgress = () => {
        if (currentStatus === 'completed') return 100;
        if (currentStatus === 'pending') return 0;
        return Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));
    };

    return (
        <div className="w-full">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[hsl(var(--color-text-secondary))]">Progress</span>
                    <span className="text-sm font-medium text-[hsl(var(--color-primary-light))]">
                        {Math.round(progress || calculateProgress())}%
                    </span>
                </div>
                <div className="h-1.5 bg-[hsl(var(--color-surface-light))] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))] rounded-full transition-all duration-500"
                        style={{ width: `${progress || calculateProgress()}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="stepper-container">
                {/* Line */}
                <div className="stepper-line">
                    <div
                        className="stepper-progress"
                        style={{
                            width: currentStatus === 'completed'
                                ? '100%'
                                : `${(currentStepIndex / (steps.length - 1)) * 100}%`
                        }}
                    />
                </div>

                {steps.map((step) => {
                    const state = getStepState(step, currentStatus);

                    return (
                        <div
                            key={step.id}
                            className={`stepper-step ${state}`}
                        >
                            <div className={`stepper-circle ${state}`}>
                                {state === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
