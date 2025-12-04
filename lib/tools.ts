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

const subtract = tool(
    ({ a, b }) => a - b,
    {
        name: "subtract",
        description: "subtract numbers",
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

export const get_weather = tool(
    async ({ city }) => {
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
        )}`;

        // 1. Get coordinates
        const geoRes = await fetch(geoURL);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return `Could not find location: ${city}`;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Fetch weather for coordinates
        const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

        const weatherRes = await fetch(weatherURL);
        const weatherData = await weatherRes.json();

        const w = weatherData.current_weather;

        return `
            Weather in ${name}, ${country}:
            Temperature: ${w.temperature}°C
            Wind Speed: ${w.windspeed} km/h
            Condition Code: ${w.weathercode}
        `;
    },
    {
        name: "get_weather",
        description: "Get current real weather for any city",
        schema: z.object({
            city: z.string().describe("City name to fetch weather"),
        }),
    }
);

export const summarize_file = tool(
    async ({ content, fileName }) => {
        // Return formatted content for LLM to process
        return `File "${fileName}" content:\n\n${content}`;
    },
    {
        name: "summarize_file",
        description: "Summarize the contents of an uploaded file",
        schema: z.object({
            content: z.string().describe("The file content to summarize"),
            fileName: z.string().describe("Name of the file"),
        }),
    }
);


export const toolsByName: Record<string, StructuredToolInterface> = {
    add,
    subtract,
    multiply,
    divide,
    get_weather,
    summarize_file
};