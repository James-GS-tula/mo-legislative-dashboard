import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const byChamber = await prisma.bill.groupBy({
    by: ["chamberOrigin"],
    _count: { _all: true },
  });

  const passedHouse = await prisma.bill.count({ where: { passedHouse: true } });
  const passedSenate = await prisma.bill.count({ where: { passedSenate: true } });

  const rows = await prisma.sponsorOnBill.findMany({
    where: { isPrimary: true },
    include: { sponsor: true, bill: true },
    take: 250000,
  });

  const byParty: Record<string, { total: number; houseOrigin: number; senateOrigin: number }> = {};
  for (const r of rows) {
    const party = r.sponsor.party || "Unknown";
    byParty[party] ||= { total: 0, houseOrigin: 0, senateOrigin: 0 };
    byParty[party].total++;
    if (r.bill.chamberOrigin === "house") byParty[party].houseOrigin++;
    if (r.bill.chamberOrigin === "senate") byParty[party].senateOrigin++;
  }

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    byChamber,
    passed: { house: passedHouse, senate: passedSenate },
    byParty,
  });
}
