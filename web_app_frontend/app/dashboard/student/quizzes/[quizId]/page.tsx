'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import type { QuizProctorLog } from '@/types';

type ProctorState = 'idle' | 'starting' | 'active' | 'terminated' | 'blocked' | 'ended';

function getDeviceId() {
  if (typeof window === 'undefined') return 'device';
  const key = 'scsit_device_id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.localStorage.setItem(key, generated);
  return generated;
}

function randomInterval(minMs: number, maxMs: number) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function formatCountdown(totalSeconds: number | null, fallbackMinutes?: number) {
  if (totalSeconds === null || Number.isNaN(totalSeconds)) {
    if (fallbackMinutes) return `${fallbackMinutes}:00`;
    return '—';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function StudentQuizTakePage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { data: quiz } = useQuiz(quizId);
  const { data: allAttempts = [] } = useQuizAttempts();
  const [proctorState, setProctorState] = useState<ProctorState>('idle');
  const [warnings, setWarnings] = useState(0);
  const [terminations, setTerminations] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [attemptStartedAt, setAttemptStartedAt] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [precheckOpen, setPrecheckOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { selected_choice_id?: string; text_answer?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [submitReason, setSubmitReason] = useState<string | null>(null);
  const [violationsByAttempt, setViolationsByAttempt] = useState<
    Record<
      string,
      {
        count: number;
        lastDetail?: string | null;
        lastAt?: string | null;
        timeline?: Array<{ id: string; detail?: string | null; created_at: string; snapshots: QuizProctorLog['snapshots'] }>;
      }
    >
  >({});
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const violationsRef = useRef<
    Record<
      string,
      {
        count: number;
        lastDetail?: string | null;
        lastAt?: string | null;
        timeline?: Array<{ id: string; detail?: string | null; created_at: string; snapshots: QuizProctorLog['snapshots'] }>;
      }
    >
  >({});
  const autoSubmitRef = useRef(false);
  const pendingViolationSubmitRef = useRef(false);
  const pendingSubmitReasonRef = useRef<'violation' | 'time' | 'manual' | null>(null);
  const sessionIdRef = useRef('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const faceIntervalRef = useRef<number | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const warningLock = useRef(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);
  const displayMediaRef = useRef<null | ((constraints?: MediaStreamConstraints) => Promise<MediaStream>)>(null);
  const supportNoticeShownRef = useRef(false);

  const ANSWER_STORAGE_KEY = `scsit_quiz_answers_${quizId}`;
  const PENDING_SUBMIT_KEY = `scsit_quiz_pending_${quizId}`;
  const SUBMITTED_KEY = `scsit_quiz_submitted_${quizId}`;
  const SUBMITTED_REASON_KEY = `scsit_quiz_submitted_reason_${quizId}`;

  const quizTitle = quiz?.title ?? 'Quiz';
  const canStart = quiz && quiz.is_available !== false && proctorState === 'idle' && !hasSubmitted;
  const securityLevel = quiz?.security_level ?? 'normal';
  const isStrict = securityLevel === 'strict';
  const attemptsForQuiz = useMemo(() => {
    return allAttempts
      .filter((attempt) => attempt.quiz_id === quizId)
      .sort((a, b) => {
        const aDate = new Date(a.submitted_at ?? a.started_at ?? 0).getTime();
        const bDate = new Date(b.submitted_at ?? b.started_at ?? 0).getTime();
        return bDate - aDate;
      });
  }, [allAttempts, quizId]);
  const latestAttempt = attemptsForQuiz[0];
  const totalPoints = quiz?.total_points ?? 0;
  const hasOpenEnded = useMemo(
    () => Boolean(quiz?.questions?.some((question) => question.question_type === 'essay' || question.question_type === 'identification')),
    [quiz?.questions]
  );
  const shouldAiGrade = Boolean(quiz?.ai_grade_on_submit) && hasOpenEnded;

  const precheck = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        cameraSupported: false,
        fullscreenSupported: false,
        faceDetectorSupported: false,
        secureContext: false,
      };
    }
    return {
      cameraSupported: Boolean(navigator.mediaDevices?.getUserMedia),
      fullscreenSupported: Boolean(document.fullscreenEnabled),
      faceDetectorSupported: 'FaceDetector' in window,
      secureContext: window.isSecureContext,
    };
  }, []);

  const cleanupTimers = () => {
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    if (faceIntervalRef.current) window.clearInterval(faceIntervalRef.current);
    if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    heartbeatRef.current = null;
    faceIntervalRef.current = null;
    snapshotTimerRef.current = null;
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }
    if (displayMediaRef.current && navigator.mediaDevices?.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = displayMediaRef.current;
      displayMediaRef.current = null;
    }
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const captureSnapshot = async (_reason: string) => {
    return;
  };

  const scheduleRandomSnapshot = () => {
    if (!sessionId) return;
    const delay = randomInterval(5 * 60 * 1000, 10 * 60 * 1000);
    snapshotTimerRef.current = window.setTimeout(async () => {
      await captureSnapshot('periodic');
      scheduleRandomSnapshot();
    }, delay);
  };

  const getAnswerSnapshot = () => {
    let snapshot = answers;
    if (!snapshot || Object.keys(snapshot).length === 0) {
      try {
        const stored = window.localStorage.getItem(ANSWER_STORAGE_KEY);
        if (stored) {
          snapshot = JSON.parse(stored) as Record<string, { selected_choice_id?: string; text_answer?: string }>;
        }
      } catch {
        // ignore
      }
    }
    return snapshot || {};
  };

  const issueWarning = async (reason: string, detail?: string) => {
    if (warningLock.current || !sessionIdRef.current) return;
    warningLock.current = true;
    try {
      const snapshot = getAnswerSnapshot();
      const payload = Object.entries(snapshot).map(([question_id, value]) => ({
        question_id,
        selected_choice_id: value.selected_choice_id,
        text_answer: value.text_answer,
      }));
      await quizService.reportViolation({
        session_id: sessionIdRef.current,
        reason,
        detail,
        answers: payload,
        ai_grade: shouldAiGrade,
      });
      setWarnings((prev) => prev + 1);
      setWarningMessage(`Violation detected: ${reason}. Auto-submitting your quiz.`);
      setNoticeOpen(true);
      setProctorState('terminated');
      setSubmitReason('violation');
      pendingSubmitReasonRef.current = 'violation';
      cleanupTimers();
      stopCamera();
      if (!attemptId) {
        pendingViolationSubmitRef.current = true;
      } else if (!autoSubmitRef.current) {
        submitOnExit();
        autoSubmitRef.current = true;
        submitExam({ force: true, reason: 'violation' });
      }
    } finally {
      window.setTimeout(() => {
        warningLock.current = false;
      }, 1000);
    }
  };

  const startMonitoring = () => {
    const deviceId = getDeviceId();
    heartbeatRef.current = window.setInterval(async () => {
      if (!sessionIdRef.current) return;
      try {
        await quizService.logEvent({ session_id: sessionIdRef.current, event_type: 'heartbeat' });
        const status = await quizService.heartbeat({ session_id: sessionIdRef.current, device_id: deviceId });
        setWarnings(status.warnings);
        setTerminations(status.terminations);
        setPenalty(status.penalty_percent);
      } catch {
        // ignore
      }
    }, 30000);

    // camera/snapshot checks disabled per requirement

    const handleVisibility = () => {
      if (document.hidden) issueWarning('Tab switched');
    };
    const handleBlur = () => issueWarning('Window lost focus');
    const handleContextMenu = (event: Event) => {
      if (!isStrict) return;
      event.preventDefault();
      issueWarning('Right click blocked');
    };
    const handleCopy = (event: Event) => {
      if (!isStrict) return;
      event.preventDefault();
      issueWarning('Copy blocked');
    };
    const handlePaste = (event: Event) => {
      if (!isStrict) return;
      event.preventDefault();
      issueWarning('Paste blocked');
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (!isStrict) return;
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      if (key === 'f12') {
        event.preventDefault();
        issueWarning('Developer tools blocked');
      }
      if (ctrl && event.shiftKey && (key === 'i' || key === 'j')) {
        event.preventDefault();
        issueWarning('Developer tools blocked');
      }
      if (ctrl && key === 'u') {
        event.preventDefault();
        issueWarning('View source blocked');
      }
      if (ctrl && key === 'p') {
        event.preventDefault();
        issueWarning('Print blocked');
      }
      if (ctrl && (key === 't' || key === 'n' || key === 'w')) {
        event.preventDefault();
        issueWarning('Tab or window shortcut blocked');
      }
      if (key === 'printscreen') {
        event.preventDefault();
        issueWarning('Screenshot blocked');
      }
    };
    const handleFullscreen = () => {
      if (!isStrict) return;
      if (!document.fullscreenElement) {
        issueWarning('Exited fullscreen');
        window.setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => null);
        }, 100);
      }
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      issueWarning('Attempted to leave exam');
    };
    const handlePageHide = () => {
      if (!sessionIdRef.current) return;
      submitOnExit();
      const payload = JSON.stringify({ session_id: sessionIdRef.current, reason: 'pagehide' });
      navigator.sendBeacon('/api/quizzes/proctor/end/', payload);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    if (isStrict && navigator.mediaDevices?.getDisplayMedia) {
      const original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      displayMediaRef.current = original;
      navigator.mediaDevices.getDisplayMedia = async () => {
        issueWarning('Screen recording blocked');
        throw new DOMException('Screen recording blocked', 'NotAllowedError');
      };
    }

    listenerCleanupRef.current = () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  };

  const startExam = async () => {
    if (!quiz) return;
    if (quiz.is_available === false) {
      setWarningMessage('This quiz is not yet available. Please wait for your teacher to open it.');
      setNoticeOpen(true);
      return;
    }
    if (hasSubmitted) {
      const reasonLabel =
        submitReason === 'violation' ? 'This attempt ended due to a violation.' : submitReason === 'time' ? 'Time expired.' : '';
      showToast({
        title: 'Quiz submitted',
        description: reasonLabel || 'You already submitted this quiz.',
        variant: 'error',
      });
      return;
    }
    setProctorState('starting');
    try {
      if (isStrict && !document.fullscreenEnabled) {
        throw new Error('Fullscreen is not supported in this browser.');
      }
      if (isStrict) {
        await document.documentElement.requestFullscreen();
      }
      setCameraReady(false);
      const deviceId = getDeviceId();
      const session = await quizService.startProctor(quiz.id, { device_id: deviceId });
      setSessionId(session.session_id);
      sessionIdRef.current = session.session_id;
      setWarnings(session.warnings);
      setTerminations(session.terminations);
      setPenalty(session.penalty_percent);
      const attempt = await quizService.createAttempt(quiz.id);
      setAttemptId(attempt.id);
      setAttemptStartedAt(attempt.started_at ?? null);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          `scsit_quiz_attempt_${quizId}`,
          JSON.stringify({ attemptId: attempt.id, startedAt: attempt.started_at })
        );
      }
      setProctorState('active');
      await quizService.logEvent({ session_id: session.session_id, event_type: 'start', detail: 'Proctoring started' });
      await captureSnapshot('start');
      startMonitoring();
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message;
      const lower = String(apiError || '').toLowerCase();
      if (lower.includes('attempt limit') || lower.includes('already submitted') || lower.includes('submitted')) {
        setHasSubmitted(true);
        try {
          window.localStorage.setItem(SUBMITTED_KEY, '1');
          if (submitReason) {
            window.localStorage.setItem(SUBMITTED_REASON_KEY, submitReason);
          }
        } catch {
          // ignore
        }
        showToast({
          title: 'Quiz already submitted',
          description: 'You can no longer take this quiz.',
          variant: 'error',
        });
        setProctorState('idle');
        return;
      }
      showToast({ title: 'Unable to start quiz', description: apiError ?? 'Unable to start quiz.', variant: 'error' });
      setWarningMessage(apiError ?? 'Unable to start quiz.');
      setNoticeOpen(true);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setNoticeOpen(false), 3500);
      setProctorState('idle');
      stopCamera();
    }
  };

  const endExam = async (reason = 'ended') => {
    cleanupTimers();
    stopCamera();
    setAttemptStartedAt(null);
    if (sessionIdRef.current) {
      try {
        await quizService.endProctor({ session_id: sessionIdRef.current, reason });
        await quizService.logEvent({ session_id: sessionIdRef.current, event_type: 'end', detail: reason });
      } catch {
        // ignore
      }
    }
    setProctorState('ended');
    setSessionId('');
    sessionIdRef.current = '';
  };

  const handleAnswerChange = (questionId: string, value: { selected_choice_id?: string; text_answer?: string }) => {
    if (timeExpired) return;
    if (hasSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitOnExit = () => {
    if (!attemptId) return;
    const answerSnapshot = getAnswerSnapshot();
    const payload = JSON.stringify({
      answers: Object.entries(answerSnapshot || {}).map(([question_id, value]) => ({
        question_id,
        selected_choice_id: value.selected_choice_id,
        text_answer: value.text_answer,
      })),
      ai_grade: shouldAiGrade,
    });
    const url = `/api/quizzes/attempts/${attemptId}/submit/`;
    try {
      const ok = navigator.sendBeacon && navigator.sendBeacon(url, payload);
      if (!ok) {
        fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      }
      navigator.sendBeacon?.(
        '/api/quizzes/proctor/event/',
        JSON.stringify({ session_id: sessionIdRef.current, event_type: 'auto_submit_exit', detail: 'Tab closed' })
      );
    } catch {
      // ignore
    }
    try {
      window.localStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify({ attemptId, answers: answerSnapshot }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!quiz?.time_limit_minutes || !sessionId || proctorState !== 'active' || !attemptStartedAt) return;
    const startedAtMs = new Date(attemptStartedAt).getTime();
    const totalMs = quiz.time_limit_minutes * 60 * 1000;
    setTimeExpired(false);
    autoSubmitRef.current = false;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, startedAtMs + totalMs - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          setTimeExpired(true);
          setWarningMessage('Time is up. You can only submit now.');
          setNoticeOpen(true);
          pendingSubmitReasonRef.current = 'time';
          if (!autoSubmitRef.current && attemptId) {
            autoSubmitRef.current = true;
            submitExam({ force: true, reason: 'time' });
          }
          window.clearInterval(timer);
        }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quiz?.time_limit_minutes, sessionId, proctorState, attemptId, attemptStartedAt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(ANSWER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, { selected_choice_id?: string; text_answer?: string }>;
        if (parsed && Object.keys(parsed).length > 0) {
          setAnswers(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [ANSWER_STORAGE_KEY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(SUBMITTED_KEY)) {
        setHasSubmitted(true);
      }
      const storedReason = window.localStorage.getItem(SUBMITTED_REASON_KEY);
      if (storedReason) {
        setSubmitReason(storedReason);
      }
      const savedAttempt = window.localStorage.getItem(`scsit_quiz_attempt_${quizId}`);
      if (savedAttempt) {
        const parsed = JSON.parse(savedAttempt) as { attemptId?: string; startedAt?: string };
        if (parsed?.attemptId && !attemptId) {
          setAttemptId(parsed.attemptId);
        }
        if (parsed?.startedAt && !attemptStartedAt) {
          setAttemptStartedAt(parsed.startedAt);
        }
      }
    } catch {
      // ignore
    }
  }, [quizId, attemptId, attemptStartedAt]);

  useEffect(() => {
    if (!quiz?.id || attemptStartedAt) return;
    quizService
      .listAttemptsForQuiz(quiz.id)
      .then((attempts) => {
        const pending = attempts.find((attempt) => !attempt.submitted_at);
        const submitted = attempts.find((attempt) => Boolean(attempt.submitted_at));
        if (pending) {
          setAttemptId(pending.id);
          setAttemptStartedAt(pending.started_at);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `scsit_quiz_attempt_${quizId}`,
              JSON.stringify({ attemptId: pending.id, startedAt: pending.started_at })
            );
          }
        } else if (submitted) {
          setHasSubmitted(true);
        }
      })
      .catch(() => undefined);
  }, [quiz?.id, attemptStartedAt, quizId]);

  useEffect(() => {
    if (!attemptId) return;
    if (!pendingViolationSubmitRef.current) return;
    if (autoSubmitRef.current) return;
    pendingViolationSubmitRef.current = false;
    autoSubmitRef.current = true;
    submitOnExit();
    submitExam({ force: true, reason: pendingSubmitReasonRef.current ?? 'violation' });
  }, [attemptId]);

  useEffect(() => {
    if (!pendingViolationSubmitRef.current) return;
    const timeout = window.setTimeout(() => {
      if (attemptId && !autoSubmitRef.current) {
        pendingViolationSubmitRef.current = false;
        autoSubmitRef.current = true;
        submitOnExit();
        submitExam({ force: true, reason: pendingSubmitReasonRef.current ?? 'violation' });
      }
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [attemptId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ANSWER_STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // ignore
    }
  }, [ANSWER_STORAGE_KEY, answers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOffline = () => {
      setWarningMessage('You are offline. Answers are saved and will submit when back online.');
      setNoticeOpen(true);
    };
    const handleOnline = async () => {
      try {
        const pending = window.localStorage.getItem(PENDING_SUBMIT_KEY);
        if (!pending) return;
        const payload = JSON.parse(pending) as { attemptId?: string; answers?: Record<string, any> };
        if (payload?.attemptId && payload?.answers) {
          const submitResult = await quizService.submitAttempt(
            payload.attemptId,
            Object.entries(payload.answers).map(([question_id, value]) => ({
              question_id,
              ...(value as { selected_choice_id?: string; text_answer?: string }),
            })),
            { ai_grade: shouldAiGrade }
          );
          if (submitResult.ai_grade_applied) {
            showToast({ title: 'AI grading applied', description: 'Open-ended answers were graded by AI.', variant: 'success' });
          }
          if (submitResult.ai_grade_failed) {
            showToast({
              title: 'AI grading unavailable',
              description: 'AI grading failed. Your teacher can still grade manually.',
              variant: 'error',
            });
          }
          window.localStorage.removeItem(PENDING_SUBMIT_KEY);
          setWarningMessage('Submission synced after reconnecting.');
          setNoticeOpen(true);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [PENDING_SUBMIT_KEY, shouldAiGrade]);

  useEffect(() => {
    if (supportNoticeShownRef.current) return;
    if (!quiz) return;
    supportNoticeShownRef.current = true;
    const warnings: string[] = [];
    if (!document.fullscreenEnabled) warnings.push('Fullscreen is not supported in this browser.');
    if (!isStrict) warnings.push('This quiz is in normal security mode (basic checks only).');
    if (warnings.length) {
      setWarningMessage(warnings.join(' '));
      setNoticeOpen(true);
    }
  }, [quiz, isStrict]);

  const submitExam = async (options?: { force?: boolean; redirect?: boolean; reason?: 'violation' | 'manual' | 'time' }) => {
    if (!attemptId || (hasSubmitted && !options?.force)) {
      showToast({
        title: 'Quiz not started',
        description: hasSubmitted ? 'You already submitted this quiz.' : 'Start the quiz first.',
        variant: 'error',
      });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        window.localStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify({ attemptId, answers }));
      } catch {
        // ignore
      }
      setWarningMessage('You are offline. Answers saved and will submit when back online.');
      setNoticeOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const answerSnapshot = getAnswerSnapshot();
      const payload = Object.entries(answerSnapshot || {}).map(([question_id, value]) => ({
        question_id,
        selected_choice_id: value.selected_choice_id,
        text_answer: value.text_answer,
      }));
      await quizService.logEvent({ session_id: sessionIdRef.current, event_type: 'submit', detail: 'Student submitted quiz' });
      const submitResult = await quizService.submitAttempt(attemptId, payload, { ai_grade: shouldAiGrade });
      await endExam('submitted');
      setHasSubmitted(true);
      if (options?.reason) {
        setSubmitReason(options.reason);
      }
      try {
        window.localStorage.setItem(SUBMITTED_KEY, '1');
        if (options?.reason) {
          window.localStorage.setItem(SUBMITTED_REASON_KEY, options.reason);
        }
      } catch {
        // ignore
      }
      try {
        window.localStorage.removeItem(PENDING_SUBMIT_KEY);
        window.localStorage.removeItem(ANSWER_STORAGE_KEY);
        window.localStorage.removeItem(`scsit_quiz_attempt_${quizId}`);
      } catch {
        // ignore
      }
      showToast({ title: 'Quiz submitted', description: 'Your answers were saved.', variant: 'success' });
      if (submitResult.ai_grade_applied) {
        showToast({ title: 'AI grading applied', description: 'Open-ended answers were graded by AI.', variant: 'success' });
      }
      if (submitResult.ai_grade_failed) {
        showToast({
          title: 'AI grading unavailable',
          description: 'AI grading failed. Your teacher can still grade manually.',
          variant: 'error',
        });
      }
      if (options?.redirect !== false) {
        router.push('/dashboard/student/quizzes');
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message;
      const lower = String(apiError || '').toLowerCase();
      if (lower.includes('already submitted')) {
        setHasSubmitted(true);
        try {
          window.localStorage.setItem(SUBMITTED_KEY, '1');
          if (options?.reason) {
            window.localStorage.setItem(SUBMITTED_REASON_KEY, options.reason);
          }
        } catch {
          // ignore
        }
        showToast({ title: 'Quiz submitted', description: 'Your submission is already saved.', variant: 'success' });
        router.push('/dashboard/student/quizzes');
        return;
      }
      showToast({ title: 'Submission failed', description: apiError ?? 'Unable to submit quiz.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanupTimers();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    const loadViolations = async () => {
      if (attemptsForQuiz.length === 0) return;
      const missing = attemptsForQuiz.filter((attempt) => violationsRef.current[attempt.id] === undefined);
      if (missing.length === 0) return;
      setIsLoadingViolations(true);
      try {
        const results = await Promise.all(
          missing.map(async (attempt) => {
            try {
              const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
              const eventsWithContext =
                logs?.flatMap((log) =>
                  (log.events ?? [])
                    .filter((event) => event.type === 'violation')
                    .map((event) => ({
                      id: event.id,
                      detail: event.detail,
                      created_at: event.created_at,
                      snapshots: log.snapshots ?? [],
                    }))
                ) ?? [];
              const count = eventsWithContext.length;
              const lastEvent = eventsWithContext.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];
              return {
                id: attempt.id,
                count,
                lastDetail: lastEvent?.detail ?? null,
                lastAt: lastEvent?.created_at ?? null,
                timeline: eventsWithContext,
              };
            } catch {
              return { id: attempt.id, count: 0, lastDetail: null, lastAt: null, timeline: [] };
            }
          })
        );
        if (!active) return;
        setViolationsByAttempt((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            next[item.id] = {
              count: item.count,
              lastDetail: item.lastDetail,
              lastAt: item.lastAt,
              timeline: item.timeline ?? [],
            };
          });
          return next;
        });
      } catch {
        // ignore
      } finally {
        if (active) {
          setIsLoadingViolations(false);
        }
      }
    };
    loadViolations();
    return () => {
      active = false;
    };
  }, [attemptsForQuiz, quizId]);

  useEffect(() => {
    violationsRef.current = violationsByAttempt;
  }, [violationsByAttempt]);

  return (
    <AppShell title="Student Dashboard" subtitle="Quiz" navItems={studentNav} requiredRole="student" minimal>
      <div className="space-y-6">
        <PageHeader
          title={quizTitle}
          description="This quiz uses proctoring. Stay in fullscreen and avoid switching tabs."
          actions={
            <div className="flex items-center gap-2">
              {quiz?.time_limit_minutes ? (
                <Badge variant="outline">Time left: {formatCountdown(timeLeft, quiz.time_limit_minutes)}</Badge>
              ) : null}
              <Badge variant="outline">Security: {securityLevel}</Badge>
              {latestAttempt && typeof violationsByAttempt[latestAttempt.id]?.count === 'number' ? (
                <Badge className="border border-rose-200 bg-rose-50 text-rose-700">
                  Violations {violationsByAttempt[latestAttempt.id]?.count ?? 0}
                </Badge>
              ) : isLoadingViolations ? (
                <Badge variant="outline">Violations…</Badge>
              ) : null}
            </div>
          }
        />
        {latestAttempt ? (
          <Card className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Latest submission</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 text-sm text-neutral-600">
              <div className="space-y-2">
                <div className="text-xs text-neutral-500">
                  {latestAttempt.submitted_at
                    ? `Submitted ${new Date(latestAttempt.submitted_at).toLocaleString()}`
                    : 'In progress'}
                </div>
                {latestAttempt.feedback ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Teacher feedback</div>
                    <div className="mt-1 whitespace-pre-wrap">{latestAttempt.feedback}</div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">No feedback yet.</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-neutral-600">Score</div>
                <div className="text-2xl font-semibold text-neutral-900">
                  {latestAttempt.score ?? 0} / {totalPoints}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {attemptsForQuiz.length > 0 ? (
          <Card className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>Your submissions</CardTitle>
              <Button as={Link} size="sm" variant="outline" href="/dashboard/student/quizzes/attempts">
                View all attempts
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              {attemptsForQuiz.map((attempt) => (
                <div key={attempt.id} className="rounded-2xl border border-neutral-200/70 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-neutral-500">
                        {attempt.submitted_at
                          ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}`
                          : 'In progress'}
                      </div>
                      {attempt.feedback ? (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Teacher feedback</div>
                          <div className="mt-1 whitespace-pre-wrap">{attempt.feedback}</div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-neutral-500">No feedback yet.</div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span
                          className={`rounded-full border px-2 py-0.5 ${
                            (violationsByAttempt[attempt.id]?.count ?? 0) > 0
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-neutral-200 bg-neutral-50'
                          }`}
                        >
                          Violations:{' '}
                          {isLoadingViolations && violationsByAttempt[attempt.id] === undefined
                            ? '…'
                            : violationsByAttempt[attempt.id]?.count ?? 0}
                        </span>
                        <Button as={Link} size="sm" variant="outline" href="/dashboard/student/quizzes/attempts">
                          Jump to review
                        </Button>
                      </div>
                      {violationsByAttempt[attempt.id]?.timeline?.length ? (
                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/80 p-2 text-[11px] text-rose-700">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-rose-500">Violation timeline</div>
                          <div className="mt-2 space-y-2">
                            {violationsByAttempt[attempt.id]?.timeline?.map((event, index) => (
                              <div key={`${event.id}-${index}`} className="rounded-md border border-rose-200/70 bg-rose-50 p-2">
                                <div className="font-semibold text-rose-700">Violation</div>
                                <div className="mt-1">{event.detail ?? 'Violation recorded.'}</div>
                                <div className="mt-1 text-[10px] text-rose-400">
                                  {new Date(event.created_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-neutral-600">Score</div>
                      <div className="text-2xl font-semibold text-neutral-900">
                        {attempt.score ?? 0} / {totalPoints}
                      </div>
                    </div>
                  </div>
                  {attempt.answers && attempt.answers.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-semibold text-neutral-700">Per-question feedback</div>
                      {attempt.answers.map((answer) => (
                        <div key={answer.id} className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-3 text-xs">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                            {answer.question_type ?? 'Question'}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900">{answer.question_text ?? 'Answer'}</div>
                          <div className="mt-1 text-neutral-700">
                            {answer.selected_choice_text ?? answer.text_answer ?? 'No answer text'}
                          </div>
                          <div className="mt-2 text-[11px] text-neutral-500">
                            Points: {answer.points_earned ?? 0} / {answer.question_points ?? 0}
                          </div>
                          {answer.feedback ? (
                            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-[11px] text-emerald-900">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Feedback</div>
                              <div className="mt-1 whitespace-pre-wrap">{answer.feedback}</div>
                            </div>
                          ) : (
                            <div className="mt-2 text-[11px] text-neutral-500">No feedback yet.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Quiz room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-600">
              {proctorState === 'active' && quiz?.questions?.length ? (
                quiz.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.35)]"
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question {index + 1}</div>
                    <div className="mt-2 font-semibold text-neutral-900">{question.question_text}</div>
                    <div className="mt-2 text-xs text-neutral-500">{question.points} pts</div>
                    {question.question_type === 'essay' || question.question_type === 'identification' ? (
                      <textarea
                        className={`mt-3 w-full rounded-xl border border-neutral-200/70 bg-white p-3 text-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 ${
                          timeExpired ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                        rows={3}
                        placeholder="Type your answer"
                        value={answers[question.id]?.text_answer ?? ''}
                        onChange={(event) => handleAnswerChange(question.id, { text_answer: event.target.value })}
                        disabled={timeExpired}
                      />
                    ) : (
                      <div className="mt-3 space-y-2">
                        {question.choices?.map((choice) => (
                          <label
                            key={choice.id}
                            className={`flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-sm transition ${
                              timeExpired ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-neutral-200 hover:bg-neutral-50/70'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={choice.id}
                              checked={answers[question.id]?.selected_choice_id === choice.id}
                              onChange={() => handleAnswerChange(question.id, { selected_choice_id: choice.id })}
                              disabled={timeExpired}
                            />
                            <span>{choice.choice_text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Quiz questions will appear here once loaded.
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {proctorState === 'active' ? (
                  <>
                    <Button variant="secondary" onClick={() => endExam('manual_end')}>
                      End exam
                    </Button>
                    <Button onClick={() => submitExam({ reason: 'manual' })} disabled={isSubmitting || hasSubmitted}>
                      {isSubmitting ? 'Submitting…' : 'Submit quiz'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setPrecheckOpen(true)} disabled={!canStart}>
                    {hasSubmitted
                      ? submitReason === 'violation'
                        ? 'Submitted (violation)'
                        : submitReason === 'time'
                        ? 'Submitted (time)'
                        : 'Submitted'
                      : proctorState === 'starting'
                      ? 'Starting…'
                      : 'Start quiz'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
              <CardHeader>
                <CardTitle>Proctoring status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
              {quiz?.time_limit_minutes ? (
                <div className="flex items-center justify-between">
                  <span>Time left</span>
                  <span className="font-semibold text-neutral-900">
                    {timeLeft === null
                      ? `${quiz.time_limit_minutes}:00`
                      : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
                  </span>
                </div>
              ) : null}
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline">{proctorState}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Warnings</span>
                  <span className="font-semibold text-neutral-900">{warnings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Terminations</span>
                  <span className="font-semibold text-neutral-900">{terminations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Penalty</span>
                  <span className="font-semibold text-neutral-900">{penalty}%</span>
                </div>
                <div className="text-xs text-neutral-500">
                  Every 5 warnings triggers a termination. After 3 terminations, the exam is blocked.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Proctoring reminder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-neutral-600">
              Any rule violation auto‑submits your quiz. Strict mode also enforces fullscreen, tab lock, and anti‑switch rules.
            </CardContent>
          </Card>
          </div>
        </div>

        {(proctorState === 'terminated' || proctorState === 'blocked') && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <div className="text-base font-semibold">Exam halted</div>
            <div className="mt-2">{warningMessage}</div>
            {proctorState === 'terminated' ? (
              <Button className="mt-4" onClick={() => router.push('/dashboard/student/quizzes')}>
                Return to quizzes
              </Button>
            ) : null}
          </div>
        )}

        <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exam reminder</DialogTitle>
              <DialogDescription>{warningMessage ?? 'Please follow the exam rules.'}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog open={precheckOpen} onOpenChange={setPrecheckOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pre-check before starting</DialogTitle>
              <DialogDescription>
                {isStrict
                  ? 'Security is strict. Any rule violation will auto-submit your quiz.'
                  : 'Security is normal. Any rule violation will auto-submit your quiz.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between">
                <span>Secure context (HTTPS)</span>
                <Badge variant="outline">{precheck.secureContext ? 'OK' : 'Required'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Fullscreen</span>
                <Badge variant="outline">{precheck.fullscreenSupported ? 'OK' : 'Not supported'}</Badge>
              </div>
              {isStrict && (!precheck.secureContext || !precheck.fullscreenSupported) ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  Your browser does not meet all requirements. The quiz cannot start until these are supported.
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setPrecheckOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPrecheckOpen(false);
                  startExam();
                }}
                disabled={isStrict && (!precheck.secureContext || !precheck.fullscreenSupported)}
              >
                Start quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
