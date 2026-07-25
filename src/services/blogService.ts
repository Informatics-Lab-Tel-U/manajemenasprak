import 'server-only';
import { logger } from '@/lib/logger';
import { honoFetch } from '@/lib/honoClient';

export async function getAllBlogPosts() {
  try {
    const res = await honoFetch<any[]>('/api/blog/posts');
    if (!res.ok || !res.data) return [];
    return res.data;
  } catch (error) {
    logger.error('Error fetching all blog posts from Hono:', error);
    return [];
  }
}

export async function getPublishedBlogPosts() {
  try {
    const res = await honoFetch<any[]>('/api/blog/posts?status=published');
    if (!res.ok || !res.data) return [];
    return res.data;
  } catch (error) {
    logger.error('Error fetching published blog posts from Hono:', error);
    return [];
  }
}

export async function getBlogPostById(id: string) {
  try {
    const res = await honoFetch<any>(`/api/blog/posts/${id}`);
    if (!res.ok || !res.data) return null;
    return res.data;
  } catch (error) {
    logger.error(`Error fetching blog post with ID ${id} from Hono:`, error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const res = await honoFetch<any>(`/api/blog/posts/slug/${slug}`);
    if (!res.ok || !res.data) return null;
    return res.data;
  } catch (error) {
    logger.error(`Error fetching blog post with slug ${slug} from Hono:`, error);
    return null;
  }
}

export async function getAllBlogCategories() {
  try {
    const res = await honoFetch<any[]>('/api/blog/categories');
    if (!res.ok || !res.data) return [];
    return res.data;
  } catch (error) {
    logger.error('Error fetching blog categories from Hono:', error);
    return [];
  }
}

export async function getAllBlogTags() {
  try {
    const res = await honoFetch<any[]>('/api/blog/tags');
    if (!res.ok || !res.data) return [];
    return res.data;
  } catch (error) {
    logger.error('Error fetching blog tags from Hono:', error);
    return [];
  }
}

export async function createBlogCategory(name: string, slug: string) {
  const res = await honoFetch<any>('/api/blog/categories', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
  if (!res.ok || !res.data) {
    throw new Error(res.error || 'Error creating blog category');
  }
  return res.data;
}

export async function createBlogTag(name: string, slug: string) {
  const res = await honoFetch<any>('/api/blog/tags', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
  if (!res.ok || !res.data) {
    throw new Error(res.error || 'Error creating blog tag');
  }
  return res.data;
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

export async function createBlogPost(input: CreateBlogPostInput) {
  const res = await honoFetch<any>('/api/blog/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok || !res.data) {
    throw new Error(res.error || 'Error creating blog post');
  }
  return res.data;
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

export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  const res = await honoFetch<any>(`/api/blog/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok || !res.data) {
    throw new Error(res.error || 'Error updating blog post');
  }
  return res.data;
}

export async function incrementBlogViewCount(id: string) {
  try {
    await honoFetch(`/api/blog/posts/${id}/view`, {
      method: 'POST',
    });
  } catch (error) {
    logger.error('Error incrementing view count:', error);
  }
}

export async function deleteBlogPost(id: string) {
  const res = await honoFetch<any>(`/api/blog/posts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok || !res.data) {
    throw new Error(res.error || 'Error deleting blog post');
  }
  return res.data;
}