import * as blogService from '@/services/blogService';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog Laboratorium',
  description: 'Pengumuman dan Artikel Laboratorium',
};

export default async function BlogPage() {
  let posts: any[] = [];
  try {
    posts = (await blogService.getPublishedBlogPosts()) || [];
  } catch (error) {
    console.error('[BlogPage] SSR fetch error:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight">Portal Lab</h1>
          <p className="text-muted-foreground mt-2">Artikel, modul, dan pengumuman terbaru.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {(!posts || posts.length === 0) ? (
          <div className="text-center py-20 text-muted-foreground">
            Belum ada artikel yang dipublikasikan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video relative bg-muted">
                  {post.cover_image_url ? (
                    <Image 
                      src={post.cover_image_url} 
                      alt={post.cover_image_alt || post.title} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.blog_categories?.name && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {post.blog_categories.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: id }) : ''}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Oleh {post.pengguna?.nama_lengkap || 'Admin'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
