import { api } from '@/lib/api';
import type { Quiz, QuizAttempt, QuizAnswer, QuizProctorSession, QuizProctorLog, QuizProctorSummary } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiQuiz {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  title: string;
  description?: string | null;
  total_points: number;
  time_limit_minutes?: number | null;
  attempt_limit: number;
  due_date?: string | null;
  created_at: string;
  questions?: ApiQuizQuestion[];
  ai_grade_on_submit?: boolean | null;
  security_level?: 'normal' | 'strict' | null;
  is_available?: boolean | null;
}

interface ApiQuizChoice {
  id: string;
  choice_text: string;
  is_correct: boolean;
}

interface ApiQuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay' | 'identification';
  points: number;
  choices?: ApiQuizChoice[];
}

interface ApiQuizAnswer {
  id: string;
  question: string;
  selected_choice?: string | null;
  selected_choice_text?: string | null;
  selected_choice_is_correct?: boolean | null;
  text_answer?: string | null;
  points_earned?: number | null;
  is_correct?: boolean | null;
  feedback?: string | null;
  question_text?: string | null;
  question_points?: number | null;
  question_type?: string | null;
}

interface ApiQuizAttempt {
  id: string;
  quiz: string;
  quiz_title?: string | null;
  section_subject_id?: string | null;
  student: string;
  student_name?: string | null;
  score: number;
  raw_score?: number | null;
  penalty_percent?: number | null;
  feedback?: string | null;
  ai_grade_applied?: boolean | null;
  ai_grade_failed?: boolean | null;
  answers?: ApiQuizAnswer[];
  started_at: string;
  submitted_at?: string | null;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapQuiz(quiz: ApiQuiz): Quiz {
  return {
    id: quiz.id,
    section_subject_id: quiz.section_subject,
    section_id: quiz.section_id,
    subject_id: quiz.subject_id,
    subject_name: quiz.subject_name,
    title: quiz.title,
    description: quiz.description ?? undefined,
    total_points: quiz.total_points,
    time_limit_minutes: quiz.time_limit_minutes ?? undefined,
    attempt_limit: quiz.attempt_limit,
    due_date: quiz.due_date ?? undefined,
    created_at: quiz.created_at,
    ai_grade_on_submit: quiz.ai_grade_on_submit ?? undefined,
    security_level: quiz.security_level ?? undefined,
    is_available: quiz.is_available ?? undefined,
    questions: quiz.questions?.map((question) => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points,
      choices: question.choices?.map((choice) => ({
        id: choice.id,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct,
      })),
    })),
  };
}

function mapQuizAnswer(answer: ApiQuizAnswer): QuizAnswer {
  return {
    id: answer.id,
    question_id: answer.question,
    selected_choice_id: answer.selected_choice ?? undefined,
    selected_choice_text: answer.selected_choice_text ?? undefined,
    selected_choice_is_correct: answer.selected_choice_is_correct ?? undefined,
    text_answer: answer.text_answer ?? undefined,
    points_earned: answer.points_earned ?? undefined,
    is_correct: answer.is_correct ?? undefined,
    feedback: answer.feedback ?? undefined,
    question_text: answer.question_text ?? undefined,
    question_points: answer.question_points ?? undefined,
    question_type: answer.question_type ?? undefined,
  };
}

function mapQuizAttempt(attempt: ApiQuizAttempt): QuizAttempt {
  return {
    id: attempt.id,
    quiz_id: attempt.quiz,
    quiz_title: attempt.quiz_title ?? undefined,
    section_subject_id: attempt.section_subject_id ?? undefined,
    student_id: attempt.student,
    student_name: attempt.student_name ?? undefined,
    score: attempt.score ?? 0,
    raw_score: attempt.raw_score ?? undefined,
    penalty_percent: attempt.penalty_percent ?? undefined,
    feedback: attempt.feedback ?? undefined,
    ai_grade_applied: attempt.ai_grade_applied ?? undefined,
    ai_grade_failed: attempt.ai_grade_failed ?? undefined,
    answers: attempt.answers ? attempt.answers.map(mapQuizAnswer) : undefined,
    started_at: attempt.started_at,
    submitted_at: attempt.submitted_at ?? undefined,
  };
}

export const quizService = {
  async list(): Promise<Quiz[]> {
    const { data } = await api.get<ApiList<ApiQuiz>>('/api/quizzes/');
    return unwrapList(data).map(mapQuiz);
  },
  async get(id: string): Promise<Quiz> {
    const { data } = await api.get<ApiQuiz>(`/api/quizzes/${id}/`);
    return mapQuiz(data);
  },
  async listAttemptsAll(): Promise<QuizAttempt[]> {
    const { data } = await api.get<ApiList<ApiQuizAttempt>>('/api/quizzes/attempts/');
    return unwrapList(data).map(mapQuizAttempt);
  },
  async listAttemptsForQuiz(quizId: string): Promise<QuizAttempt[]> {
    const { data } = await api.get<ApiQuizAttempt[]>(`/api/quizzes/${quizId}/attempts/`);
    return (data ?? []).map(mapQuizAttempt);
  },
  async getAttempt(attemptId: string): Promise<QuizAttempt> {
    const { data } = await api.get<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/`);
    return mapQuizAttempt(data);
  },
  async create(payload: {
    section_subject: string;
    title: string;
    description?: string;
    total_points: number;
    time_limit_minutes?: number;
    attempt_limit: number;
    due_date: string;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }): Promise<Quiz> {
    const { data } = await api.post<ApiQuiz>('/api/quizzes/', payload);
    return mapQuiz(data);
  },
  async aiGenerate(payload: {
    section_subject: string;
    prompt: string;
    due_date?: string;
    time_limit_minutes?: number;
    attempt_limit?: number;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }): Promise<Quiz> {
    const { data } = await api.post<ApiQuiz>('/api/quizzes/ai-generate/', payload);
    return mapQuiz(data);
  },
  async aiPreview(payload: {
    section_subject: string;
    prompt: string;
    due_date?: string;
    time_limit_minutes?: number;
    attempt_limit?: number;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }): Promise<{
    section_subject: string;
    title: string;
    description: string;
    time_limit_minutes?: number | null;
    attempt_limit: number;
    due_date: string;
    questions: Array<Record<string, any>>;
    total_points: number;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }> {
    const { data } = await api.post('/api/quizzes/ai-preview/', payload);
    return data as {
      section_subject: string;
      title: string;
      description: string;
      time_limit_minutes?: number | null;
      attempt_limit: number;
      due_date: string;
      questions: Array<Record<string, any>>;
      total_points: number;
      ai_grade_on_submit?: boolean;
      security_level?: 'normal' | 'strict';
      is_available?: boolean;
    };
  },
  async aiSave(payload: {
    section_subject: string;
    title: string;
    description?: string;
    time_limit_minutes?: number | null;
    attempt_limit?: number;
    due_date?: string;
    questions?: Array<Record<string, any>>;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }): Promise<Quiz> {
    const { data } = await api.post<ApiQuiz>('/api/quizzes/ai-save/', payload);
    return mapQuiz(data);
  },
  async update(id: string, payload: Partial<{
    title: string;
    description: string;
    total_points: number;
    time_limit_minutes?: number;
    attempt_limit: number;
    due_date?: string;
    ai_grade_on_submit?: boolean;
    security_level?: 'normal' | 'strict';
    is_available?: boolean;
  }>): Promise<Quiz> {
    const { data } = await api.patch<ApiQuiz>(`/api/quizzes/${id}/`, payload);
    return mapQuiz(data);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/quizzes/${id}/`);
  },
  async listAttempts(quizId: string): Promise<QuizAttempt[]> {
    const { data } = await api.get<ApiQuizAttempt[]>(`/api/quizzes/${quizId}/attempts/`);
    return (data ?? []).map(mapQuizAttempt);
  },
  async gradeAttempt(attemptId: string, payload: { score?: number }): Promise<QuizAttempt> {
    const { data } = await api.patch<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/`, payload);
    return mapQuizAttempt(data);
  },
  async aiGradeAttempt(attemptId: string): Promise<QuizAttempt> {
    const { data } = await api.post<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/ai_grade/`);
    return mapQuizAttempt(data);
  },
  async startProctor(quizId: string, payload: { device_id: string }): Promise<QuizProctorSession> {
    const { data } = await api.post<QuizProctorSession>(`/api/quizzes/${quizId}/proctor/start/`, payload);
    return data;
  },
  async heartbeat(payload: { session_id: string; device_id: string }) {
    const { data } = await api.post('/api/quizzes/proctor/heartbeat/', payload);
    return data as {
      status: string;
      warnings: number;
      terminations: number;
      penalty_percent: number;
    };
  },
  async reportViolation(payload: {
    session_id: string;
    reason: string;
    detail?: string;
    image_data?: string;
    answers?: Array<{ question_id: string; selected_choice_id?: string; text_answer?: string }>;
    ai_grade?: boolean;
  }) {
    const { data } = await api.post('/api/quizzes/proctor/violation/', payload);
    return data as {
      warnings: number;
      terminations: number;
      penalty_percent: number;
      status: string;
      terminated: boolean;
      blocked: boolean;
    };
  },
  async sendSnapshot(payload: { session_id: string; reason: string; image_data: string }) {
    const { data } = await api.post('/api/quizzes/proctor/snapshot/', payload);
    return data as { id: string; image_url: string };
  },
  async endProctor(payload: { session_id: string; reason?: string }) {
    const { data } = await api.post('/api/quizzes/proctor/end/', payload, { headers: { 'Content-Type': 'application/json' } });
    return data as { status: string };
  },
  async logEvent(payload: { session_id: string; event_type: string; detail?: string }) {
    const { data } = await api.post('/api/quizzes/proctor/event/', payload);
    return data as { status: string };
  },
  async getProctorLogs(payload: { quiz_id: string; student_id?: string; attempt_id?: string }): Promise<QuizProctorLog[]> {
    if (payload.attempt_id) {
      try {
        const { data } = await api.get<QuizProctorLog[]>(
          `/api/quizzes/attempts/${payload.attempt_id}/proctor-logs/`
        );
        return data ?? [];
      } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404) {
          throw error;
        }
      }
    }
    if (payload.quiz_id) {
      try {
        const { data } = await api.get<QuizProctorLog[]>(
          `/api/quizzes/${payload.quiz_id}/proctor-logs/`,
          { params: { student_id: payload.student_id, attempt_id: payload.attempt_id } }
        );
        return data ?? [];
      } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404) {
          throw error;
        }
      }
    }
    try {
      const { data } = await api.get<QuizProctorLog[]>('/api/quizzes/proctor/logs/', { params: payload });
      return data ?? [];
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        const { data } = await api.get<QuizProctorLog[]>('/api/quizzes/proctor/logs', { params: payload });
        return data ?? [];
      }
      throw error;
    }
  },
  async getProctorSummary(): Promise<QuizProctorSummary[]> {
    const { data } = await api.get<QuizProctorSummary[]>('/api/quizzes/proctor/summary/');
    return data ?? [];
  },
  async createAttempt(quizId: string) {
    const { data } = await api.post<ApiQuizAttempt>('/api/quizzes/attempts/', { quiz: quizId });
    return mapQuizAttempt(data);
  },
  async createQuestion(payload: { quiz: string; question_text: string; question_type: string; points: number }) {
    const { data } = await api.post('/api/quizzes/questions/', payload);
    return data as { id: string };
  },
  async createChoice(payload: { question: string; choice_text: string; is_correct?: boolean }) {
    const { data } = await api.post('/api/quizzes/choices/', payload);
    return data as { id: string };
  },
  async updateChoice(choiceId: string, payload: { choice_text?: string; is_correct?: boolean }) {
    const { data } = await api.patch(`/api/quizzes/choices/${choiceId}/`, payload);
    return data as { id: string };
  },
  async deleteChoice(choiceId: string) {
    await api.delete(`/api/quizzes/choices/${choiceId}/`);
  },
  async updateQuestion(questionId: string, payload: { question_text?: string; question_type?: string; points?: number }) {
    const { data } = await api.patch(`/api/quizzes/questions/${questionId}/`, payload);
    return data as { id: string };
  },
  async deleteQuestion(questionId: string) {
    await api.delete(`/api/quizzes/questions/${questionId}/`);
  },
  async submitAttempt(
    attemptId: string,
    answers: Array<{ question_id: string; selected_choice_id?: string; text_answer?: string }>,
    options?: { ai_grade?: boolean }
  ) {
    const { data } = await api.patch<ApiQuizAttempt & { ai_grade_applied?: boolean; ai_grade_failed?: boolean }>(
      `/api/quizzes/attempts/${attemptId}/submit/`,
      {
        answers,
        ai_grade: options?.ai_grade ?? true,
      }
    );
    return {
      attempt: mapQuizAttempt(data),
      ai_grade_applied: data.ai_grade_applied,
      ai_grade_failed: data.ai_grade_failed,
    };
  },
  async gradeAnswers(
    attemptId: string,
    answers: Array<{ answer_id: string; points_earned: number | null; feedback?: string }>
  ): Promise<QuizAttempt> {
    const { data } = await api.patch<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/grade-answers/`, { answers });
    return mapQuizAttempt(data);
  },
  async aiGradeAnswer(attemptId: string, answerId: string): Promise<QuizAttempt> {
    const { data } = await api.post<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/ai-grade-answer/`, {
      answer_id: answerId,
    });
    return mapQuizAttempt(data);
  },
  async aiPreviewAnswer(attemptId: string, answerId: string): Promise<{ score: number; feedback: string }> {
    const { data } = await api.post<{ score: number; feedback: string }>(
      `/api/quizzes/attempts/${attemptId}/ai-preview-answer/`,
      { answer_id: answerId }
    );
    return data;
  },
  async aiGradeEssayAnswers(attemptId: string): Promise<QuizAttempt> {
    const { data } = await api.post<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/ai-grade-essay/`);
    return mapQuizAttempt(data);
  },
  async updateAttempt(attemptId: string, payload: { score?: number; feedback?: string }): Promise<QuizAttempt> {
    const { data } = await api.patch<ApiQuizAttempt>(`/api/quizzes/attempts/${attemptId}/`, payload);
    return mapQuizAttempt(data);
  },
  async getFilterPreference(
    quizId: string
  ): Promise<{ submitted_only: boolean; needs_manual_only: boolean; score_only: boolean; feedback_only: boolean } | null> {
    const { data } = await api.get<
      Array<{ submitted_only: boolean; needs_manual_only: boolean; score_only: boolean; feedback_only: boolean }>
    >('/api/quizzes/filters/', {
      params: { quiz: quizId },
    });
    if (!data || data.length === 0) return null;
    return {
      submitted_only: data[0].submitted_only,
      needs_manual_only: data[0].needs_manual_only,
      score_only: data[0].score_only,
      feedback_only: data[0].feedback_only,
    };
  },
  async saveFilterPreference(
    quizId: string,
    payload: { submitted_only: boolean; needs_manual_only: boolean; score_only: boolean; feedback_only: boolean }
  ) {
    const { data } = await api.post('/api/quizzes/filters/', { quiz: quizId, ...payload });
    return data;
  },
};
