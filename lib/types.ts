export type CourseCategory = 'foundation' | 'leadership' | 'ministry' | 'bible_study' | 'discipleship';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProfileRole = 'member' | 'leader' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  campus: 'mainland' | 'island' | null;
  avatar_url: string | null;
  role: ProfileRole;
  bio: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: CourseCategory;
  level: CourseLevel;
  thumbnail_url: string | null;
  duration_minutes: number;
  total_lessons: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  audio_url: string | null;
  content: string | null;
  pdf_url: string | null;
  attachment_label: string | null;
  duration_minutes: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  foundation: 'Foundation',
  leadership: 'Leadership',
  ministry: 'Ministry',
  bible_study: 'Bible Study',
  discipleship: 'Discipleship',
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
