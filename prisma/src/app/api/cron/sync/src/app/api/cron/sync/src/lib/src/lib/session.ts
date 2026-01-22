import { legiscan } from "./legiscan";

export async function getCurrentMOSession() {
  const state = process.env.STATE || "MO";
  const data = await legiscan("getSessionList", { state });

  const sessions = (data.sessions || []) as any[];

  const regular = sessions
    .filter((s) => String(s.session_title || "").toLowerCase().includes("regular"))
    .sort((a, b) => (b.year_start ?? 0) - (a.year_start ?? 0));

  return regular[0] ?? sessions[0];
}
