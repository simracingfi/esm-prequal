import { useCallback } from "react";
import { fetchStandings, type StandingEntry } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { formatTime } from "../api/formatTime";

function getHeat(position: number, total: number): string {
  if (position <= 27) return "A";

  const R = total - 27;
  const p = position - 27; // 1-indexed within drivers after group A

  if (R <= 25) {
    return "B";
  } else if (R <= 47) {
    // B (intermediate) + C (last), equal race sizes
    const qB = Math.floor((R - 3) / 2);
    return p <= qB ? "B" : "C";
  } else if (R <= 69) {
    // B, C (intermediate) + D (last), equal race sizes
    const q = Math.floor((R - 3) / 3);
    if (p <= q) return "B";
    if (p <= 2 * q) return "C";
    return "D";
  }
  return "Ei erää";
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

  if (loading) return <div>Ladataan tuloksia...</div>;
  if (error) return <div>Virhe: {error}</div>;
  if (!standings || standings.length === 0) {
    return <div>Ei vielä tuloksia.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Sija</th>
          <th>Kuljettaja</th>
          <th>Paras aika</th>
          <th>Ero kärkeen</th>
          <th>Erä</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((entry: StandingEntry, i: number) => (
          <tr key={entry.driverId}>
            <td>{i + 1}</td>
            <td>{entry.driverName}</td>
            <td>{formatTime(entry.bestTime)}</td>
            <td>{i === 0 ? "-" : `+${(entry.bestTime - standings[0].bestTime).toFixed(3)}`}</td>
            <td>{getHeat(i + 1, standings.length)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
