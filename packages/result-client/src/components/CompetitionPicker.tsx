import { useCallback } from "react";
import { fetchCompetitions } from "../api/client";
import { usePolling } from "../hooks/usePolling";

interface Props {
  selected: string | null;
  onSelect: (competition: string) => void;
}

export function CompetitionPicker({ selected, onSelect }: Props) {
  const fetcher = useCallback(() => fetchCompetitions(), []);
  const { data: competitions, loading } = usePolling(fetcher, 15*60*1000);

  if (loading) return <div>Ladataan kilpailuja...</div>;
  if (!competitions || competitions.length === 0) {
    return <div>Ei löytynyt kilpailuja.</div>;
  }

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="" disabled>
        Valitse kilpailu
      </option>
      {competitions.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
