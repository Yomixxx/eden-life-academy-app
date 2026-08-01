import { createClient } from '@/lib/supabase/client';

export const MAX_LESSON_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — must match the lesson-files bucket's configured file size limit in Supabase.

const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-powerpoint',
]);

const DOCUMENT_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOC',
};

export function isVideoFile(file: File) {
  return file.type.startsWith('video/');
}

export function isDocumentFile(file: File) {
  return DOCUMENT_TYPES.has(file.type);
}

export function documentLabel(file: File) {
  return DOCUMENT_LABELS[file.type] ?? file.name.split('.').pop()?.toUpperCase() ?? 'File';
}

export async function uploadLessonFile(file: File, courseId: string) {
  if (file.size > MAX_LESSON_FILE_SIZE_BYTES) {
    throw new Error('File is too large. Lesson files must be 100MB or smaller.');
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${courseId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('lesson-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('lesson-files').getPublicUrl(path);
  return { url: data.publicUrl, path };
}
