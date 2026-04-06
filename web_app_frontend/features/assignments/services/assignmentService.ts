import { api } from '@/lib/api';
import type { Assignment, AssignmentSubmission } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiAssignment {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string | null;
  total_points: number;
  due_date: string;
  allow_late_submission: boolean;
  created_by_name?: string | null;
  created_at: string;
}

interface ApiAssignmentSubmission {
  id: string;
  assignment: string;
  assignment_title?: string | null;
  student: string;
  student_name?: string | null;
  file_url?: string | null;
  text_answer?: string | null;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
  graded_at?: string | null;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapAssignment(assignment: ApiAssignment): Assignment {
  return {
    id: assignment.id,
    section_subject_id: assignment.section_subject,
    section_id: assignment.section_id,
    subject_id: assignment.subject_id,
    subject_name: assignment.subject_name,
    subject_code: assignment.subject_code,
    title: assignment.title,
    description: assignment.description ?? undefined,
    total_points: assignment.total_points,
    due_date: assignment.due_date,
    allow_late_submission: assignment.allow_late_submission,
    created_by_name: assignment.created_by_name ?? undefined,
    created_at: assignment.created_at,
  };
}

function mapSubmission(submission: ApiAssignmentSubmission): AssignmentSubmission {
  return {
    id: submission.id,
    assignment_id: submission.assignment,
    assignment_title: submission.assignment_title ?? undefined,
    student_id: submission.student,
    student_name: submission.student_name ?? undefined,
    submission_file: submission.file_url ?? undefined,
    submission_text: submission.text_answer ?? undefined,
    score: submission.score ?? undefined,
    feedback: submission.feedback ?? undefined,
    submitted_at: submission.submitted_at,
    graded_at: submission.graded_at ?? undefined,
  };
}

export const assignmentService = {
  async list(): Promise<Assignment[]> {
    const { data } = await api.get<ApiList<ApiAssignment>>('/api/assignments/');
    return unwrapList(data).map(mapAssignment);
  },
  async listSubmissions(): Promise<AssignmentSubmission[]> {
    const { data } = await api.get<ApiList<ApiAssignmentSubmission>>('/api/assignments/submissions/');
    return unwrapList(data).map(mapSubmission);
  },
  async createSubmission(payload: {
    assignment: string;
    student: string;
    text_answer?: string;
    file_url?: string;
  }): Promise<AssignmentSubmission> {
    const { data } = await api.post<ApiAssignmentSubmission>('/api/assignments/submissions/', payload);
    return mapSubmission(data);
  },
  async gradeSubmission(submissionId: string, payload: { score?: number | null; feedback?: string | null }) {
    const { data } = await api.patch<ApiAssignmentSubmission>(
      `/api/assignments/submissions/${submissionId}/grade/`,
      payload
    );
    return mapSubmission(data);
  },
  async aiGradeSubmission(submissionId: string) {
    const { data } = await api.post<ApiAssignmentSubmission>(
      `/api/assignments/submissions/${submissionId}/ai-grade/`
    );
    return mapSubmission(data);
  },
  async downloadAllSubmissions(assignmentId: string) {
    const { data, headers } = await api.get<Blob>(`/api/assignments/${assignmentId}/download-submissions/`, {
      responseType: 'blob',
    });
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    const header = headers?.['content-disposition'] as string | undefined;
    const match = header?.match(/filename=\"?([^\";]+)\"?/i);
    link.href = blobUrl;
    link.download = match?.[1] ?? `assignment_${assignmentId}_submissions.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  },
  async create(payload: {
    section_subject: string;
    title: string;
    description?: string;
    total_points: number;
    due_date: string;
    allow_late_submission: boolean;
  }): Promise<Assignment> {
    const { data } = await api.post<ApiAssignment>('/api/assignments/', payload);
    return mapAssignment(data);
  },
  async aiGenerate(payload: {
    section_subject: string;
    prompt: string;
    due_date?: string;
    total_points?: number;
    allow_late_submission?: boolean;
  }): Promise<Assignment> {
    const { data } = await api.post<ApiAssignment>('/api/assignments/ai-generate/', payload);
    return mapAssignment(data);
  },
  async aiPreview(payload: {
    section_subject: string;
    prompt: string;
    due_date?: string;
    total_points?: number;
    allow_late_submission?: boolean;
  }): Promise<{
    section_subject: string;
    title: string;
    description: string;
    total_points: number;
    due_date: string;
    allow_late_submission: boolean;
  }> {
    const { data } = await api.post('/api/assignments/ai-preview/', payload);
    return data as {
      section_subject: string;
      title: string;
      description: string;
      total_points: number;
      due_date: string;
      allow_late_submission: boolean;
    };
  },
  async aiSave(payload: {
    section_subject: string;
    title: string;
    description: string;
    total_points?: number;
    due_date?: string;
    allow_late_submission?: boolean;
  }): Promise<Assignment> {
    const { data } = await api.post<ApiAssignment>('/api/assignments/ai-save/', payload);
    return mapAssignment(data);
  },
  async update(id: string, payload: Partial<{
    title: string;
    description: string;
    total_points: number;
    due_date: string;
    allow_late_submission: boolean;
  }>): Promise<Assignment> {
    const { data } = await api.patch<ApiAssignment>(`/api/assignments/${id}/`, payload);
    return mapAssignment(data);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/assignments/${id}/`);
  },
};
