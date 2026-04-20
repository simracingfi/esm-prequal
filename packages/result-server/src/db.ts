import type { Laptime, LaptimeRow, StandingEntry } from "./types";

export async function insertLaptimes(
  db: D1Database,
  competition: string,
  laptimes: Laptime[]
): Promise<number> {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO laptimes (driver_id, driver_name, session_id, competition, lap_number, lap_time)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const batch = laptimes.map((lt) =>
    stmt.bind(
      lt.driverId,
      lt.driverName,
      lt.sessionId,
      competition,
      lt.lapNumber,
      lt.lapTime
    )
  );

  const results = await db.batch(batch);
  return results.reduce(
    (sum, r) => sum + (r.meta.changes ?? 0),
    0
  );
}

export async function getLaptimes(
  db: D1Database,
  competition: string
): Promise<LaptimeRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, driver_id, driver_name, session_id, competition, lap_number, lap_time, created_at
       FROM laptimes WHERE competition = ? ORDER BY created_at ASC`
    )
    .bind(competition)
    .all<LaptimeRow>();
  return results;
}

export async function getCompetitions(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare(`SELECT DISTINCT competition FROM laptimes ORDER BY competition ASC`)
    .all<{ competition: string }>();
  return results.map((r) => r.competition);
}

export async function getStandings(
  db: D1Database,
  competition: string
): Promise<StandingEntry[]> {
  // Join condition includes lap_time IS NULL to include participated drivers with no valid laps.
  // Results are ordered with NULLs (no time) last, and within non-NULLs by ascending time.
  const { results } = await db
    .prepare(
      `SELECT l.driver_id, l.driver_name, l.lap_time as best_time,
              sub.lap_count, MAX(l.created_at) as best_time_at
       FROM laptimes l
       JOIN (
         SELECT driver_id, MIN(lap_time) as best_time, COUNT(*) as lap_count
         FROM laptimes
         WHERE competition = ?
         GROUP BY driver_id
       ) sub ON l.driver_id = sub.driver_id AND (
                  l.lap_time = sub.best_time OR (
                    l.lap_time IS NULL AND sub.best_time IS NULL
                  )
                )
       WHERE l.competition = ?
       GROUP BY l.driver_id
       ORDER BY best_time IS NULL ASC, best_time ASC`
    )
    .bind(competition, competition)
    .all<{ driver_id: number; driver_name: string; best_time: number; lap_count: number; best_time_at: string }>();

  return results.map((r) => ({
    driverId: r.driver_id,
    driverName: r.driver_name,
    bestTime: r.best_time,
    lapCount: r.lap_count,
    bestTimeAt: r.best_time_at,
  }));
}

export async function getSessions(
  db: D1Database,
  competition: string
): Promise<number[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT session_id FROM laptimes WHERE competition = ? ORDER BY session_id ASC`
    )
    .bind(competition)
    .all<{ session_id: number }>();
  return results.map((r) => r.session_id);
}
