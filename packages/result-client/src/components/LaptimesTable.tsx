import { useCallback } from "react";
import { fetchLaptimes, type LaptimeRow } from "../api/client";
import { usePolling } from "../hooks/usePolling";

function formatTime(seconds: number | null): string {
  if (seconds === null) return "Invalid";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0
    ? `${mins}:${secs.toFixed(3).padStart(6, "0")}`
    : secs.toFixed(3);
}

interface Props {
  competition: string;
}

export function LaptimesTable({ competition }: Props) {
  const fetcher = useCallback(
    () => fetchLaptimes(competition),
    [competition]
  );
  const { data: laptimes, loading, error } = usePolling(fetcher);

  if (loading) return <div>Loading lap times...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!laptimes || laptimes.length === 0) {
    return <div>No lap times yet.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Driver</th>
          <th>Session</th>
          <th>Lap</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {laptimes.map((lt: LaptimeRow) => (
          <tr key={lt.id}>
            <td>{lt.driver_name}</td>
            <td>{lt.session_id}</td>
            <td>{lt.lap_number}</td>
            <td>{formatTime(lt.lap_time)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
