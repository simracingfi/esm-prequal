import { truncToMillis } from "./truncToMillis";

export function formatTime(seconds: number | null): string {
  if (seconds === null || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "Ei aikaa";
  const mins = Math.floor(seconds / 60);
  const secs = truncToMillis(seconds % 60);
  return mins > 0
    ? `${mins}:${secs.toFixed(3).padStart(6, "0")}`
    : secs.toFixed(3);
}
