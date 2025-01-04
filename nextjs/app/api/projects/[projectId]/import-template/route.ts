import { db } from "@/server/db";
import { promptsTable, templatePromptsTable } from "@/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.projectId;

  try {
    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Fetch template prompts
    const templatePrompts = await db
      .select()
      .from(templatePromptsTable)
      .where(eq(templatePromptsTable.templateId, templateId))
      .orderBy(templatePromptsTable.order);

    // Fetch all existing project prompts
    const existingPrompts = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.projectId, projectId));

    const startOrder = existingPrompts.length;

    // Insert template prompts as project prompts
    const newProjectPrompts = await db
      .insert(promptsTable)
      .values(
        templatePrompts.map((tp, index) => ({
          projectId,
          name: tp.name,
          prompt: tp.prompt,
          order: startOrder + index,
        }))
      )
      .returning();

    return NextResponse.json(newProjectPrompts);
  } catch (error) {
    console.error("Failed to import template prompts:", error);
    return NextResponse.json(
      { error: "Failed to import template prompts" },
      { status: 500 }
    );
  }
}
