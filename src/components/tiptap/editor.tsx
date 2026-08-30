'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Paperclip,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { AttachmentNode } from './attachment';
import imageCompression from 'browser-image-compression';

type TiptapEditorProps = {
  value: Record<string, any> | null;
  onChange: (value: Record<string, any>) => void;
  onCreated?: (editor: any) => void;
  editable?: boolean;
};

const MenuBar = ({ editor }: { editor: any }) => {
  const [isLinkOpen, setIsLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFile = e.target.files[0];
    
    setIsUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      const file = await imageCompression(rawFile, options);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `content-${Date.now()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('manajemenasprak')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('manajemenasprak')
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrlData.publicUrl }).run();
    } catch (error) {
      console.error('Error uploading image to tiptap:', error);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setLink = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (
        !finalUrl.startsWith('http://') &&
        !finalUrl.startsWith('https://') &&
        !finalUrl.startsWith('/') &&
        !finalUrl.startsWith('#') &&
        !finalUrl.startsWith('mailto:')
      ) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setIsLinkOpen(false);
  };

  const handleLinkClick = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkOpen(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/50 rounded-t-md">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLinkClick}
            className={editor.isActive('link') ? 'bg-muted' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  setLink();
                }
              }}
              className="h-8 flex-1"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLink();
              }}
            >
              Simpan
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
      >
        <Unlink className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().insertContent({ type: 'attachment' }).run()}
        title="Tambah Lampiran Dokumen"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
        title="Sisipkan Gambar"
        disabled={isUploadingImage}
      >
        {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </Button>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
        disabled={isUploadingImage}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export function TiptapEditor({ value, onChange, onCreated, editable = true }: TiptapEditorProps) {
  const parsedContent = React.useMemo(() => {
    if (!value) return { type: 'doc', content: [{ type: 'paragraph' }] };
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: true,
          autolink: true,
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-primary underline cursor-pointer',
          },
        },
      }),
      AttachmentNode,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md border shadow-sm max-w-full my-4',
        },
      }),
      Dropcursor,
    ],
    content: parsedContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-4 prose-headings:mb-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  React.useEffect(() => {
    if (editor && onCreated) {
      onCreated(editor);
    }
  }, [editor, onCreated]);

  return (
    <div className="flex flex-col border rounded-md">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
