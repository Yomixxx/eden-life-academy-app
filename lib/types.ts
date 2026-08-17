export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  campus: string | null
  avatar_url: string | null
  role: string | null
  bio: string | null
}

export interface Course {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  total_lessons: number | null
  duration_minutes: number | null
  is_published: boolean
  is_locked: boolean
  sort_order: number | null
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  sort_order: number | null
  is_published: boolean
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  watch_seconds: number | null
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  certificate_number: string | null
}

export interface Sermon {
  id: string
  title: string
  speaker: string | null
  series: string | null
  scripture_reference: string | null
  description: string | null
  video_url: string | null
  campus: string | null
  preached_at: string | null
  duration_minutes: number | null
  sort_order: number | null
  youtube_video_id: string | null
}

export interface Announcement {
  id: string
  title: string
  body: string | null
  category: string | null
  campus: string | null
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
}

export interface Group {
  id: string
  name: string
  description: string | null
  category: string | null
  campus: string | null
  leader_id: string | null
  meeting_day: string | null
  meeting_time: string | null
  is_open: boolean
}

export interface PrayerRequest {
  id: string
  user_id: string
  request: string
  is_anonymous: boolean
  prayer_count: number | null
  is_answered: boolean
  is_public: boolean
  created_at: string
}
