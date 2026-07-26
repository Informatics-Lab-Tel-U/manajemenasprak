'use server';

import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as blogService from '@/services/blogService';

export async function createBlogPost(formData: FormData, content: any) {
  const user = await requireAuth();

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const categoryRaw = formData.get('category_id') as string;
  const category_id = categoryRaw === 'none' || !categoryRaw ? null : categoryRaw;
  const status = formData.get('status') as string;
  const tagsStr = formData.get('tags') as string;
  const tags = tagsStr ? JSON.parse(tagsStr) : [];
  const publishedAtInput = formData.get('published_at') as string;

  let published_at: string | null = null;
  if (publishedAtInput) {
    published_at = new Date(publishedAtInput).toISOString();
  } else if (status === 'published') {
    published_at = new Date().toISOString();
  }

  try {
    await blogService.createBlogPost({
      title,
      slug,
      excerpt,
      content,
      category_id,
      status,
      published_at,
      author_id: user.id,
      tags,
    });
  } catch (error: any) {
    console.error('Error creating post', error);
    throw new Error(error.message);
  }

  revalidatePath('/manage-post');
  redirect('/manage-post');
}

export async function updateBlogPost(id: string, formData: FormData, content: any) {
  await requireAuth();

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const categoryRaw = formData.get('category_id') as string;
  const category_id = categoryRaw === 'none' || !categoryRaw ? null : categoryRaw;
  const status = formData.get('status') as string;
  const tagsStr = formData.get('tags') as string;
  const tags = tagsStr ? JSON.parse(tagsStr) : [];
  const publishedAtInput = formData.get('published_at') as string;

  let published_at: string | null = null;
  if (publishedAtInput) {
    published_at = new Date(publishedAtInput).toISOString();
  } else {
    // If no explicit datetime input, check existing post published_at
    const existingPost = await blogService.getBlogPostById(id);
    if (existingPost?.published_at) {
      published_at = existingPost.published_at;
    } else if (status === 'published') {
      published_at = new Date().toISOString();
    }
  }

  try {
    await blogService.updateBlogPost(id, {
      title,
      slug,
      excerpt,
      content,
      category_id,
      status,
      published_at,
      tags,
    });
  } catch (error: any) {
    console.error('Error updating post', error);
    throw new Error(error.message);
  }

  revalidatePath('/manage-post');
  revalidatePath(`/manage-post/${id}/edit`);
  redirect('/manage-post');
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  
  try {
    await blogService.createBlogCategory(name, slug);
    revalidatePath('/manage-post/taxonomy');
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function createTag(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  
  try {
    await blogService.createBlogTag(name, slug);
    revalidatePath('/manage-post/taxonomy');
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await blogService.deleteBlogPost(id);
    revalidatePath('/manage-post');
  } catch (error: any) {
    throw new Error(error.message);
  }
}
