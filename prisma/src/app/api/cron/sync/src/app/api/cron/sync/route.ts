import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { legiscan, normalizeChamber, computePassFlags } from "../../../../lib/legiscan";
import { getCurrentMOSession } from "../../../../lib/session";

const prisma = new PrismaClient();

function checkSecret(req: Request) {
  const url = new URL(req.url);
  const got = url.searchParams.get("secret");
  const need = process.env.CRON_SECRET;
  return Boolean(need && got === need);
}

export async function POST(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const session = await getCurrentMOSession();
  if (!session?.session_id) {
    return NextResponse.json({ ok: false, error: "No MO session found" }, { status: 500 });
  }

  const masterRaw = await legiscan("getMasterListRaw", { id: session.session_id });
  const raw = masterRaw.masterlist || {};

  const items: Array<{ bill_id: number; change_hash: string }> = Object.values(raw).filter(
    (v: any) => v && typeof v === "object" && v.bill_id && v.change_hash
  ) as any;

  const existing = await prisma.bill.findMany({
    where: { sessionId: session.session_id },
    select: { id: true, changeHash: true },
  });
  const hashMap = new Map(existing.map((b) => [b.id, b.changeHash]));

  const changed = items
    .map((i) => ({ id: String(i.bill_id), hash: i.change_hash }))
    .filter((i) => hashMap.get(i.id) !== i.hash);

  let updated = 0;

  for (const c of changed) {
    const billResp = await legiscan("getBill", { id: c.id });
    const b = billResp.bill;
    if (!b) continue;

    const origin = normalizeChamber(b.chamber);
    const history = b.history || [];
    const last = history?.[0];

    const { passedHouse, passedSenate } = computePassFlags(history);

    await prisma.bill.upsert({
      where: { id: String(b.bill_id) },
      create: {
        id: String(b.bill_id),
        state: String(b.state || "MO"),
        sessionId: Number(b.session_id ?? session.session_id),
        sessionName: String(b.session?.session_name || session.session_name || session.session_title || "Unknown"),
        billNumber: String(b.bill_number),
        title: String(b.title || ""),
        chamberOrigin: origin,
        changeHash: String(b.change_hash || c.hash),
        status: typeof b.status === "number" ? b.status : null,
        statusDate: b.status_date ? new Date(b.status_date) : null,
        lastActionDate: last?.date ? new Date(last.date) : null,
        lastActionText: last?.action || null,
        passedHouse,
        passedSenate,
      },
      update: {
        title: String(b.title || ""),
        chamberOrigin: origin,
        changeHash: String(b.change_hash || c.hash),
        status: typeof b.status === "number" ? b.status : null,
        statusDate: b.status_date ? new Date(b.status_date) : null,
        lastActionDate: last?.date ? new Date(last.date) : null,
        lastActionText: last?.action || null,
        passedHouse,
        passedSenate,
      },
    });

    for (const s of b.sponsors || []) {
      const sponsorId = String(s.people_id ?? `${b.bill_id}:${s.name}`);

      await prisma.sponsor.upsert({
        where: { id: sponsorId },
        create: {
          id: sponsorId,
          name: String(s.name || ""),
          party: s.party ? String(s.party) : null,
          chamber: s.role ? normalizeChamber(s.role) : null,
          district: s.district ? String(s.district) : null,
        },
        update: {
          name: String(s.name || ""),
          party: s.party ? String(s.party) : null,
          district: s.district ? String(s.district) : null,
        },
      });

      await prisma.sponsorOnBill.upsert({
        where: { billId_sponsorId: { billId: String(b.bill_id), sponsorId } },
        create: {
          billId: String(b.bill_id),
          sponsorId,
          isPrimary: String(s.sponsor_type || "").toLowerCase() === "primary",
        },
        update: {
          isPrimary: String(s.sponsor_type || "").toLowerCase() === "primary",
        },
      });
    }

    updated++;
  }

  return NextResponse.json({
    ok: true,
    session: session.session_title || session.session_name,
    checked: items.length,
    changed: changed.length,
    updated,
  });
}
