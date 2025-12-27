'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ProgressStepper, JobStatus } from '@/components/ProgressStepper';
import { HumanizationSlider } from '@/components/HumanizationSlider';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Sparkles,
  Zap,
  Shield,
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  Layers,
  PenTool,
  Send,
  MessageSquare,
  Image as ImageIcon,
  FileDown
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface JobState {
  jobId: string | null;
  status: JobStatus;
  progress: number;
  message: string | null;
  downloadUrl: string | null;
  error: string | null;
}

export default function Home() {
  const [humanizationIntensity, setHumanizationIntensity] = useState(0.5);
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [job, setJob] = useState<JobState>({
    jobId: null,
    status: 'pending',
    progress: 0,
    message: null,
    downloadUrl: null,
    error: null,
  });

  useEffect(() => {
    if (!job.jobId || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/task/${job.jobId}`);
        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        setJob({
          jobId: data.job_id,
          status: data.status as JobStatus,
          progress: data.progress,
          message: data.message,
          downloadUrl: data.download_url,
          error: data.error,
        });
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [job.jobId, job.status]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleImageAdd = (files: File[]) => {
    setReferenceImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const handleImageRemove = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('humanization_intensity', humanizationIntensity.toString());
      if (studentName) formData.append('student_name', studentName);
      if (courseName) formData.append('course_name', courseName);
      if (additionalPrompt) formData.append('additional_prompt', additionalPrompt);

      // Add reference images
      referenceImages.forEach((image, index) => {
        formData.append(`reference_image_${index}`, image);
      });

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();

      setJob({
        jobId: data.job_id,
        status: 'pending',
        progress: 0,
        message: data.message,
        downloadUrl: null,
        error: null,
      });
    } catch (error) {
      setJob(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setJob({
      jobId: null,
      status: 'pending',
      progress: 0,
      message: null,
      downloadUrl: null,
      error: null,
    });
    setSelectedFile(null);
    setReferenceImages([]);
    setAdditionalPrompt('');
  };

  const handleDownload = (format: 'pdf' | 'docx' = 'pdf') => {
    if (job.downloadUrl) {
      window.open(`${API_URL}${job.downloadUrl}?format=${format}`, '_blank');
    }
  };

  const hasActiveJob = !!job.jobId; // Show progress view whenever a job exists
  const canGenerate = selectedFile && !isUploading && !hasActiveJob;

  return (
    <main className="min-h-screen bg-grid">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-subtle pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--color-border))] bg-[hsla(var(--color-background),0.8)] backdrop-blur-xl">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">EssayFlow</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[hsl(var(--color-text-secondary))] hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-[hsl(var(--color-text-secondary))] hover:text-white transition-colors">
                How It Works
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-8">
        <div className="container container-md text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsla(var(--color-primary),0.1)] border border-[hsla(var(--color-primary),0.2)] mb-6 animate-in animate-delay-1">
            <Sparkles className="w-4 h-4 text-[hsl(var(--color-primary-light))]" />
            <span className="text-sm text-[hsl(var(--color-primary-light))]">AI-Powered Academic Writing</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 animate-in animate-delay-2 text-balance">
            Transform Assignments into{' '}
            <span className="text-gradient">Humanized Essays</span>
          </h1>

          <p className="text-lg text-[hsl(var(--color-text-secondary))] max-w-2xl mx-auto animate-in animate-delay-3">
            Upload your assignment. Our AI generates academically rigorous essays
            that sound naturally human-written.
          </p>
        </div>
      </section>

      {/* Main Card */}
      <section className="pb-20 pt-8">
        <div className="container container-md">
          <div className="card-elevated p-8 lg:p-10 animate-in animate-delay-4">
            {hasActiveJob ? (
              <div className="space-y-10">
                {/* Progress Stepper */}
                <ProgressStepper
                  currentStatus={job.status}
                  progress={job.progress}
                />

                {/* Status Message */}
                <div className="text-center">
                  {job.error ? (
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[hsla(var(--color-error),0.1)] border border-[hsla(var(--color-error),0.2)]">
                      <span className="text-[hsl(var(--color-error))]">{job.error}</span>
                    </div>
                  ) : job.status === 'completed' ? (
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[hsla(var(--color-success),0.1)] border border-[hsla(var(--color-success),0.2)]">
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--color-success))]" />
                        <span className="text-[hsl(var(--color-success))] font-medium">Your essay is ready!</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button onClick={() => handleDownload('pdf')} className="btn btn-primary">
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                        <button onClick={() => handleDownload('docx')} className="btn btn-secondary">
                          <FileDown className="w-4 h-4" />
                          Download DOCX
                        </button>
                        <button onClick={handleReset} className="btn btn-secondary">
                          <RefreshCw className="w-4 h-4" />
                          Start New
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <div className="spinner" />
                      <span className="text-[hsl(var(--color-text-secondary))]">
                        {job.message || 'Processing your document...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* File Upload */}
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  isUploading={isUploading}
                />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[hsl(var(--color-border))]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-[hsl(var(--color-text-muted))] bg-[hsl(var(--color-surface))]">
                      Additional Context
                    </span>
                  </div>
                </div>

                {/* Additional Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
                    <span className="text-sm font-medium text-[hsl(var(--color-text-secondary))]">
                      Additional Instructions (Optional)
                    </span>
                  </div>
                  <textarea
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    placeholder="Provide any additional context, specific requirements, or detailed instructions for your essay. For example: focus on certain topics, use specific sources, or follow a particular structure..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>

                {/* Reference Images */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
                    <span className="text-sm font-medium text-[hsl(var(--color-text-secondary))]">
                      Reference Images (Optional)
                    </span>
                    <span className="text-xs text-[hsl(var(--color-text-muted))]">
                      • Max 5 images
                    </span>
                  </div>
                  <ImageUpload
                    images={referenceImages}
                    onAdd={handleImageAdd}
                    onRemove={handleImageRemove}
                    maxImages={5}
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[hsl(var(--color-border))]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-[hsl(var(--color-text-muted))] bg-[hsl(var(--color-surface))]">
                      Settings
                    </span>
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* PDF Header Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
                      <span className="text-sm font-medium text-[hsl(var(--color-text-secondary))]">
                        PDF Header (Optional)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="Course Name"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Humanization Settings */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <PenTool className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
                      <span className="text-sm font-medium text-[hsl(var(--color-text-secondary))]">
                        Humanization Level
                      </span>
                    </div>
                    <HumanizationSlider
                      value={humanizationIntensity}
                      onChange={setHumanizationIntensity}
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Generate button clicked', { selectedFile, canGenerate, isUploading, hasActiveJob });
                      handleGenerate();
                    }}
                    disabled={!canGenerate}
                    className={`btn btn-primary w-full py-4 text-base ${!canGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <div className="spinner" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Generate Essay
                      </>
                    )}
                  </button>
                  {!selectedFile && (
                    <p className="text-center text-sm text-[hsl(var(--color-text-muted))] mt-3">
                      Upload an assignment document to get started
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-[hsl(var(--color-border))]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Why Choose <span className="text-gradient">EssayFlow</span>
            </h2>
            <p className="text-[hsl(var(--color-text-secondary))]">
              Advanced AI technology designed for academic excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Layers className="w-5 h-5" />,
                title: 'Multi-Pass Engine',
                description: 'Three-stage process: draft generation, humanization, and professional formatting.',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Undetectable Output',
                description: 'Advanced techniques create essays that bypass AI detection while maintaining quality.',
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: 'Professional PDFs',
                description: 'Formatted documents with your name, course, date, and academic headers.',
              },
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[hsl(var(--color-text-secondary))] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-[hsl(var(--color-border))]">
        <div className="container container-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-[hsl(var(--color-text-secondary))]">
              Four simple steps to your perfect essay
            </p>
          </div>

          <div className="space-y-4">
            {[
              { step: '1', title: 'Upload Your Assignment', desc: 'Drop your PDF or DOCX assignment document.' },
              { step: '2', title: 'Add Context & Instructions', desc: 'Provide additional details and reference images.' },
              { step: '3', title: 'Generate & Humanize', desc: 'GPT-4o creates a draft, then humanizes it for natural flow.' },
              { step: '4', title: 'Download Your Essay', desc: 'Get a professionally formatted PDF ready for submission.' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-5 p-5 rounded-xl bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(250,70%,50%)] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-[hsl(var(--color-text-secondary))]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[hsl(var(--color-border))]">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[hsl(var(--color-primary))]" />
              <span className="font-medium">EssayFlow</span>
            </div>
            <p className="text-sm text-[hsl(var(--color-text-muted))]">
              © 2024 EssayFlow AI. Built for academic excellence.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
