/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { toolsByName } from "./tools";
import * as z from "zod";
import { registry } from "@langchain/langgraph/zod";
import { MessagesZodMeta } from "@langchain/langgraph";
import {
    SystemMessage,
    AIMessage,
    ToolMessage,
    BaseMessage,
} from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";


const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY!,
    model: "models/gemini-2.5-pro",
    maxOutputTokens: 2048,
});

const modelWithTools = model.bindTools(Object.values(toolsByName));

const MessagesState = z.object({
    messages: z
        .custom()
        .register(registry, MessagesZodMeta as any),
    memory: z.array(z.any()).optional(),
    llmCalls: z.number().optional(),
});

// ⭐ Extract correct Graph State Type
export type LGState = z.infer<typeof MessagesState>;

/* -------------------------------------------------------
   4. LLM Node
------------------------------------------------------- */
async function llmCall(state: LGState): Promise<LGState> {
    const prevMessages = state.messages as BaseMessage[];
    const prevConv = state.memory ?? [];


    const response = await modelWithTools.invoke([
        new SystemMessage("You are a helpful assistant that performs arithmetic."),
        ...prevConv,
        ...prevMessages,
    ]);

    return {
        messages: [response],
        memory: [...prevConv, ...prevMessages, response],
        llmCalls: (state.llmCalls ?? 0) + 1,
    };
}

/* -------------------------------------------------------
   5. Tool Node
------------------------------------------------------- */
async function toolNode(state: LGState): Promise<LGState> {
    const last = (state.messages as BaseMessage[]).at(-1);

    if (!last || !(last instanceof AIMessage)) {
        return { messages: [] };
    }

    const outputs: ToolMessage[] = [];

    for (const call of last.tool_calls ?? []) {
        const tool = toolsByName[call.name];
        const result = await tool.invoke(call.args);

        outputs.push(
            new ToolMessage({
                tool_call_id: call.id ?? "",
                content: result,
            })
        );
    }

    return { messages: outputs };
}

/* -------------------------------------------------------
   6. Conditional Routing
------------------------------------------------------- */
async function shouldContinue(
    state: LGState
): Promise<"toolNode" | "__end__"> {
    const last = (state.messages as BaseMessage[]).at(-1);

    if (!last || !(last instanceof AIMessage)) return "__end__";

    if (last.tool_calls?.length) return "toolNode";

    return "__end__";
}

/* -------------------------------------------------------
   7. Build LangGraph Agent
------------------------------------------------------- */
export const agent = new StateGraph(MessagesState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
    .addEdge("toolNode", "llmCall")
    .compile();