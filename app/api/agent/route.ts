/* eslint-disable @typescript-eslint/no-explicit-any */
// Next.js Response
import { NextResponse } from "next/server";
// Messages
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { agent, LGState } from "@/lib/agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, memory = [], fileContent, fileName } = body; // 👈 accept file data

    // Build the query message
    let userQuery = query;
    
    // If file content is provided, append it to the query
    if (fileContent && fileName) {
      userQuery = `${query}\n\n[File uploaded: ${fileName}]\nFile content:\n${fileContent}`;
    }

    const result = (await agent.invoke({
      messages: [new HumanMessage(userQuery)],
      memory,
    })) as LGState;

    const finalMsg = (result.messages as BaseMessage[]).at(-1);

    return NextResponse.json({
      response: (finalMsg as any)?.text ?? "No response generated",
      memory: result.memory ?? [],
      meta: { llmCalls: result.llmCalls },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "An error occurred" },
      { status: 500 }
    );
  }
}