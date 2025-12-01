// LangChain + Google
import { tool, StructuredToolInterface } from "@langchain/core/tools";

// Zod & LangGraph
import * as z from "zod";

/* -------------------------------------------------------
   1. Tool Schemas & Definitions
------------------------------------------------------- */
const add = tool(
    ({ a, b }) => a + b,
    {
        name: "add",
        description: "Add two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

const multiply = tool(
    ({ a, b }) => a * b,
    {
        name: "multiply",
        description: "Multiply two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

const divide = tool(
    ({ a, b }) => a / b,
    {
        name: "divide",
        description: "Divide two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

export const toolsByName: Record<string, StructuredToolInterface> = {
    add,
    multiply,
    divide,
};