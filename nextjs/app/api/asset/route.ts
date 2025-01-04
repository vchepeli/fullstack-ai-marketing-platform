import { db } from "@/server/db";
import { assetTable } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import z from "zod";

const updateAssetSchema = z.object({
  content: z.string(),
  tokenCount: z.number(),
});

export async function GET(request: NextRequest) {
  console.log("Fetching asset...");
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json(
      { error: "Missing assetId parameter" },
      { status: 400 }
    );
  }

  try {
    const asset = await db
      .select()
      .from(assetTable)
      .where(eq(assetTable.id, assetId))
      .execute();

    if (asset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset[0]);
  } catch (error) {
    console.error("Error fetching asset", error);
    return NextResponse.json(
      { error: "Error fetching asset" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  console.log("Updating asset...");
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json(
      { error: "Missing assetId parameter" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const updatedAsset = updateAssetSchema.safeParse(body);

  if (!updatedAsset.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    await db
      .update(assetTable)
      .set(updatedAsset.data)
      .where(eq(assetTable.id, assetId))
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating asset", error);
    return NextResponse.json(
      { error: "Error updating asset" },
      { status: 500 }
    );
  }
}
