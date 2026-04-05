import { useCallback } from "react";
import { fetchStandings, type StandingEntry } from "../api/client";
import { usePolling } from "../hooks/usePolling";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0
    ? `${mins}:${secs.toFixed(3).padStart(6, "0")}`
    : secs.toFixed(3);
}

interface Props {
  competition: string;
}

export function StandingsTable({ competition }: Props) {
  const fetcher = useCallback(
    () => fetchStandings(competition),
    [competition]
  );
  const { data: standings, loading, error } = usePolling(fetcher);

  if (loading) return <div>Loading standings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!standings || standings.length === 0) {
    return <div>No standings yet.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Driver</th>
          <th>Best Time</th>
          <th>Laps</th>
          <th>Gap</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((entry: StandingEntry, i: number) => (
          <tr key={entry.driverId}>
            <td>{i + 1}</td>
            <td>{entry.driverName}</td>
            <td>{formatTime(entry.bestTime)}</td>
            <td>{entry.lapCount}</td>
            <td>
              {i === 0
                ? "-"
                : `+${(entry.bestTime - standings[0].bestTime).toFixed(3)}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
