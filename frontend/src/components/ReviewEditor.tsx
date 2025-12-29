'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Download, Sparkles, Send } from 'lucide-react';

interface EssaySection {
    title: string;
    content: string;
}

interface EssayData {
    title: string;
    introduction: string;
    body_sections: EssaySection[];
    conclusion: string;
    references: string[];
    ai_feedback?: string; // New field
}

interface ReviewEditorProps {
    jobId: string;
    status: string;
    onFinalize: () => void;
    onRefine: () => void;
}

export function ReviewEditor({ jobId, status, onFinalize, onRefine }: ReviewEditorProps) {
    const [essay, setEssay] = useState<EssayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [instructions, setInstructions] = useState('');
    const [processingInstructions, setProcessingInstructions] = useState(''); // New state
    const [isRefining, setIsRefining] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Fetch Essay Content
    const fetchEssay = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/job/${jobId}/review`);
            if (res.ok) {
                const data = await res.json();

                // Fallback: If AI didn't provide feedback but we just refined, show a generic success message
                if (!data.ai_feedback && processingInstructions) {
                    data.ai_feedback = "Request processed successfully. Content has been updated.";
                }

                setEssay(data);
                // Stop loading states
                setIsRefining(false);
                setLoading(false);
                setProcessingInstructions(''); // Clear processing text
            } else {
                console.error("Failed response:", res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch essay:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch & Refetch on Status Change
    useEffect(() => {
        // If we are back to 'waiting_for_review', it means we should have the latest data
        if (status === 'waiting_for_review') {
            fetchEssay();
        }
    }, [jobId, status]);

    const handleRefine = async () => {
        if (!instructions.trim()) return;
        setIsRefining(true);
        setProcessingInstructions(instructions); // Save for display
        // Explicitly notify parent we are starting
        onRefine();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/job/${jobId}/refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instructions })
            });

            if (res.ok) {
                setInstructions(''); // Clear input on success
            } else {
                throw new Error('Refinement request failed');
            }
        } catch (error) {
            console.error("Refinement failed:", error);
            setIsRefining(false);
        }
    };

    const handleFinalize = async () => {
        setIsFinalizing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/job/${jobId}/finalize`, {
                method: 'POST'
            });

            if (res.ok) {
                onFinalize(); // Notify parent to switch status -> formatting
            }
        } catch (error) {
            console.error("Finalization failed:", error);
            setIsFinalizing(false);
        }
    };

    if (loading && !essay) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--color-primary))]" />
                <p className="text-[hsl(var(--color-text-secondary))]">Loading essay preview...</p>
            </div>
        );
    }

    if (!essay) {
        return <div className="text-red-500 text-center p-8">Failed to load essay. Please try refreshing.</div>;
    }

    // Check if actively refining based on props OR local state
    const isActiveRefining = isRefining || status === 'refining';

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto space-y-4">
            {/* Essay Display Area */}
            <div className="flex-1 bg-[hsl(var(--color-surface))] rounded-xl border border-[hsl(var(--color-border))] overflow-hidden shadow-sm relative">

                {/* Overlay for Refining State */}
                {isActiveRefining && (
                    <div className="absolute inset-0 z-10 bg-[hsl(var(--color-background))]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                        <div className="p-4 rounded-full bg-[hsl(var(--color-primary))]/10 mb-4 ring-1 ring-[hsl(var(--color-primary))]/20">
                            <Loader2 className="w-8 h-8 text-[hsl(var(--color-primary))] animate-spin" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--color-text-primary))]">Processing Request...</h3>
                        <p className="text-[hsl(var(--color-text-secondary))] max-w-md">
                            The AI is working on: <span className="italic block mt-2 font-medium">"{processingInstructions || instructions || 'Processing...'}"</span>
                        </p>
                    </div>
                )}

                <div className={`absolute inset-0 overflow-y-auto p-8 max-w-none text-[hsl(var(--color-text-primary))] transition-opacity duration-300 ${isActiveRefining ? 'opacity-30' : 'opacity-100'}`}>

                    {!essay.title && !essay.introduction ? (
                        <div className="text-center text-[hsl(var(--color-text-secondary))] mt-10">
                            No content available. The essay generation might have failed to produce text.
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-6 text-center text-[hsl(var(--color-text-primary))]">{essay.title}</h1>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-3 text-[hsl(var(--color-text-primary))]">Introduction</h3>
                                    <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-text-secondary))] text-lg">{essay.introduction}</p>
                                </div>

                                {essay.body_sections.map((section, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xl font-semibold mb-3 text-[hsl(var(--color-text-primary))]">{section.title}</h3>
                                        <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-text-secondary))] text-lg">{section.content}</p>
                                    </div>
                                ))}

                                <div>
                                    <h3 className="text-xl font-semibold mb-3 text-[hsl(var(--color-text-primary))]">Conclusion</h3>
                                    <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-text-secondary))] text-lg">{essay.conclusion}</p>
                                </div>
                            </div>

                            {essay.references && essay.references.length > 0 && (
                                <div className="mt-10 pt-8 border-t border-[hsl(var(--color-border))]">
                                    <h3 className="text-lg font-bold mb-4 text-[hsl(var(--color-text-primary))]">References</h3>
                                    <ul className="pl-5 space-y-2 text-sm text-[hsl(var(--color-text-secondary))] list-disc marker:text-[hsl(var(--color-text-muted))]">
                                        {essay.references.map((ref, idx) => (
                                            <li key={idx}>{ref}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Action Panel */}
            <div className="bg-[hsl(var(--color-surface))] p-5 rounded-xl border border-[hsl(var(--color-surface-light))] shadow-sm active:ring-0">

                <div className="flex gap-6 items-end">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm flex items-center gap-2 text-[hsl(var(--color-text-primary))]">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Refine with AI
                            </h4>
                            {essay.ai_feedback && !isActiveRefining && (
                                <button
                                    onClick={() => setEssay(prev => prev ? { ...prev, ai_feedback: undefined } : null)}
                                    className="text-[0.65rem] uppercase tracking-wider font-semibold text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
                                >
                                    Dismiss Feedback
                                </button>
                            )}
                        </div>

                        {/* AI Feedback Display - Sleek Version */}
                        {essay.ai_feedback && !isActiveRefining && (
                            <div className="relative overflow-hidden p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                {/* Decorational glow */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />

                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-md bg-[hsl(var(--color-background))] border border-purple-500/10 shadow-sm">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm leading-relaxed text-[hsl(var(--color-text-primary))]">
                                            <span className="font-semibold text-purple-600 mr-1.5">AI Response:</span>
                                            {essay.ai_feedback}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <textarea
                                placeholder="Ask a question (e.g., 'What is the word count?') or request edits (e.g., 'Make the tone more formal')"
                                className="flex min-h-[60px] w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-4 py-3 text-sm text-[hsl(var(--color-text-primary))] ring-offset-background placeholder:text-[hsl(var(--color-text-muted))] focus-visible:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                                rows={2}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRefine();
                                    }
                                }}
                                disabled={isActiveRefining}
                            />
                            <div className="absolute bottom-2 right-2">
                                <button
                                    className={`inline-flex items-center justify-center rounded-md p-2 transition-all ${isActiveRefining || !instructions.trim()
                                        ? 'bg-[hsl(var(--color-surface-light))] text-[hsl(var(--color-text-muted))]'
                                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                        }`}
                                    onClick={handleRefine}
                                    disabled={isActiveRefining || !instructions.trim()}
                                >
                                    {isActiveRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-full w-px bg-[hsl(var(--color-border))]/50 mx-2" />

                    <div className="w-48 flex flex-col justify-end pb-1">
                        <button
                            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 h-11 px-4 py-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 transform hover:-translate-y-0.5"
                            onClick={handleFinalize}
                            disabled={isFinalizing || isActiveRefining}
                        >
                            {isFinalizing ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            Approve & PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
