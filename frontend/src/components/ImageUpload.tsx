'use client';

import React, { useRef } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    images: File[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
    maxImages?: number;
}

export function ImageUpload({
    images,
    onAdd,
    onRemove,
    maxImages = 5
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files).filter(file =>
                file.type.startsWith('image/')
            );
            onAdd(newFiles);
        }
        // Reset input so same file can be selected again
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
        <div className="space-y-3">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Image Grid */}
            <div className="flex flex-wrap gap-3">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative group w-24 h-24 rounded-xl overflow-hidden bg-[hsl(var(--color-surface-light))] border border-[hsl(var(--color-border))]"
                    >
                        <img
                            src={URL.createObjectURL(image)}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => onRemove(index)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3.5 h-3.5 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/60 text-[10px] text-white truncate">
                            {image.name}
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                {images.length < maxImages && (
                    <button
                        onClick={handleClick}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-[hsl(var(--color-border-light))] bg-[hsl(var(--color-surface))] flex flex-col items-center justify-center gap-2 hover:border-[hsl(var(--color-primary))] hover:bg-[hsla(var(--color-primary),0.05)] transition-colors"
                    >
                        <Plus className="w-6 h-6 text-[hsl(var(--color-text-muted))]" />
                        <span className="text-xs text-[hsl(var(--color-text-muted))]">Add Image</span>
                    </button>
                )}
            </div>

            {/* Help Text */}
            {images.length === 0 && (
                <p className="text-xs text-[hsl(var(--color-text-muted))]">
                    Add diagrams, charts, or other reference images to include in context
                </p>
            )}
        </div>
    );
}
