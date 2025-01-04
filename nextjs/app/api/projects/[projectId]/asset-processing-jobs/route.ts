import { db } from "@/server/db";
import { assetProcessingJobTable } from "@/server/db/schema";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // Auth check
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assetProcessingJobs = await db
      .select()
      .from(assetProcessingJobTable)
      .where(eq(assetProcessingJobTable.projectId, projectId))
      .execute();

    return NextResponse.json(assetProcessingJobs);
  } catch (error) {
    console.error("Failed to fetch asset processing jobs", error);
    return NextResponse.json(
      { error: "Failed to fetch asset processing jobs" },
      { status: 500 }
    );
  }
}
