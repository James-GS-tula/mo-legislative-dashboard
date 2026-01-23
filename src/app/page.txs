"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Home() {
  const [stats, setStats] = useState<any>(null);

  const embed =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ error: true }));
  }, []);

  const partyData = useMemo(() => {
    if (!stats?.byParty) return [];
    return Object.entries(stats.byParty).map(([party, v]: any) => ({
      party,
      total: v.total,
      houseOrigin: v.houseOrigin,
      senateOrigin: v.senateOrigin,
    }));
  }, [stats]);

  const chamberData = useMemo(() => {
    if (!stats?.byChamber) return [];
    return stats.byChamber.map((x: any) => ({
      chamber: x.chamberOrigin,
      count: x._count._all,
    }));
  }, [stats]);

  const containerStyle: React.CSSProperties = {
    padding: embed ? 12 : 24,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    maxWidth: 1200,
    margin: "0 auto",
  };

  if (!stats) return <main style={containerStyle}>Loading…</main>;

  if (stats?.error) {
    return (
      <main style={containerStyle}>
        <h2>MO Legislative Dashboard</h2>
        <p>Could not load stats. Make sure the database is connected and sync has run.</p>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      {!embed && <h1 style={{ margin: "0 0 12px" }}>MO Legislative Dashboard</h1>}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: "0 0 8px" }}>{embed ? "MO Legislative Dashboard" : "Overview"}</h2>
        <div style={{ opacity: 0.7 }}>
          Last updated: {stats?.updatedAt ? new Date(stats.updatedAt).toLocaleString() : "—"}
        </div>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px" }}>Bills by Origin Chamber</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chamberData}>
              <XAxis dataKey="chamber" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 8px" }}>Filed by Party (Primary Sponsor)</h3>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={partyData}>
              <XAxis dataKey="party" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" />
              <Bar dataKey="houseOrigin" />
              <Bar dataKey="senateOrigin" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 8px" }}>Chamber Passage Counts</h3>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <strong>Passed House:</strong> {stats?.passed?.house ?? 0}
          </div>
          <div>
            <strong>Passed Senate:</strong> {stats?.passed?.senate ?? 0}
          </div>
        </div>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Note: “Passed” flags are inferred from action text; can be tightened to Missouri’s exact phrasing.
        </p>
      </section>
    </main>
  );
}
