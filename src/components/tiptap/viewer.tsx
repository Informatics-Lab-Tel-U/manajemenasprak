import * as React from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AttachmentNode } from './attachment';
import { normalizeTiptapContent } from '@/lib/tiptap-utils';

type TiptapViewerProps = {
  content: Record<string, any> | null;
  className?: string;
};

export function TiptapViewer({ content, className = '' }: TiptapViewerProps) {
  if (!content) {
    return null;
  }

  const html = React.useMemo(() => {
    try {
      const normalizedContent = normalizeTiptapContent(content);
      return generateHTML(normalizedContent, [
        StarterKit.configure({
          link: {
            openOnClick: true,
            autolink: true,
            HTMLAttributes: {
              target: '_blank',
              rel: 'noopener noreferrer',
              class: 'text-primary underline hover:text-primary/80 cursor-pointer',
            },
          },
        }),
        AttachmentNode,
      ]);
    } catch (error) {
      console.error('Error generating HTML from Tiptap content', error);
      return '';
    }
  }, [content]);

  return (
    <div 
      className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-4 prose-headings:mb-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
