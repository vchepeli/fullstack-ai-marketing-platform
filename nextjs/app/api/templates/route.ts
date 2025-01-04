import { db } from "@/server/db";
import { templatesTable } from "@/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.userId, userId))
      .orderBy(templatesTable.updatedAt);

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
