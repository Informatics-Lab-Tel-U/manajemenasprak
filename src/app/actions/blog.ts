'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as blogService from '@/services/blogService';

export async function createBlogPost(formData: FormData, content: any) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('Unauthorized');
  }

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
      author_id: userData.user.id,
      tags,
    }, supabase);
  } catch (error: any) {
    console.error('Error creating post', error);
    throw new Error(error.message);
  }

  revalidatePath('/manage-post');
  redirect('/manage-post');
}

export async function updateBlogPost(id: string, formData: FormData, content: any) {
  const supabase = await createClient();
  
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
    }, supabase);
  } catch (error: any) {
    console.error('Error updating post', error);
    throw new Error(error.message);
  }

  revalidatePath('/manage-post');
  revalidatePath(`/manage-post/${id}/edit`);
  redirect('/manage-post');
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  
  try {
    await blogService.createBlogCategory(name, slug, supabase);
    revalidatePath('/manage-post/taxonomy');
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function createTag(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  
  try {
    await blogService.createBlogTag(name, slug, supabase);
    revalidatePath('/manage-post/taxonomy');
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  try {
    await blogService.deleteBlogPost(id, supabase);
    revalidatePath('/manage-post');
  } catch (error: any) {
    throw new Error(error.message);
  }
}
