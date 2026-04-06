import { api } from '@/lib/api';
import type { Lesson } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiLesson {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string | null;
  type: 'pdf' | 'text' | 'link' | 'video';
  file_url?: string | null;
  created_at: string;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapLesson(lesson: ApiLesson): Lesson {
  return {
    id: lesson.id,
    section_subject_id: lesson.section_subject,
    section_id: lesson.section_id,
    subject_id: lesson.subject_id,
    subject_name: lesson.subject_name,
    subject_code: lesson.subject_code,
    title: lesson.title,
    description: lesson.description ?? undefined,
    content_type: lesson.type,
    file_url: lesson.file_url ?? undefined,
    created_at: lesson.created_at,
  };
}

export const lessonService = {
  async list(): Promise<Lesson[]> {
    const { data } = await api.get<ApiList<ApiLesson>>('/api/learning-materials/');
    return unwrapList(data).map(mapLesson);
  },
  async get(id: string): Promise<Lesson> {
    const { data } = await api.get<ApiLesson>(`/api/learning-materials/${id}/`);
    return mapLesson(data);
  },
  async create(payload: FormData | {
    section_subject: string;
    title: string;
    description?: string;
    type: 'text' | 'pdf' | 'link' | 'video';
    file_url?: string;
  }): Promise<Lesson> {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await api.post<ApiLesson>(
      '/api/learning-materials/',
      payload,
      isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return mapLesson(data);
  },
  async aiGenerate(payload: {
    section_subject: string;
    prompt: string;
    type: 'text' | 'pdf';
    file_url?: string;
  }): Promise<Lesson> {
    const { data } = await api.post<ApiLesson>('/api/learning-materials/ai-generate/', payload);
    return mapLesson(data);
  },
  async aiPreview(payload: {
    section_subject: string;
    prompt: string;
    type: 'text' | 'pdf';
    file_url?: string;
  }): Promise<{
    section_subject: string;
    title: string;
    description: string;
    type: 'text' | 'pdf';
    file_url?: string | null;
  }> {
    const { data } = await api.post('/api/learning-materials/ai-preview/', payload);
    return data as {
      section_subject: string;
      title: string;
      description: string;
      type: 'text' | 'pdf';
      file_url?: string | null;
    };
  },
  async aiSave(payload: {
    section_subject: string;
    title: string;
    description: string;
    type: 'text' | 'pdf';
    file_url?: string;
  }): Promise<Lesson> {
    const { data } = await api.post<ApiLesson>('/api/learning-materials/ai-save/', payload);
    return mapLesson(data);
  },
  async aiPreviewPdf(payload: {
    section_subject: string;
    title: string;
    description: string;
    file_url?: string;
  }): Promise<Blob> {
    const { data } = await api.post<Blob>('/api/learning-materials/ai-preview-pdf/', payload, {
      responseType: 'blob',
    });
    return data;
  },
  async download(id: string): Promise<Blob> {
    const { data } = await api.get<Blob>(`/api/learning-materials/${id}/download/`, {
      responseType: 'blob',
    });
    return data;
  },
  async update(id: string, payload: Partial<{
    title: string;
    description: string;
    type: 'text' | 'pdf' | 'link' | 'video';
    file_url: string;
  }>): Promise<Lesson> {
    const { data } = await api.patch<ApiLesson>(`/api/learning-materials/${id}/`, payload);
    return mapLesson(data);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/learning-materials/${id}/`);
  },
};
