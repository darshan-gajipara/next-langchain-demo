export const runtime = "nodejs";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Important: use this sub-path in Next.js route handlers to avoid issues. [web:1]
import pdfParse from "pdf-parse";
import mammoth from "mammoth"; // DOCX -> text [web:27]

// If you get TS error "Could not find a declaration file for module 'pdf-parse/lib/pdf-parse'",
// create a file "pdf-parse.d.ts" in your src root with:
// declare module "pdf-parse/lib/pdf-parse" {
//   const pdfParse: any;
//   export default pdfParse;
// }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    // Read common binary representation once
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content = "";

    const textBasedExtensions = [
      "txt",
      "md",
      "json",
      "csv",
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "html",
      "css",
      "xml",
      "yml",
      "yaml",
    ];

    if (textBasedExtensions.includes(extension)) {
      // Regular text-like files
      content = await file.text();
    } else if (extension === "pdf") {
      // PDF -> text using pdf-parse [web:1][web:28]
      const data = await pdfParse(buffer);
      content = data.text || "";
    } else if (extension === "docx") {
      // DOCX -> raw text using mammoth [web:26][web:27]
      const result = await mammoth.extractRawText({ buffer });
      content = result.value || "";
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload text, PDF, or DOCX files only.",
        },
        { status: 400 }
      );
    }

    // Truncate if too large
    if (content.length > 50000) {
      content =
        content.substring(0, 50000) +
        "\n\n[Content truncated due to size...]";
    }

    return NextResponse.json({
      content,
      fileName,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("File parsing error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to parse file" },
      { status: 500 }
    );
  }
}
