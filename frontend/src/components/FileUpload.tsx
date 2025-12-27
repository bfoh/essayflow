'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, X, File } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    selectedFile: File | null;
    isUploading?: boolean;
    maxSizeMB?: number;
    acceptedTypes?: string[];
}

export function FileUpload({
    onFileSelect,
    onFileRemove,
    selectedFile,
    isUploading = false,
    maxSizeMB = 10,
    acceptedTypes = ['.pdf', '.docx']
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validateFile = (file: File): string | null => {
        if (file.size > maxSizeBytes) {
            return `File size exceeds ${maxSizeMB}MB limit`;
        }

        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
            return `Only ${acceptedTypes.join(', ')} files are allowed`;
        }

        return null;
    };

    const handleFile = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        onFileSelect(file);
    }, [onFileSelect, maxSizeBytes, acceptedTypes]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setError(null);
        onFileRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full">
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isUploading}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[hsla(var(--color-success),0.1)] flex items-center justify-center">
                            <File className="w-6 h-6 text-[hsl(var(--color-success))]" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium mb-1">{selectedFile.name}</p>
                            <p className="text-sm text-[hsl(var(--color-text-muted))]">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            onClick={clearFile}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[hsl(var(--color-surface-light))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="upload-icon-wrapper">
                            <Upload className="w-7 h-7 text-[hsl(var(--color-primary))]" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium mb-1">
                                Drop your assignment here
                            </p>
                            <p className="text-sm text-[hsl(var(--color-text-secondary))]">
                                or <span className="text-[hsl(var(--color-primary-light))] font-medium cursor-pointer">browse files</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[hsl(var(--color-text-muted))]">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[hsl(var(--color-surface-light))]">
                                <FileText className="w-3.5 h-3.5" />
                                PDF, DOCX
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-[hsl(var(--color-surface-light))]">
                                Max {maxSizeMB}MB
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsla(var(--color-error),0.1)] border border-[hsla(var(--color-error),0.2)]">
                    <AlertCircle className="w-4 h-4 text-[hsl(var(--color-error))] flex-shrink-0" />
                    <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>
                </div>
            )}
        </div>
    );
}
