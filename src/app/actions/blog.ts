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
  const category_id = formData.get('category_id') as string;
  const status = formData.get('status') as string;
  const tagsStr = formData.get('tags') as string;
  const tags = tagsStr ? JSON.parse(tagsStr) : [];
  const published_at = status === 'published' ? new Date().toISOString() : null;

  try {
    await blogService.createBlogPost({
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
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
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const category_id = formData.get('category_id') as string;
  const status = formData.get('status') as string;
  const tagsStr = formData.get('tags') as string;
  const tags = tagsStr ? JSON.parse(tagsStr) : [];

  try {
    await blogService.updateBlogPost(id, {
      title,
      slug,
      excerpt,
      content,
      category_id: category_id || null,
      status,
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
