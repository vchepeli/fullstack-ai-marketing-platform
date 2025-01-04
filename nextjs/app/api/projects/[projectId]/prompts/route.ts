import { db } from "@/server/db";
import { promptsTable } from "@/server/db/schema";
import { getPromptTokenCount } from "@/utils/token-helper";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const newPromptSchema = z.object({
  name: z.string().default("New Prompt"),
  prompt: z.string().default(""),
  order: z.number().default(0),
  tokenCount: z.number().default(0),
});

const updatePromptSchema = newPromptSchema.extend({
  id: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;

    const json = await request.json();
    const parsedPrompt = newPromptSchema.safeParse(json);

    if (!parsedPrompt.success) {
      return NextResponse.json({ error: parsedPrompt.error }, { status: 400 });
    }

    const promptData = parsedPrompt.data;

    const [newPrompt] = await db
      .insert(promptsTable)
      .values({ ...promptData, projectId })
      .returning();

    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  try {
    const prompts = await db.query.promptsTable.findMany({
      where: eq(promptsTable.projectId, projectId),
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.projectId;
  const url = new URL(request.url);
  const promptId = url.searchParams.get("promptId");

  if (!promptId) {
    return NextResponse.json(
      { error: "promptId is required" },
      { status: 400 }
    );
  }

  try {
    const deletedPrompt = await db
      .delete(promptsTable)
      .where(
        and(
          eq(promptsTable.projectId, projectId),
          eq(promptsTable.id, promptId)
        )
      )
      .returning();

    if (deletedPrompt.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.projectId;
  const json = await req.json();

  const parsedPrompt = updatePromptSchema.safeParse(json);
  if (!parsedPrompt.success) {
    return NextResponse.json({ error: parsedPrompt.error }, { status: 400 });
  }

  const { id, name, prompt: promptText, order } = parsedPrompt.data;

  const tokenCount = getPromptTokenCount(promptText);

  const updatedPrompt = await db
    .update(promptsTable)
    .set({
      name,
      prompt: promptText,
      order,
      tokenCount,
    })
    .where(and(eq(promptsTable.projectId, projectId), eq(promptsTable.id, id)))
    .returning();

  if (updatedPrompt.length === 0) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  return NextResponse.json(updatedPrompt[0]);
}
