/**
 * Shared course completion model: lecture average, plus quiz average when the course has quizzes.
 * Keep in sync with dashboard + course player.
 */
export function computeOverallProgress(lectureAvg: number, quizAvg: number, hasQuizzes: boolean) {
  if (!hasQuizzes) return Math.round(lectureAvg);
  return Math.round(lectureAvg * 0.7 + quizAvg * 0.3);
}
