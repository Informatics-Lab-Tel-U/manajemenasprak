import * as blogService from '@/services/blogService';
import { notFound } from 'next/navigation';
import { TiptapViewer } from '@/components/tiptap/viewer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let post = null;
  try {
    post = await blogService.getBlogPostBySlug(slug);
  } catch {
  }

  return {
    title: post ? `${post.title} | Portal Lab` : 'Post Not Found',
    description: post?.excerpt || '',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post = null;
  try {
    post = await blogService.getBlogPostBySlug(slug);
  } catch (error) {
    console.error('[BlogPostPage] SSR fetch error:', error);
  }

  if (!post) {
    notFound();
  }

  blogService.incrementBlogViewCount(post.id).catch(console.error);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link prefetch={false} href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <article>
          <header className="mb-8 space-y-4">
            <div className="flex items-center gap-2">
              {post.blog_categories?.name && (
                <span className="text-sm font-medium text-primary">
                  {post.blog_categories.name}
                </span>
              )}
              <span className="text-muted-foreground">&bull;</span>
              <time className="text-sm text-muted-foreground">
                {post.published_at ? format(new Date(post.published_at), 'dd MMMM yyyy', { locale: id }) : ''}
              </time>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-3 pt-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">
                {(post.pengguna?.nama_lengkap || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium">{post.pengguna?.nama_lengkap || 'Admin'}</p>
                <p className="text-muted-foreground">Penulis</p>
              </div>
            </div>
          </header>

          {post.cover_image_url && (
            <figure className="my-8 aspect-video relative rounded-xl overflow-hidden border bg-muted">
              <Image 
                src={post.cover_image_url} 
                alt={post.cover_image_alt || post.title} 
                fill 
                className="object-cover" 
              />
            </figure>
          )}

          <div className="mt-8">
            <TiptapViewer content={post.content} />
          </div>
        </article>
      </main>
    </div>
  );
}
