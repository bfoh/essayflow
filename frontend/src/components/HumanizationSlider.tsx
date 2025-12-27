'use client';

import React from 'react';

interface HumanizationSliderProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export function HumanizationSlider({ value, onChange, disabled = false }: HumanizationSliderProps) {
    const getIntensityLabel = (val: number): string => {
        if (val <= 0.25) return 'Low';
        if (val <= 0.5) return 'Medium';
        if (val <= 0.75) return 'High';
        return 'Aggressive';
    };

    const getIntensityDescription = (val: number): string => {
        if (val <= 0.25) return 'Minimal changes, close to original AI output';
        if (val <= 0.5) return 'Balanced approach with natural variations';
        if (val <= 0.75) return 'Significant rewrites with varied style';
        return 'Maximum humanization with extensive rewrites';
    };

    return (
        <div className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[hsl(var(--color-text-secondary))]">Intensity</span>
                <span className="text-sm font-medium px-2.5 py-0.5 rounded-md bg-[hsla(var(--color-primary),0.1)] text-[hsl(var(--color-primary-light))]">
                    {getIntensityLabel(value)}
                </span>
            </div>

            <div className="slider-wrapper">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    style={{
                        background: `linear-gradient(to right, hsl(var(--color-primary)) 0%, hsl(var(--color-primary)) ${value * 100}%, hsl(var(--color-surface-light)) ${value * 100}%, hsl(var(--color-surface-light)) 100%)`,
                    }}
                />
            </div>

            <div className="flex justify-between mt-2 mb-3">
                <span className="text-xs text-[hsl(var(--color-text-muted))]">Low</span>
                <span className="text-xs text-[hsl(var(--color-text-muted))]">Aggressive</span>
            </div>

            <p className="text-xs text-[hsl(var(--color-text-muted))] leading-relaxed">
                {getIntensityDescription(value)}
            </p>
        </div>
    );
}
