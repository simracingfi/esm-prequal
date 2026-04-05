import { useState } from "react";
import { CompetitionPicker } from "./components/CompetitionPicker";
import { StandingsTable } from "./components/StandingsTable";
import { LaptimesTable } from "./components/LaptimesTable";

type View = "standings" | "laptimes";

export function App() {
  const [competition, setCompetition] = useState<string | null>(null);
  const [view, setView] = useState<View>("standings");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
      <h1>eSM Prequal - Live Timing</h1>
      <div style={{ marginBottom: "1rem" }}>
        <CompetitionPicker selected={competition} onSelect={setCompetition} />
      </div>
      {competition && (
        <>
          <nav style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => setView("standings")}
              disabled={view === "standings"}
            >
              Standings
            </button>{" "}
            <button
              onClick={() => setView("laptimes")}
              disabled={view === "laptimes"}
            >
              All Laps
            </button>
          </nav>
          {view === "standings" ? (
            <StandingsTable competition={competition} />
          ) : (
            <LaptimesTable competition={competition} />
          )}
        </>
      )}
    </div>
  );
}
