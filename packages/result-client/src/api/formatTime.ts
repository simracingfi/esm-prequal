export function formatTime(seconds: number | null): string {
  if (seconds === null) return "Ei aikaa";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor((seconds % 60) * 1000) / 1000;
  return mins > 0
    ? `${mins}:${secs.toFixed(3).padStart(6, "0")}`
    : secs.toFixed(3);
}
