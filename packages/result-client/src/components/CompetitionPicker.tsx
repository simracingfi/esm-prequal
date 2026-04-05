import { useCallback } from "react";
import { fetchCompetitions } from "../api/client";
import { usePolling } from "../hooks/usePolling";

interface Props {
  selected: string | null;
  onSelect: (competition: string) => void;
}

export function CompetitionPicker({ selected, onSelect }: Props) {
  const fetcher = useCallback(() => fetchCompetitions(), []);
  const { data: competitions, loading } = usePolling(fetcher, 10000);

  if (loading) return <div>Loading competitions...</div>;
  if (!competitions || competitions.length === 0) {
    return <div>No competitions found.</div>;
  }

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="" disabled>
        Select competition
      </option>
      {competitions.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
