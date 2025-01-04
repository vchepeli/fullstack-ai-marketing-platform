import { db } from "@/server/db";
import { generatedContentTable, projectsTable } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// !!VERY IMPORTANT!!
export const maxDuration = 60; // seconds

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const generatedContent = await db
      .select()
      .from(generatedContentTable)
      .where(eq(generatedContentTable.projectId, params.projectId))
      .orderBy(generatedContentTable.order);

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch generated content" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    const project = await db.query.projectsTable.findFirst({
      where: eq(projectsTable.id, projectId),
      with: {
        assets: true,
        prompts: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { assets, prompts } = project;

    const contentFromAssets = assets.map((asset) => asset.content).join("\n\n");

    const models = ["gpt-4o", "gpt-4o-mini"];

    const generatedContentPromises = prompts.map(async (prompt) => {
      let text = "";
      let success = false;

      for (const model of models) {
        try {
          const response = await generateText({
            model: openai(model),
            system: "You are a content generation assistant",
            prompt: `
            Use the following prompt and summary to generate new content:
            ** PROMPT:
            ${prompt.prompt}
            ---------------------
            ** SUMMARY:
            ${contentFromAssets}
            `,
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          });

          text = response.text;
          success = true;
          console.log(`Generated content using ${model}`);
          break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(`Failed to generate content using ${model}`, error);

          // Check if error is retryable
          if (
            error.statusCode === 503 ||
            error.statusCode === 429 ||
            error.message.includes("overloaded")
          ) {
            continue;
          } else {
            throw error;
          }
        }
      }

      if (!success) {
        throw new Error("Failed to generate content");
      }

      const [insertedContent] = await db
        .insert(generatedContentTable)
        .values({
          projectId,
          name: prompt.name,
          result: text,
          order: prompt.order,
        })
        .returning();

      return insertedContent;
    });

    const insertedContentList = await Promise.all(generatedContentPromises);

    return NextResponse.json(insertedContentList, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(generatedContentTable)
        .where(eq(generatedContentTable.projectId, params.projectId));
    });

    return NextResponse.json(
      { message: "Generated content deleted" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete generated content" },
      { status: 500 }
    );
  }
}

const updateGeneratedContentSchema = z.object({
  id: z.string().uuid(),
  result: z.string().min(1, "Result is required"),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parseResults = updateGeneratedContentSchema.safeParse(body);
    if (!parseResults.success) {
      return NextResponse.json({ error: parseResults.error }, { status: 400 });
    }

    const { id, result } = parseResults.data;

    const updatedContent = await db
      .update(generatedContentTable)
      .set({ result })
      .where(eq(generatedContentTable.id, id))
      .returning();

    if (updatedContent.length === 0) {
      return NextResponse.json(
        { error: "Generated content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedContent[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update generated content" },
      { status: 500 }
    );
  }
}
