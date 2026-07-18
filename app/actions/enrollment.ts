'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
  if (error) return { error: error.message };

  revalidatePath(`/courses/${courseId}`);
  return {};
}

export async function toggleLessonComplete(lessonId: string, courseId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('lesson_progress')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', existing.id);
  } else {
    await supabase.from('lesson_progress').insert({
      lesson_id: lessonId,
      course_id: courseId,
      user_id: user.id,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  }

  revalidatePath(`/courses/${courseId}`);
  return {};
}
