'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

interface LessonInput {
  title: string;
  description: string;
  duration_minutes: number;
  sort_order: number;
  video_url: string | null;
  pdf_url: string | null;
  attachment_label: string | null;
}

export async function createLesson(courseId: string, input: LessonInput) {
  const supabase = await createClient();

  if (!input.title.trim()) return { error: 'Lesson title is required.' };

  const { error } = await supabase.from('lessons').insert({
    course_id: courseId,
    title: input.title,
    description: input.description || null,
    duration_minutes: input.duration_minutes,
    sort_order: input.sort_order,
    video_url: input.video_url,
    pdf_url: input.pdf_url,
    attachment_label: input.attachment_label,
    is_published: true,
  });

  if (error) return { error: error.message };

  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);
  await supabase.from('courses').update({ total_lessons: count ?? 0 }).eq('id', courseId);

  revalidatePath(`/admin/courses/${courseId}`);
  return {};
}

export async function deleteLesson(lessonId: string, courseId: string, filePaths: string[]) {
  const supabase = await createClient();

  if (filePaths.length) {
    await supabase.storage.from('lesson-files').remove(filePaths);
  }

  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) return { error: error.message };

  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);
  await supabase.from('courses').update({ total_lessons: count ?? 0 }).eq('id', courseId);

  revalidatePath(`/admin/courses/${courseId}`);
  return {};
}
