import type { Laptime, LaptimeRow, StandingEntry } from "./types";

const DEFENDING_CHAMPION = { driverId: 222130, driverName: "Matti Kaidesoja" };
const DEFENDING_CHAMPION_MAX_INDEX = 26;


async function getDriverNameOverrides(
  db: D1Database,
  driverIds: number[]
): Promise<Map<number, string>> {
  if (driverIds.length === 0) return new Map();
  const placeholders = driverIds.map(() => "?").join(", ");
  const { results } = await db
    .prepare(`SELECT driver_id, driver_name FROM drivers WHERE driver_id IN (${placeholders})`)
    .bind(...driverIds)
    .all<{ driver_id: number; driver_name: string }>();
  return new Map(results.map((r) => [r.driver_id, r.driver_name]));
}

export async function insertLaptimes(
  db: D1Database,
  competition: string,
  laptimes: Laptime[]
): Promise<number> {
  const uniqueIds = [...new Set(laptimes.map((lt) => lt.driverId))];
  const overrides = await getDriverNameOverrides(db, uniqueIds);

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO laptimes (driver_id, driver_name, session_id, competition, lap_number, lap_time)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const batch = laptimes.map((lt) =>
    stmt.bind(
      lt.driverId,
      overrides.get(lt.driverId) ?? lt.driverName,
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
              sub.lap_count, sub.max_lap, MAX(l.created_at) as best_time_at
       FROM laptimes l
       JOIN (
         SELECT driver_id, MIN(lap_time) as best_time, COUNT(*) as lap_count,
                MAX(CASE WHEN lap_number > 0 THEN lap_number END) as max_lap
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
    .all<{ driver_id: number; driver_name: string; best_time: number | null; lap_count: number; max_lap: number | null; best_time_at: string }>();

  const standings: StandingEntry[] = results.map((r) => ({
    driverId: r.driver_id,
    driverName: r.driver_name,
    bestTime: r.best_time,
    lapCount: r.lap_count,
    bestTimeAt: r.best_time_at,
    flag: r.max_lap == null ? null
        : r.max_lap >= 4   ? "chequered"
        : r.max_lap === 3  ? "white"
        :                    "green",
  }));

  // Enforce defending champion at position ≤ 27 (index 26)
  const champIdx = standings.findIndex((s) => s.driverId === DEFENDING_CHAMPION.driverId);

  if (champIdx === -1) {
    // Not in standings, add entry at max index or the end if standings list is shorter.
    standings.splice(Math.min(DEFENDING_CHAMPION_MAX_INDEX, standings.length), 0, {
      driverId: DEFENDING_CHAMPION.driverId,
      driverName: DEFENDING_CHAMPION.driverName,
      bestTime: null,
      lapCount: 0,
      bestTimeAt: "",
      flag: null,
      defendingChampion: true,
    });
  } else if (champIdx > DEFENDING_CHAMPION_MAX_INDEX) {
    // Move up to max index and tag as champ.
    const [champ] = standings.splice(champIdx, 1);
    champ.defendingChampion = true;
    standings.splice(DEFENDING_CHAMPION_MAX_INDEX, 0, champ);
  } else {
    // Already high enough, just tag the champ.
    standings[champIdx].defendingChampion = true;
  }

  return standings;
}

export async function getDrivers(
  db: D1Database
): Promise<{ driverId: number; driverName: string }[]> {
  // Latest name from laptimes, overridden by drivers table when present
  const { results } = await db
    .prepare(
      `SELECT COALESCE(d.driver_id, l.driver_id) AS driver_id, COALESCE(d.driver_name, l.driver_name) AS driver_name
       FROM (
         SELECT driver_id, driver_name
         FROM laptimes
         WHERE id IN (SELECT MAX(id) FROM laptimes GROUP BY driver_id)
       ) l
       FULL OUTER JOIN drivers d ON d.driver_id = l.driver_id
       ORDER BY driver_name ASC`
    )
    .all<{ driver_id: number; driver_name: string }>();
  return results.map((r) => ({ driverId: r.driver_id, driverName: r.driver_name }));
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
