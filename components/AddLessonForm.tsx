'use client';

import { useRef, useState } from 'react';
import { createLesson } from '@/app/actions/lessons';
import { uploadLessonFile, isVideoFile, isDocumentFile, documentLabel, MAX_LESSON_FILE_SIZE_BYTES } from '@/lib/upload';

const ACCEPT = '.pdf,.pptx,.ppt,.docx,.doc,video/mp4,video/quicktime,video/webm,video/x-matroska';

export default function AddLessonForm({ courseId, nextSortOrder }: { courseId: string; nextSortOrder: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError('');
    if (f && !isVideoFile(f) && !isDocumentFile(f)) {
      setError('Unsupported file type. Upload a PDF, PPTX, DOCX, or video file.');
      setFile(null);
      return;
    }
    if (f && f.size > MAX_LESSON_FILE_SIZE_BYTES) {
      setError('File is too large. Lesson files must be 100MB or smaller.');
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a document or video file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { url } = await uploadLessonFile(file, courseId);
      const video = isVideoFile(file);

      const result = await createLesson(courseId, {
        title,
        description,
        duration_minutes: Number(duration) || 0,
        sort_order: nextSortOrder,
        video_url: video ? url : null,
        pdf_url: video ? null : url,
        attachment_label: video ? 'Video' : documentLabel(file),
      });

      if (result?.error) {
        setError(result.error);
        setUploading(false);
        return;
      }

      setTitle('');
      setDescription('');
      setDuration('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1.1rem' }}>
        Add Lesson
      </h3>

      {error && <div className="notice notice-error" style={{ marginBottom: '1.1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label" htmlFor="lesson-title">Lesson title</label>
        <input
          className="field-input"
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Session 1 — Who is God?"
          required
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label" htmlFor="lesson-description">Description (optional)</label>
        <textarea
          className="field-textarea"
          id="lesson-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short summary of this lesson"
        />
      </div>

      <div style={{ marginBottom: '1.1rem' }}>
        <label className="field-label" htmlFor="lesson-duration">Duration (minutes, optional)</label>
        <input
          className="field-input"
          id="lesson-duration"
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="15"
        />
      </div>

      <div style={{ marginBottom: '1.4rem' }}>
        <label className="field-label" htmlFor="lesson-file">
          Upload document or video
        </label>
        <input
          className="field-input"
          id="lesson-file"
          type="file"
          ref={fileInputRef}
          accept={ACCEPT}
          onChange={handleFileChange}
          style={{ padding: '.6rem' }}
        />
        <p style={{ fontSize: '.75rem', color: 'var(--text-dim)', marginTop: '.5rem' }}>
          Accepted: PDF, PowerPoint (.pptx/.ppt), Word (.docx/.doc), or video (MP4/MOV/WebM/MKV). Up to 100MB.
          {file && (
            <span style={{ display: 'block', color: 'var(--eden)', marginTop: '.25rem' }}>
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
          )}
        </p>
      </div>

      <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: '100%' }}>
        {uploading ? 'Uploading…' : 'Upload Lesson'}
      </button>
    </form>
  );
}
