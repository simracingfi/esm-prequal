// iRacing stores laptimes in integer 1/10 milliseconds, but we want to display
// them in seconds with 3 decimals.  First round to nearest 1/10 ms, then
// truncate to milliseconds with epsilon to avoid displaying 1.003 as 1.002.
const TRUNCATION_EPSILON = 0.00001;
export function truncToMillis(seconds: number): number {
  return Math.floor(Math.round(seconds * 10000) / 10 + TRUNCATION_EPSILON) / 1000;
}
