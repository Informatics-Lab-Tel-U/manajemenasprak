import * as blogService from '@/services/blogService';
import { TaxonomyDialog } from '@/components/blog/TaxonomyDialog';
import { TaxonomyDeleteButton } from '@/components/blog/TaxonomyDeleteButton';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export const metadata = {
  title: 'Kategori & Tag',
};

export default async function TaxonomyPage() {
  const [categories, tags] = await Promise.all([
    blogService.getAllBlogCategories(),
    blogService.getAllBlogTags(),
  ]);

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Kategori & Tag</h1>
          <p className="text-sm 2xl:text-base text-muted-foreground mt-1">Kelola taksonomi untuk Post Lab.</p>
        </div>
      </div>

      <div className="w-full">
        <div className="card glass p-6 flex flex-col gap-6 border border-border/50">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Kategori</h2>
                <TaxonomyDialog type="category" mode="create" />
              </div>
              <div className="rounded-md border bg-background/50 p-4">
                {categories && categories.length > 0 ? (
                  <ul className="divide-y">
                    {categories.map((cat: any) => (
                      <li key={cat.id} className="text-sm flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground text-xs font-mono">/{cat.slug}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TaxonomyDialog
                            type="category"
                            mode="edit"
                            initialData={{ id: cat.id, name: cat.name, slug: cat.slug }}
                            trigger={
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit {cat.name}</span>
                              </Button>
                            }
                          />
                          <TaxonomyDeleteButton type="category" id={cat.id} name={cat.name} />
                        </div>
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
                <TaxonomyDialog type="tag" mode="create" />
              </div>
              <div className="rounded-md border bg-background/50 p-4">
                {tags && tags.length > 0 ? (
                  <ul className="divide-y">
                    {tags.map((tag: any) => (
                      <li key={tag.id} className="text-sm flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tag.name}</span>
                          <span className="text-muted-foreground text-xs font-mono">#{tag.slug}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TaxonomyDialog
                            type="tag"
                            mode="edit"
                            initialData={{ id: tag.id, name: tag.name, slug: tag.slug }}
                            trigger={
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit {tag.name}</span>
                              </Button>
                            }
                          />
                          <TaxonomyDeleteButton type="tag" id={tag.id} name={tag.name} />
                        </div>
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
      </div>
    </div>
  );
}
