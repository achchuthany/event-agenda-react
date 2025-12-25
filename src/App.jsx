import React from "react";
import AgendaViewer from "./components/AgendaViewer";
import programData from "./data/program.json";

export default function App() {
  return (
    <div className="min-h-screen p-4">
      <AgendaViewer program={programData} />
    </div>
  );
}
