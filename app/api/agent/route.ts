/* eslint-disable @typescript-eslint/no-explicit-any */

// Next.js Response
import { NextResponse } from "next/server";
// Messages
import {
    HumanMessage,
    BaseMessage,
} from "@langchain/core/messages";
import { agent, LGState } from "@/lib/agent";


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { query, memory = [] } = body;   // 👈 accept memory from UI

    const result = (await agent.invoke({
      messages: [new HumanMessage(query)],
      memory,                                // 👈 pass old memory into agent
    })) as LGState;

    const finalMsg = (result.messages as BaseMessage[]).at(-1);

    return NextResponse.json({
      response: (finalMsg as any)?.text ?? "No response generated",
      memory: result.memory ?? [],           // 👈 return updated memory
      meta: { llmCalls: result.llmCalls },
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "An error occurred" },
      { status: 500 }
    );
  }
}

