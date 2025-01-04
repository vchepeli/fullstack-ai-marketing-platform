import { db } from "@/server/db";
import { assetProcessingJobTable } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateAssetJobSchema = z.object({
  status: z
    .enum([
      "created",
      "in_progress",
      "failed",
      "completed",
      "max_attempts_exceeded",
    ])
    .optional(),
  errorMessage: z.string().optional(),
  attempts: z.number().optional(),
  lastHeartBeat: z.string().optional(),
});

export async function GET() {
  console.log("Fetching asset processing job that are not in a terminal state");

  try {
    const availableJobs = await db
      .select()
      .from(assetProcessingJobTable)
      .where(
        inArray(
          assetProcessingJobTable.status,
          // non-terminal states
          ["created", "failed", "in_progress"]
        )
      )
      .execute();

    return NextResponse.json(availableJobs);
  } catch (error) {
    console.error("Error fetching asset processing jobs", error);
    return NextResponse.json(
      { error: "Error fetching asset processing jobs" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateAssetJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, errorMessage, attempts, lastHeartBeat } =
      validationResult.data;

    const updatedJob = await db
      .update(assetProcessingJobTable)
      .set({
        status,
        errorMessage,
        attempts,
        lastHeartBeat: lastHeartBeat ? new Date(lastHeartBeat) : undefined,
      })
      .where(eq(assetProcessingJobTable.id, jobId))
      .returning();

    if (updatedJob.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(updatedJob[0]);
  } catch (error) {
    console.error("Error updating asset processing job", error);
    return NextResponse.json(
      { error: "Error updating asset processing job" },
      { status: 500 }
    );
  }
}
