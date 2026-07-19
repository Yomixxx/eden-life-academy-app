import { createClient } from '@/lib/supabase/client';

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

const DOCUMENT_EXTENSIONS = new Set(['pdf', 'pptx', 'ppt', 'docx', 'doc']);

function extensionOf(file: File) {
  return file.name.split('.').pop()?.toLowerCase();
}

export function isVideoFile(file: File) {
  return file.type.startsWith('video/');
}

export function isDocumentFile(file: File) {
  if (DOCUMENT_TYPES.has(file.type)) return true;
  // Some browsers/OSes report an empty or generic MIME type for .doc/.ppt
  // files, so fall back to the file extension.
  const ext = extensionOf(file);
  return !!ext && DOCUMENT_EXTENSIONS.has(ext);
}

export function documentLabel(file: File) {
  return DOCUMENT_LABELS[file.type] ?? extensionOf(file)?.toUpperCase() ?? 'File';
}

export async function uploadLessonFile(file: File, courseId: string) {
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
