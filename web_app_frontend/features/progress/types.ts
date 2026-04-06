export interface ProgressGoal {
  label: string;
  value: number;
  target: number;
}

export interface ProgressSnapshot {
  completionRate: number;
  attendanceRate: number;
  onTimeSubmissions: number;
  streakWeeks: number;
  goals: ProgressGoal[];
}
