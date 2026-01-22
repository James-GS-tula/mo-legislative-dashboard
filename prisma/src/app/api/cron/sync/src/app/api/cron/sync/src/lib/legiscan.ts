export async function legiscan(op: string, params: Record<string, any>) {
  const key = process.env.LEGISCAN_API_KEY;
  if (!key) throw new Error("Missing LEGISCAN_API_KEY");

  const url = new URL("https://api.legiscan.com/");
  url.searchParams.set("key", key);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
  const json = await res.json();

  if (json?.status !== "OK") {
    const msg = json?.alert?.message || "Unknown LegiScan error";
    throw new Error(msg);
  }
  return json;
}

export function normalizeChamber(raw: any): "house" | "senate" {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("sen") || s === "s") return "senate";
  return "house";
}

export function computePassFlags(history: any[] | undefined) {
  let passedHouse = false;
  let passedSenate = false;

  for (const h of history || []) {
    const action = String(h.action || "").toLowerCase();
    const chamber = String(h.chamber || "").toLowerCase();

    const looksPassed =
      action.includes("passed") ||
      action.includes("third read") ||
      action.includes("truly agreed") ||
      action.includes("finally passed");

    if (!looksPassed) continue;

    if (chamber.includes("h")) passedHouse = true;
    if (chamber.includes("s")) passedSenate = true;
  }

  return { passedHouse, passedSenate };
}
