import { useCallback } from "react";
import { fetchLaptimes, type LaptimeRow } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { formatTime } from "../utils/formatTime";

interface Props {
  competition: string;
}

export function LaptimesTable({ competition }: Props) {
  const fetcher = useCallback(
    () => fetchLaptimes(competition),
    [competition]
  );
  const { data: laptimes, loading, error } = usePolling(fetcher);

  if (loading) return <div>Ladataan kierrosaikoja...</div>;
  if (error) return <div>Virhe: {error}</div>;
  if (!laptimes || laptimes.length === 0) {
    return <div>Ei vielä kierrosaikoja.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Kuljettaja</th>
          <th>Sessio</th>
          <th>Kierros</th>
          <th>Aika</th>
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
