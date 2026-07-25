import * as blogService from '@/services/blogService';
import { TaxonomyDialog } from '@/components/blog/TaxonomyDialog';

export const metadata = {
  title: 'Kategori & Tag',
};

export default async function TaxonomyPage() {
  const [categories, tags] = await Promise.all([
    blogService.getAllBlogCategories(),
    blogService.getAllBlogTags(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kategori & Tag</h1>
        <p className="text-muted-foreground">Kelola taksonomi untuk Post Lab.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kategori</h2>
            <TaxonomyDialog type="category" />
          </div>
          <div className="rounded-md border bg-card p-4">
            {categories && categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((cat: any) => (
                  <li key={cat.id} className="text-sm flex justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{cat.name}</span>
                    <span className="text-muted-foreground">/{cat.slug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada kategori.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tag</h2>
            <TaxonomyDialog type="tag" />
          </div>
          <div className="rounded-md border bg-card p-4">
            {tags && tags.length > 0 ? (
              <ul className="space-y-2">
                {tags.map((tag: any) => (
                  <li key={tag.id} className="text-sm flex justify-between p-2 hover:bg-muted/50 rounded-md">
                    <span>{tag.name}</span>
                    <span className="text-muted-foreground">#{tag.slug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada tag.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
