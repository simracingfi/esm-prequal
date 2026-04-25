import { useCallback, type CSSProperties } from "react";
import { fetchStandings, type StandingEntry } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { formatTime } from "../utils/formatTime";
import { formatGapToBest } from "../utils/formatGapToBest";
import { getHeat } from "../utils/getHeat";

const FLAG_EMOJIS = {
  chequered: "🏁",
  green: "🟢",
  white: "🏳️",
};

const FLAG_DESCRIPTIONS = {
  chequered: "Kaikki kierrokset ajettu, ruutulippu",
  green: "Ajo alkanut, vihreä lippu",
  white: "Viimeinen kierros, valkoinen lippu",
};

function toAgeSeconds(bestTimeAt: string | undefined): number | null {
  if (!bestTimeAt) return null;
  const isoStr = bestTimeAt.includes("T")
    ? bestTimeAt
    : bestTimeAt.replace(" ", "T") + "Z";
  return (Date.now() - new Date(isoStr).getTime()) / 1000;
}

function getFreshnessStyle(bestTimeAt: string | undefined): CSSProperties {
  if (!bestTimeAt) return {};

  const ageSeconds = toAgeSeconds(bestTimeAt);
  const MAX_AGE = 3600; // 1 hour → no highlight
  const PEAK_AGE = 120; // 2 minutes → full highlight
  if (ageSeconds === null || ageSeconds > MAX_AGE) return {};
  const intensity =
    ageSeconds <= PEAK_AGE
      ? 1
      : 1 - (ageSeconds - PEAK_AGE) / (MAX_AGE - PEAK_AGE);
  return {
    backgroundColor: `rgba(51, 122, 183, ${(intensity * 0.5).toFixed(2)})`,
  };
}

interface Props {
  competition: string;
}

export function StandingsTable({ competition }: Props) {
  const fetcher = useCallback(() => fetchStandings(competition), [competition]);
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
          <th></th>
          <th>Ero kärkeen</th>
          <th>Erä</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((entry: StandingEntry, i: number) => (
          <tr key={entry.driverId} style={getFreshnessStyle(entry.bestTimeAt)}>
            <td>{i + 1}</td>
            <td>
              {entry.driverName}
              {entry.defendingChampion && (
                <span
                  title="Puolustava mestari"
                  style={{ color: "gold", marginLeft: "5px" }}
                >
                  🏆
                </span>
              )}
            </td>
            <td>{formatTime(entry.bestTime)}</td>
            <td title={entry.flag ? FLAG_DESCRIPTIONS[entry.flag] : ""}>
              {entry.flag ? FLAG_EMOJIS[entry.flag] : ""}
            </td>
            <td>
              {i === 0
                ? "-"
                : formatGapToBest(entry.bestTime, standings[0].bestTime)}
            </td>
            <td>{getHeat(i + 1, standings.length)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
