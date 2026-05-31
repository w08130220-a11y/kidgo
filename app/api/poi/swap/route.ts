/**
 * POST /api/poi/swap
 * 給 chat 客戶端「換一個」按鈕用. 不再從 client 5MB pois 池抓, 改 server query DB.
 *
 * Body: { category, excludeIds, minAge, maxAge }
 * Response: { poi }
 */
import { NextResponse } from "next/server";
import { getSwapCandidate } from "@/lib/poi-queries";
import type { PoiCategory } from "@/lib/mock-data";

export async function POST(req: Request) {
  let body: {
    category?: PoiCategory;
    excludeIds?: string[];
    minAge?: number;
    maxAge?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const poi = await getSwapCandidate({
    category: body.category,
    excludeIds: body.excludeIds ?? [],
    minAge: body.minAge ?? 0,
    maxAge: body.maxAge ?? 99,
  });

  if (!poi) {
    return NextResponse.json({ error: "沒有其他符合條件的選項可換" }, { status: 404 });
  }

  return NextResponse.json({ poi });
}
