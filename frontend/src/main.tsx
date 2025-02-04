import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import IndexPage from "./pages";
import { HashRouter, Route, Routes } from "react-router-dom";
import AnalyzingPage from "./pages/analyzing";
import StatsPage from "./pages/stats";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <HashRouter basename="/">
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="analyzing" element={<AnalyzingPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
