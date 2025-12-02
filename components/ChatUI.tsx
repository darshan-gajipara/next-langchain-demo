/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Send, RotateCcw } from "lucide-react";

// Strict message type
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([]);
  
  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Check file type - only text-based files
    const allowedExtensions = /\.(txt|md|json|csv|js|jsx|ts|tsx|py|java|cpp|c|html|css|xml|yml|yaml|pdf|docx)$/i;

    if (!file.name.match(allowedExtensions)) {
      alert("Please upload a text-based file:\nTXT, MD, JSON, CSV, or Code files (JS, TS, PY, etc.)");
      return;
    }

    setUploadedFile(file);
    setFileLoading(true);

    try {
      // Create FormData and send to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse file');
      }

      const data = await response.json();
      setFileContent(data.content);
      setInput(`Summarize this file: ${file.name}`);
      
    } catch (error: any) {
      alert(`Error reading file: ${error.message}`);
      removeFile();
    } finally {
      setFileLoading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { 
      role: "user", 
      text: uploadedFile ? `${input} [File: ${uploadedFile.name}]` : input 
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    
    const currentInput = input;
    const currentFileContent = fileContent;
    const currentFileName = uploadedFile?.name;
    
    setInput("");
    removeFile(); // Clear file after sending

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        body: JSON.stringify({ 
          query: currentInput, 
          memory: memory,
          fileContent: currentFileContent || undefined,
          fileName: currentFileName || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await res.json();
      setMemory(data.memory);

      const botMessage: ChatMessage = {
        role: "assistant",
        text: data.response ?? "No response generated",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        text: "Error: " + err.message,
      };
      setMessages((prev) => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'json') return '📊';
    if (ext === 'csv') return '📈';
    if (ext === 'md') return '📝';
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) return '⚛️';
    if (['py'].includes(ext || '')) return '🐍';
    if (['java'].includes(ext || '')) return '☕';
    if (['cpp', 'c'].includes(ext || '')) return '⚙️';
    if (['html', 'css'].includes(ext || '')) return '🌐';
    return '📄';
  };

  const handleReset = () => {
    setMessages([]);
    setMemory([]);
    removeFile();
    setInput("");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-4xl border shadow-2xl rounded-2xl overflow-hidden ">
        <CardHeader className="bg-linear-to-r from-blue-600 to-purple-600 text-white pb-6">
          <CardTitle className="text-3xl font-bold text-center">
            🤖 LangGraph AI Assistant
          </CardTitle>
          <p className="text-sm text-center text-blue-100 mt-2">
            Powered by LangChain & Google Gemini
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              ➕ Arithmetic
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              🌤️ Weather
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              📄 Text/PDF/DOCX Files
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              💻 Code Analysis
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col h-[65vh] p-4">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-xl bg-white dark:bg-slate-950 shadow-inner">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                <p className="text-sm max-w-md mb-4">
                  Ask me to do calculations, check weather, or upload a text file to analyze!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-left">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Math</p>
                    <p className="text-xs">What is 125 × 48?</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-left">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Weather</p>
                    <p className="text-xs">Weather in London</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-left">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Files</p>
                    <p className="text-xs">Upload & summarize file/code</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-left">
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Analysis</p>
                    <p className="text-xs">Analyze JSON or CSV data</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                    msg.role === "user"
                      ? "bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-br-none"
                      : "bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>AI is thinking...</span>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          {uploadedFile && (
            <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 text-sm flex-1 min-w-0">
                <span className="text-3xl">{getFileIcon(uploadedFile.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-slate-900 dark:text-slate-100">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                    {fileLoading && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {!fileLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              )}
            </div>
          )}

          {/* Input Box */}
          <div className="mt-4 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.xml,.yml,.yaml,.pdf,.docx"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || fileLoading}
              title="Upload text file (TXT, MD, JSON, CSV, Code)"
              className="shrink-0 hover:bg-blue-50 dark:hover:bg-blue-950 border-2"
            >
              <Upload className="w-4 h-4" />
            </Button>

            <Input
              placeholder="Ask anything or upload a text file..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && !fileLoading && sendMessage()}
              disabled={fileLoading}
              className="flex-1 border-2 focus:ring-2 focus:ring-blue-500"
            />
            
            <Button 
              onClick={sendMessage} 
              disabled={loading || fileLoading || !input.trim()}
              className="shrink-0 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading || fileLoading}
              className="shrink-0 border-2 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}