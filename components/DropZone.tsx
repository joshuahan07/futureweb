'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onUpload: (files: File[]) => void;
  section: string;
}

type UploadState = 'idle' | 'uploading' | 'done';

export default function DropZone({ onUpload, section }: DropZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploadState('uploading');
      try {
        await onUpload(acceptedFiles);
        setUploadState('done');
        setTimeout(() => setUploadState('idle'), 2000);
      } catch {
        setUploadState('idle');
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
        isDragActive
          ? 'border-amber-400 bg-amber-50/60 scale-[1.01]'
          : uploadState === 'uploading'
          ? 'border-amber-300 bg-amber-50/30'
          : uploadState === 'done'
          ? 'border-green-300 bg-green-50/30'
          : 'border-border bg-surface/60 hover:border-amber-300 hover:bg-amber-50/30'
      }`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-3">
        {/* Camera / upload icon */}
        {uploadState === 'uploading' ? (
          <div className="w-12 h-12 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
        ) : uploadState === 'done' ? (
          <svg
            className="w-12 h-12 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className={`w-12 h-12 transition-colors duration-300 ${
              isDragActive ? 'text-amber-500' : 'text-muted/60'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
        )}

        <div>
          {uploadState === 'uploading' ? (
            <p className="text-sm text-amber-600 font-medium">
              Uploading to {section}...
            </p>
          ) : uploadState === 'done' ? (
            <p className="text-sm text-green-600 font-medium">
              Uploaded successfully!
            </p>
          ) : isDragActive ? (
            <p className="text-sm text-amber-600 font-medium">
              Drop it like it&apos;s hot!
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Drop images, screenshots, or files here — or click to browse
              </p>
              <p className="text-xs text-muted/60 mt-1">
                JPG, PNG, GIF, WEBP
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
