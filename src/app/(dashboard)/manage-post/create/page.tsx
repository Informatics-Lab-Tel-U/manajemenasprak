import * as blogService from '@/services/blogService';
import { PostForm } from '@/components/blog/PostForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Buat Post Baru',
};

export default async function CreatePostPage() {
  const [categories, tags] = await Promise.all([
    blogService.getAllBlogCategories(),
    blogService.getAllBlogTags(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/manage-post" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Post Baru</h1>
          <p className="text-muted-foreground">Tulis artikel atau pengumuman baru.</p>
        </div>
      </div>
      
      <div className="w-full bg-card p-6 rounded-lg border">
        <PostForm categories={categories || []} tags={tags || []} />
      </div>
    </div>
  );
}
