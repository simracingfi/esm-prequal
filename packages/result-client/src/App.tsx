import { useState } from "react";
import { CompetitionPicker } from "./components/CompetitionPicker";
import { StandingsTable } from "./components/StandingsTable";
import { LaptimesTable } from "./components/LaptimesTable";

type View = "standings" | "laptimes";

export function App() {
  const [competition, setCompetition] = useState<string | null>(null);
  const [view, setView] = useState<View>("standings");

  return (
    <div className="content">
      <img
        src="https://simracing.fi/kuvat/logo_FISRA_plaincolor.png"
        alt="FiSRA logo"
        style={{ height: "80px", float: "right" }}
      />
      <h1>eSM esikarsinta - reaaliaikainen tulospalvelu</h1>
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
              Tulokset
            </button>{" "}
            <button
              onClick={() => setView("laptimes")}
              disabled={view === "laptimes"}
            >
              Kaikki kierrokset
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
