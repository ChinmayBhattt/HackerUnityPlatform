'use client';

import React, { useMemo } from 'react';
import { renderDescriptionToHtml } from '@/lib/format-description';

interface RichDescriptionProps {
  content?: string | null;
  className?: string;
}

export function RichDescription({ content, className = '' }: RichDescriptionProps) {
  const html = useMemo(() => renderDescriptionToHtml(content), [content]);

  if (!html) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
        No description provided.
      </p>
    );
  }

  return (
    <div
      className={`rich-description-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
