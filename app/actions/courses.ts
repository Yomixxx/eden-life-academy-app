'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CourseCategory, CourseLevel } from '@/lib/types';

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'foundation') as CourseCategory;
  const level = String(formData.get('level') || 'beginner') as CourseLevel;

  if (!title) return { error: 'Title is required.' };

  const { data, error } = await supabase
    .from('courses')
    .insert({ title, description, category, level, is_published: false })
    .select('id')
    .single();

  if (error) return { error: error.message };

  redirect(`/admin/courses/${data.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'foundation') as CourseCategory;
  const level = String(formData.get('level') || 'beginner') as CourseLevel;
  const is_published = formData.get('is_published') === 'on';

  if (!title) return { error: 'Title is required.' };

  const { error } = await supabase
    .from('courses')
    .update({ title, description, category, level, is_published })
    .eq('id', courseId);

  if (error) return { error: error.message };

  revalidatePath('/admin');
  revalidatePath(`/admin/courses/${courseId}`);
  return {};
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  redirect('/admin');
}

export async function deleteCourseFormAction(formData: FormData) {
  const courseId = String(formData.get('course_id') || '');
  if (courseId) await deleteCourse(courseId);
}
