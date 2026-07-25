import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function getAllBlogPosts(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, status, published_at, view_count, excerpt, content,
      blog_categories (id, name, slug),
      pengguna (id, nama_lengkap)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching all blog posts:', error);
    return [];
  }
  return data;
}

export async function getPublishedBlogPosts(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, published_at, cover_image_url, cover_image_alt,
      blog_categories (name),
      pengguna (nama_lengkap)
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (error) {
    logger.error('Error fetching published blog posts:', error);
    return [];
  }
  return data;
}

export async function getBlogPostById(id: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, blog_post_tags(tag_id)')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Error fetching blog post with ID ${id}:`, error);
    return null;
  }
  return data;
}

export async function getBlogPostBySlug(slug: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_categories (name, slug),
      pengguna (nama_lengkap)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (error) {
    logger.error(`Error fetching blog post with slug ${slug}:`, error);
    return null;
  }
  return data;
}

export async function getAllBlogCategories(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .order('name');

  if (error) {
    logger.error('Error fetching blog categories:', error);
    return [];
  }
  return data;
}

export async function getAllBlogTags(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_tags')
    .select('id, name, slug')
    .order('name');

  if (error) {
    logger.error('Error fetching blog tags:', error);
    return [];
  }
  return data;
}

export async function createBlogCategory(name: string, slug: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_categories')
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    logger.error('Error creating blog category:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function createBlogTag(name: string, slug: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_tags')
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    logger.error('Error creating blog tag:', error);
    throw new Error(error.message);
  }
  return data;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: any;
  category_id?: string | null;
  status: string;
  published_at?: string | null;
  author_id: string;
  tags?: string[];
}

export async function createBlogPost(input: CreateBlogPostInput, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { tags, ...postData } = input;
  
  const { data, error } = await supabase.from('blog_posts').insert(postData).select().single();

  if (error) {
    logger.error('Error creating blog post:', error);
    throw new Error(error.message);
  }
  
  if (tags && tags.length > 0) {
    const tagInserts = tags.map((tagId) => ({ post_id: data.id, tag_id: tagId }));
    await supabase.from('blog_post_tags').insert(tagInserts);
  }
  
  return data;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: any;
  category_id?: string | null;
  status?: string;
  tags?: string[];
}

export async function updateBlogPost(id: string, input: UpdateBlogPostInput, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { tags, ...postData } = input;
  
  const { data, error } = await supabase
    .from('blog_posts')
    .update(postData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating blog post:', error);
    throw new Error(error.message);
  }
  
  if (tags !== undefined) {
    await supabase.from('blog_post_tags').delete().eq('post_id', id);
    if (tags.length > 0) {
      const tagInserts = tags.map((tagId) => ({ post_id: id, tag_id: tagId }));
      await supabase.from('blog_post_tags').insert(tagInserts);
    }
  }
  
  return data;
}

export async function incrementBlogViewCount(id: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  // Assuming there is an RPC 'increment_view_count', otherwise we gracefully fallback or ignore
  const { error } = await supabase.rpc('increment_view_count', { post_id: id });
  if (error) {
    // If RPC doesn't exist, we skip error to prevent crash on read, but log it
    logger.error('Error incrementing view count (RPC might be missing):', error);
  }
}

export async function deleteBlogPost(id: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error deleting blog post:', error);
    throw new Error(error.message);
  }
  return data;
}