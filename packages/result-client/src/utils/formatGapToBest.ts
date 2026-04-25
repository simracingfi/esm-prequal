import { formatTime } from "./formatTime";
import { truncToMillis } from "./truncToMillis";

function isLaptime(value: any): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value) && value >= 0;
}

export function formatGapToBest(time: number | null, bestTime: number | null): string {
  if (!isLaptime(time) || !isLaptime(bestTime)) return "-";
  return '+' + formatTime(truncToMillis(time) - truncToMillis(bestTime));
}