const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface LaptimeRow {
  id: number;
  driver_id: number;
  driver_name: string;
  session_id: number;
  competition: string;
  lap_number: number;
  lap_time: number | null;
  created_at: string;
}

export interface StandingEntry {
  driverId: number;
  driverName: string;
  bestTime: number | null;
  lapCount: number;
  bestTimeAt: string;
  defendingChampion?: boolean;
}

export async function fetchCompetitions(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/competitions`);
  const data = await res.json();
  return data.competitions;
}

export async function fetchLaptimes(competition: string): Promise<LaptimeRow[]> {
  const res = await fetch(
    `${BASE_URL}/api/laptimes?competition=${encodeURIComponent(competition)}`
  );
  const data = await res.json();
  return data.laptimes;
}

export async function fetchStandings(competition: string): Promise<StandingEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/standings?competition=${encodeURIComponent(competition)}`
  );
  const data = await res.json();
  return data.standings;
}
